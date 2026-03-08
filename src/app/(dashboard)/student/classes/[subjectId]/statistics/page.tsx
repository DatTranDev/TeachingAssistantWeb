'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys } from '@/lib/api/queryKeys';
import { cAttendApi } from '@/lib/api/cAttend';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { getCAttendStatus } from '@/components/features/sessions/SessionStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';
import { cn } from '@/lib/utils';
import type { AttendRecord, CAttend, AttendanceStatus } from '@/types/domain';

function AttendanceBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span
        className={cn(
          'text-sm font-medium w-10 text-right',
          rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'
        )}
      >
        {rate}%
      </span>
    </div>
  );
}

function colorDot(rate: number) {
  if (rate >= 80) return <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />;
  if (rate >= 60) return <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />;
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />;
}

export default function StudentStatisticsPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const { t, locale } = useT();

  const { data: cAttends = [], isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const { data: attendRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, user?._id ?? ''),
    queryFn: () => attendRecordsApi.getByUserAndSubject(subjectId, user!._id),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  const isLoading = loadingSessions || loadingRecords;

  const pastSessions = useMemo(
    () => cAttends.filter((s: CAttend) => getCAttendStatus(s) === 'ended'),
    [cAttends]
  );

  const attended = useMemo(
    () => attendRecords.filter((r: AttendRecord) => r.status === 'CM' || r.status === 'CP').length,
    [attendRecords]
  );

  const attendanceRate =
    pastSessions.length > 0 ? Math.round((attended / pastSessions.length) * 100) : 0;

  const statusCount: Record<AttendanceStatus, number> = useMemo(() => {
    const counts = { CM: 0, KP: 0, CP: 0 } as Record<AttendanceStatus, number>;
    attendRecords.forEach((r: AttendRecord) => {
      if (r.status in counts) counts[r.status]++;
    });
    return counts;
  }, [attendRecords]);

  const STATUS_LABELS: Record<AttendanceStatus, { label: string; color: string }> = {
    CM: {
      label: t('studentStatistics.statusPresent'),
      color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    },
    KP: {
      label: t('studentStatistics.statusAbsent'),
      color: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    },
    CP: {
      label: t('studentStatistics.statusExcused'),
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    },
  };

  const rating =
    attendanceRate >= 80
      ? t('studentStatistics.ratingGood')
      : attendanceRate >= 60
        ? t('studentStatistics.ratingAverage')
        : t('studentStatistics.ratingAttention');

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Overall card */}
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-5">
            <h3 className="text-sm font-semibold mb-4">{t('studentStatistics.overallTitle')}</h3>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <div
                  className={cn(
                    'text-5xl font-bold',
                    attendanceRate >= 80
                      ? 'text-green-600'
                      : attendanceRate >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {attendanceRate}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t('studentStatistics.sessionsAttended', {
                    attended: String(attended),
                    total: String(pastSessions.length),
                  })}
                </div>
              </div>
              <div className="flex-1" />
              {colorDot(attendanceRate)}
              <span
                className={cn(
                  'text-sm font-medium',
                  attendanceRate >= 80
                    ? 'text-green-600'
                    : attendanceRate >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                )}
              >
                {rating}
              </span>
            </div>
            <AttendanceBar rate={attendanceRate} />
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold mb-3">{t('studentStatistics.breakdownTitle')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['CM', 'CP', 'KP'] as AttendanceStatus[]).map((status) => (
                <div
                  key={status}
                  className={cn('rounded-lg p-3 text-center', STATUS_LABELS[status].color)}
                >
                  <div className="text-2xl font-bold">{statusCount[status]}</div>
                  <div className="text-xs font-medium mt-0.5">{STATUS_LABELS[status].label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session list */}
          {pastSessions.length > 0 && (
            <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 dark:bg-slate-800 border-b">
                <h3 className="text-sm font-semibold">{t('studentStatistics.historyTitle')}</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {pastSessions.map((s: CAttend, i: number) => {
                    const record = attendRecords.find((r: AttendRecord) => {
                      const id =
                        typeof r.cAttendId === 'string'
                          ? r.cAttendId
                          : (r.cAttendId as CAttend)._id;
                      return id === s._id;
                    });
                    const status = record?.status as AttendanceStatus | undefined;
                    const cfg = status ? STATUS_LABELS[status] : null;
                    return (
                      <tr key={s._id} className="hover:bg-neutral-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-2.5 text-muted-foreground w-10">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          {new Date(s.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {cfg ? (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                cfg.color
                              )}
                            >
                              {cfg.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-slate-700 text-neutral-500">
                              {t('studentStatistics.statusNotRecorded')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
