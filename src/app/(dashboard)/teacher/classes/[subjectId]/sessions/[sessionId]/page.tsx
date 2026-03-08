'use client';

import { use, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Pencil, Radio, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cAttendApi } from '@/lib/api/cAttend';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import type { ClassSession, User, StudentCAttendEntry } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  SessionStatusBadge,
  getCAttendStatus,
} from '@/components/features/sessions/SessionStatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OverrideModal } from '@/components/features/attendance/OverrideModal';
import { useT } from '@/hooks/use-t';

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useCallback(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function StatusBadge({ status }: { status?: string }) {
  const { t } = useT();
  if (status === 'CM')
    return <Badge className="bg-green-100 text-green-700 border-green-200">CM</Badge>;
  if (status === 'CP')
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">CP</Badge>;
  if (status === 'KP') return <Badge className="bg-red-100 text-red-700 border-red-200">KP</Badge>;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {t('studentSessions.attendStatus.notMarked')}
    </Badge>
  );
}

interface PageProps {
  params: Promise<{ subjectId: string; sessionId: string }>;
}

export default function TeacherSessionDetailPage({ params }: PageProps) {
  const { subjectId, sessionId } = use(params);
  const { subject, classSessions } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [overrideStudent, setOverrideStudent] = useState<StudentCAttendEntry | User | null>(null);

  useSubjectRoom(user?._id, subjectId);

  const { data: cAttend, isLoading: loadingSession } = useQuery({
    queryKey: queryKeys.cAttend.byId(sessionId),
    queryFn: () => cAttendApi.getById(sessionId),
    refetchInterval: (query) => (query.state.data?.isActive ? 10_000 : false),
  });

  // Students who have a record (with status)
  const { data: checkedInStudents = [], isLoading: loadingCheckedIn } = useQuery({
    queryKey: queryKeys.cAttend.students(sessionId),
    queryFn: () => cAttendApi.getStudents(sessionId),
    staleTime: 15_000,
  });

  // All subject students (to show those without a record too)
  const { data: allStudents = [], isLoading: loadingAll } = useQuery({
    queryKey: queryKeys.subjects.students(subjectId),
    queryFn: () => subjectsApi.getStudents(subjectId),
    staleTime: 60_000,
  });

  // Merge: for each subject student, find their record status
  const checkedInMap = new Map(checkedInStudents.map((s) => [s._id, s]));
  const mergedStudents: Array<{ student: User; entry?: StudentCAttendEntry }> = allStudents.map(
    (s) => ({ student: s, entry: checkedInMap.get(s._id) })
  );
  const unmarkedStudents = mergedStudents.filter(
    (r) => !r.entry || (r.entry.status !== 'CM' && r.entry.status !== 'CP')
  );

  const refetchAttendance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.students(sessionId) });
  }, [queryClient, sessionId]);

  const handleNewAttendance = useCallback(
    (data: { student: User; index: number; status: string }) => {
      queryClient.setQueryData<StudentCAttendEntry[]>(
        queryKeys.cAttend.students(sessionId),
        (old = []) => {
          const existing = old.find((s) => s._id === data.student._id);
          if (existing) {
            return old.map((s) =>
              s._id === data.student._id
                ? { ...s, status: data.status as StudentCAttendEntry['status'] }
                : s
            );
          }
          return [
            ...old,
            {
              ...(data.student as StudentCAttendEntry),
              status: data.status as StudentCAttendEntry['status'],
              listStatus: [],
            },
          ];
        }
      );
    },
    [queryClient, sessionId]
  );

  useSocketEvent('receiveUserAttendance', handleNewAttendance);

  const status = cAttend ? getCAttendStatus(cAttend) : null;
  const elapsed = useElapsedTimer(status === 'live');

  const cs: ClassSession | null = cAttend
    ? typeof cAttend.classSessionId !== 'string'
      ? (cAttend.classSessionId as ClassSession)
      : (classSessions.find((s) => s._id === cAttend.classSessionId) ?? null)
    : null;

  const activateMutation = useMutation({
    mutationFn: () => cAttendApi.activate(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.byId(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
      toast.success(t('sessions.detail.activateSuccess'));
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? t('subjects.create.errorToast')),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => cAttendApi.deactivate(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.byId(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
      toast.success(t('sessions.detail.deactivateSuccess'));
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? t('subjects.create.errorToast')),
  });

  const closeMutation = useMutation({
    mutationFn: () => cAttendApi.close(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.byId(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
      toast.success(t('sessions.detail.closeSuccess'));
      setCloseDialogOpen(false);
    },
    onError: (error: { message?: string }) =>
      toast.error(error.message ?? t('subjects.create.errorToast')),
  });

  const bulkAbsentMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        unmarkedStudents.map(({ student }) =>
          attendRecordsApi.addForStudent({
            cAttendId: sessionId,
            studentId: student._id,
            status: 'KP',
          })
        )
      );
    },
    onSuccess: () => {
      toast.success(t('sessions.detail.bulkAbsentSuccess'));
      refetchAttendance();
      setBulkDialogOpen(false);
    },
    onError: () => toast.error(t('subjects.create.errorToast')),
  });

  const isLoading = loadingSession || loadingCheckedIn || loadingAll;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!cAttend) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('sessions.detail.sessionNotFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/teacher/classes/${subjectId}/sessions`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('sessions.detail.backToSessions')}
      </Link>

      {/* Session info */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">
              {t('sessions.detail.title', { n: String(cAttend.sessionNumber) })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(cAttend.date).toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
              {cs && ` · ${cs.start}–${cs.end} · Phòng ${cs.room}`}
            </p>
          </div>
          <SessionStatusBadge status={status ?? 'upcoming'} />
        </div>

        {/* Control panel */}
        {status === 'ended' ? (
          <p className="text-sm text-muted-foreground">{t('sessions.detail.ended')}</p>
        ) : status === 'live' ? (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {t('sessions.detail.liveStatus')}
              </span>
              <span className="text-sm text-muted-foreground">· {elapsed}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/teacher/classes/${subjectId}/sessions/${sessionId}/live`}
                className="text-sm text-primary hover:underline"
              >
                {t('sessions.detail.viewLive')}
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('sessions.detail.endAttendanceBtn')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}>
              {activateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('sessions.detail.startAttendanceBtn')}
            </Button>
            <Button variant="outline" onClick={() => setCloseDialogOpen(true)}>
              {t('sessions.detail.completeBtn')}
            </Button>
          </div>
        )}
      </div>

      {/* Attendance table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-neutral-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {t('sessions.detail.attendanceListTitle')} (
              {`${checkedInStudents.length}/${allStudents.length}`})
            </span>
          </div>
          {unmarkedStudents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDialogOpen(true)}
              disabled={bulkAbsentMutation.isPending}
            >
              {bulkAbsentMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {t('sessions.detail.markAllAbsentBtn')}
            </Button>
          )}
        </div>

        {allStudents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('sessions.detail.noStudents')}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  {t('sessions.detail.studentCol')}
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  {t('sessions.detail.codeCol')}
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  {t('sessions.detail.statusCol')}
                </th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mergedStudents.map(({ student, entry }) => (
                <tr key={student._id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="text-xs">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{student.userCode}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={entry?.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="p-1 rounded hover:bg-neutral-100 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setOverrideStudent(entry ?? student)}
                      title={t('sessions.detail.editAttendanceTitle')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Close session confirmation */}
      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title={t('sessions.detail.completeDialog.title')}
        description={t('sessions.detail.completeDialog.description')}
        confirmLabel={t('sessions.detail.completeDialog.confirmBtn')}
        cancelLabel={t('sessions.detail.completeDialog.cancelBtn')}
        onConfirm={() => closeMutation.mutate()}
        isLoading={closeMutation.isPending}
      />

      {/* Bulk mark absent confirmation */}
      <ConfirmDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        title={t('sessions.detail.bulkAbsentDialog.title')}
        description={t('sessions.detail.bulkAbsentDialog.description', {
          count: String(unmarkedStudents.length),
        })}
        confirmLabel={t('sessions.detail.bulkAbsentDialog.confirmBtn')}
        cancelLabel={t('sessions.detail.bulkAbsentDialog.cancelBtn')}
        onConfirm={() => bulkAbsentMutation.mutate()}
        isLoading={bulkAbsentMutation.isPending}
        destructive
      />

      {/* Override modal */}
      {overrideStudent && (
        <OverrideModal
          open={!!overrideStudent}
          onOpenChange={(open) => {
            if (!open) setOverrideStudent(null);
          }}
          student={overrideStudent}
          cAttendId={sessionId}
          sessionDate={cAttend.date}
          currentStatus={'status' in overrideStudent ? overrideStudent.status : undefined}
          onSuccess={refetchAttendance}
        />
      )}
    </div>
  );
}
