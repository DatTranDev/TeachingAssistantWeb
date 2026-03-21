'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cAttendApi } from '@/lib/api/cAttend';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import type { User } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCAttendStatus } from '@/components/features/sessions/SessionStatusBadge';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

interface StudentTile {
  _id: string;
  name: string;
  userCode: string;
  avatar: string;
  checkedIn: boolean;
}

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

interface PageProps {
  params: Promise<{ subjectId: string; sessionId: string }>;
}

export default function LiveAttendancePage({ params }: PageProps) {
  const { subjectId, sessionId } = use(params);
  const { subject } = useSubject();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [tiles, setTiles] = useState<StudentTile[]>([]);

  useSubjectRoom(user?._id, subjectId);

  const { data: cAttend, isLoading: loadingSession } = useQuery({
    queryKey: queryKeys.cAttend.byId(sessionId),
    queryFn: () => cAttendApi.getById(sessionId),
    refetchInterval: (query) => (query.state.data?.isActive ? 5_000 : false),
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: queryKeys.subjects.students(subjectId),
    queryFn: () => subjectsApi.getStudents(subjectId),
    staleTime: 60_000,
  });

  const { data: attendedStudents = [], isLoading: loadingAttended } = useQuery({
    queryKey: queryKeys.cAttend.students(sessionId),
    queryFn: () => cAttendApi.getStudents(sessionId),
    staleTime: 10_000,
  });

  // Auto-redirect if session not live
  useEffect(() => {
    if (!loadingSession && cAttend && !cAttend.isActive) {
      router.replace(`/teacher/classes/${subjectId}/sessions/${sessionId}`);
    }
  }, [cAttend, loadingSession, router, subjectId, sessionId]);

  // Initialise tiles from students + attended list
  useEffect(() => {
    if (!students.length) return;
    const attendedIds = new Set(attendedStudents.map((s: User) => s._id));
    setTiles(
      students.map((s) => ({
        _id: s._id,
        name: s.name,
        userCode: s.userCode,
        avatar: s.avatar,
        checkedIn: attendedIds.has(s._id),
      }))
    );
  }, [students, attendedStudents]);

  // Real-time handler
  const handleNewAttendance = useCallback(
    (data: { student: User; index: number; status: string }) => {
      setTiles((prev) =>
        prev.map((t) => (t._id === data.student._id ? { ...t, checkedIn: true } : t))
      );
    },
    []
  );
  useSocketEvent('receiveUserAttendance', handleNewAttendance);

  const status = cAttend ? getCAttendStatus(cAttend) : null;
  const elapsed = useElapsedTimer(status === 'live');

  const checkedInCount = tiles.filter((t) => t.checkedIn).length;
  const totalCount = tiles.length;
  const pct = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const deactivateMutation = useMutation({
    mutationFn: () => cAttendApi.deactivate(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.byId(sessionId) });
      toast.success(t('sessions.live.deactivateSuccess'));
      router.replace(`/teacher/classes/${subjectId}/sessions/${sessionId}`);
    },
    onError: (error: { message?: string }) => toast.error(error.message ?? 'Lỗi'),
  });

  const closeMutation = useMutation({
    mutationFn: () => cAttendApi.close(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.byId(sessionId) });
      toast.success(t('sessions.live.closeSuccess'));
      setCloseDialogOpen(false);
      router.replace(`/teacher/classes/${subjectId}/sessions`);
    },
    onError: (error: { message?: string }) => toast.error(error.message ?? 'Lỗi'),
  });

  const isLoading = loadingSession || loadingStudents || loadingAttended;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-6 w-full rounded-full" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/classes/${subjectId}/sessions/${sessionId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('sessions.live.back')}
          </Link>
          {status === 'live' && (
            <div className="flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {t('sessions.live.recording')}
              </span>
              <span className="text-sm text-muted-foreground">· {elapsed}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {status === 'live' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('sessions.live.endAttendanceBtn')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setCloseDialogOpen(true)}>
            {t('sessions.live.completeBtn')}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('sessions.live.attendanceLabel')}</span>
          <span className="font-medium">
            {checkedInCount} / {totalCount}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Student grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile._id}
            className={cn(
              'rounded-xl border p-2 text-center transition-colors duration-300 space-y-1',
              tile.checkedIn ? 'border-green-300 bg-green-50' : 'border-neutral-200 bg-neutral-50'
            )}
          >
            <div className="relative inline-flex">
              <Avatar className="h-10 w-10 mx-auto">
                <AvatarImage src={tile.avatar} alt={tile.name} />
                <AvatarFallback className="text-xs">{tile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {tile.checkedIn && (
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-green-600 bg-white rounded-full" />
              )}
            </div>
            <p
              className={cn(
                'text-xs font-medium truncate',
                tile.checkedIn ? 'text-green-700' : 'text-foreground'
              )}
            >
              {tile.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{tile.userCode}</p>
          </div>
        ))}
      </div>

      {tiles.length === 0 && (
        <p className="text-center py-12 text-sm text-muted-foreground">
          {t('sessions.live.noStudents')}
        </p>
      )}

      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title={t('sessions.live.completeDialog.title')}
        description={t('sessions.live.completeDialog.description')}
        confirmLabel={t('sessions.live.completeDialog.confirmBtn')}
        cancelLabel={t('sessions.live.completeDialog.cancelBtn')}
        onConfirm={() => closeMutation.mutate()}
        isLoading={closeMutation.isPending}
      />
    </div>
  );
}
