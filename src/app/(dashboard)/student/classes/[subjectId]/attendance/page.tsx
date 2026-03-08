'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, Loader2, MapPin, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cAttendApi } from '@/lib/api/cAttend';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { absenceRequestsApi } from '@/lib/api/absenceRequests';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import type { CAttend, AttendRecord, AbsenceRequest } from '@/types/domain';
import type { AttendanceMessage } from '@/types/socket';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  SessionStatusBadge,
  getCAttendStatus,
} from '@/components/features/sessions/SessionStatusBadge';
import { AbsenceRequestModal } from '@/components/features/absence/AbsenceRequestModal';
import { cn } from '@/lib/utils';

type CheckInState = 'idle' | 'locating' | 'submitting' | 'done';

function isSameDay(d1: string, d2: string) {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}

export default function StudentAttendancePage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t, locale } = useT();
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [locationDenied, setLocationDenied] = useState(false);
  const [activeCAttend, setActiveCAttend] = useState<CAttend | null>(null);
  const [absenceTarget, setAbsenceTarget] = useState<CAttend | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayIdx = d.getDay() === 0 ? 7 : d.getDay();
    const day = t(`days.short.d${dayIdx}` as Parameters<typeof t>[0]);
    return `${day}, ${d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}`;
  };

  const ATTEND_STATUS_CONFIG = {
    CM: { label: t('studentAttendance.statusPresent'), className: 'bg-green-100 text-green-700' },
    KP: { label: t('studentAttendance.statusAbsent'), className: 'bg-red-100 text-red-700' },
    CP: { label: t('studentAttendance.statusExcused'), className: 'bg-yellow-100 text-yellow-700' },
  } as const;

  const REQUEST_STATUS_CONFIG = {
    pending: {
      label: t('studentAttendance.statusPending'),
      className: 'bg-neutral-100 text-neutral-600',
    },
    approved: {
      label: t('studentAttendance.statusApproved'),
      className: 'bg-green-100 text-green-700',
    },
    rejected: {
      label: t('studentAttendance.statusRejected'),
      className: 'bg-red-100 text-red-700',
    },
  } as const;

  useSubjectRoom(user?._id, subjectId);

  const { data: cAttends = [], isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const { data: myRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, user?._id ?? ''),
    queryFn: () => attendRecordsApi.getByUserAndSubject(subjectId, user!._id),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  const { data: myRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: queryKeys.absenceRequests.byStudent(subjectId),
    queryFn: () => absenceRequestsApi.getByStudent(subjectId),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  // Find active cAttend
  useEffect(() => {
    const active = cAttends.find((c) => c.isActive && !c.isClosed) ?? null;
    setActiveCAttend(active);
  }, [cAttends]);

  const myActiveRecord = activeCAttend
    ? myRecords.find((r: AttendRecord) => {
        const id = typeof r.cAttendId === 'string' ? r.cAttendId : (r.cAttendId as CAttend)._id;
        return id === activeCAttend._id;
      })
    : null;

  const handleReceiveAttendance = useCallback(
    (_data: AttendanceMessage) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveAttendance', handleReceiveAttendance);

  const checkInMutation = useMutation({
    mutationFn: (position: GeolocationPosition) =>
      attendRecordsApi.checkIn({
        cAttendId: activeCAttend!._id,
        studentId: user!._id,
        studentLatitude: position.coords.latitude,
        studentLongitude: position.coords.longitude,
        index: 0,
      }),
    onSuccess: () => {
      toast.success(t('studentAttendance.checkInSuccess'));
      setCheckInState('done');
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, user!._id),
      });
    },
    onError: (error: { message?: string; statusCode?: number }) => {
      const msg = error.message ?? '';
      if (msg.includes('expired') || error.statusCode === 403) {
        toast.error(t('studentAttendance.checkInExpired'));
      } else if (error.statusCode === 409) {
        toast.info(t('studentAttendance.checkInAlready'));
      } else {
        toast.error(msg || t('studentAttendance.checkInOutOfRange'));
      }
      setCheckInState('idle');
    },
  });

  const handleCheckIn = () => {
    if (!activeCAttend || !user) return;
    setLocationDenied(false);
    setCheckInState('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCheckInState('submitting');
        checkInMutation.mutate(position);
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setLocationDenied(true);
        } else {
          toast.error(t('studentAttendance.locationError'));
        }
        setCheckInState('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isLoading = loadingSessions || loadingRecords || loadingRequests;

  const sortedHistory = useMemo(
    () => [...cAttends].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [cAttends]
  );

  const getMyStatus = (cAttend: CAttend) => {
    const record = myRecords.find((r: AttendRecord) => {
      const id = typeof r.cAttendId === 'string' ? r.cAttendId : (r.cAttendId as CAttend)._id;
      return id === cAttend._id;
    });
    return record?.status ?? null;
  };

  const getRequestForSession = (cAttend: CAttend): AbsenceRequest | undefined =>
    myRequests.find((req) => isSameDay(req.date, cAttend.date));

  return (
    <div className="space-y-6">
      {/* Active round card */}
      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : activeCAttend ? (
        myActiveRecord?.status === 'CM' || checkInState === 'done' ? (
          <div className="rounded-2xl border-2 border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-6 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                {t('studentAttendance.checkInDone')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('studentAttendance.sessionLabel', {
                n: String(activeCAttend.sessionNumber),
                date: formatDate(activeCAttend.date),
              })}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-green-800 dark:text-green-400">
                {t('studentAttendance.attendanceOpen')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('studentAttendance.sessionLabel', {
                n: String(activeCAttend.sessionNumber),
                date: formatDate(activeCAttend.date),
              })}
            </p>
            {locationDenied && (
              <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                {t('studentAttendance.locationDenied')}
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckIn}
              disabled={checkInState !== 'idle'}
            >
              {checkInState === 'locating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('studentAttendance.locating')}
                </>
              ) : checkInState === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('studentAttendance.processing')}
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('studentAttendance.checkInBtn')}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t('studentAttendance.locationNote')}
            </p>
          </div>
        )
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:bg-slate-800 p-6 text-center space-y-2">
          <PauseCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">{t('studentAttendance.noActive')}</p>
          <p className="text-sm text-muted-foreground">{t('studentAttendance.waitTeacher')}</p>
        </div>
      )}

      {/* Attendance history */}
      {!isLoading && cAttends.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">{t('studentAttendance.historyTitle')}</h3>
          <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.colDate')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.colSession')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.colStatus')}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedHistory.map((ca, idx) => {
                  const myStatus = getMyStatus(ca);
                  const sessionStatus = getCAttendStatus(ca);
                  const config = myStatus ? ATTEND_STATUS_CONFIG[myStatus] : null;
                  const existingRequest = getRequestForSession(ca);
                  const canRequest = myStatus === 'KP' && !existingRequest && ca.isClosed;
                  return (
                    <tr
                      key={ca._id}
                      className="hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">{formatDate(ca.date)}</td>
                      <td className="px-4 py-3">
                        <SessionStatusBadge status={sessionStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {config ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              config.className
                            )}
                          >
                            {config.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500">
                            {t('studentAttendance.statusNotRecorded')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {existingRequest ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              REQUEST_STATUS_CONFIG[existingRequest.status].className
                            )}
                          >
                            {REQUEST_STATUS_CONFIG[existingRequest.status].label}
                          </span>
                        ) : canRequest ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAbsenceTarget(ca)}
                          >
                            {t('studentAttendance.requestAbsenceBtn')}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absence requests list */}
      {!isLoading && myRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">{t('studentAttendance.absenceTitle')}</h3>
          <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.absenceColSession')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.absenceColReason')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.absenceColDoc')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('studentAttendance.absenceColStatus')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myRequests.map((req) => {
                  const statusConf = REQUEST_STATUS_CONFIG[req.status];
                  const proofUrl = req.proof?.[0];
                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(req.date)}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{req.reason}</td>
                      <td className="px-4 py-3">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            {t('studentAttendance.viewFile')} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            statusConf.className
                          )}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absence request modal */}
      {absenceTarget && user && (
        <AbsenceRequestModal
          open={!!absenceTarget}
          onOpenChange={(open) => {
            if (!open) setAbsenceTarget(null);
          }}
          studentId={user._id}
          subjectId={subjectId}
          cAttend={absenceTarget}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.absenceRequests.byStudent(subjectId),
            });
          }}
        />
      )}
    </div>
  );
}
