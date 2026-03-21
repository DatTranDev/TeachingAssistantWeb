'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, BarChart2, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/api/queryKeys';
import { cAttendApi } from '@/lib/api/cAttend';
import { reviewsApi } from '@/lib/api/reviews';
import { useSubject } from '@/contexts/SubjectContext';
import type { CAttend, ClassSession, Review, User } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  SessionStatusBadge,
  getCAttendStatus,
} from '@/components/features/sessions/SessionStatusBadge';
import { CreateSessionModal } from '@/components/features/sessions/CreateSessionModal';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'h-3.5 w-3.5',
            value >= s ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-neutral-200'
          )}
        />
      ))}
    </div>
  );
}

function DistributionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-muted-foreground shrink-0">{label} ★</span>
      <div className="flex-1 h-2 bg-neutral-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

interface ReviewSummaryModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cAttend: CAttend;
  totalStudents: number;
}

function ReviewSummaryModal({
  open,
  onOpenChange,
  cAttend,
  totalStudents,
}: ReviewSummaryModalProps) {
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString(localeTag)}`;
  };
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: queryKeys.reviews.byCAttend(cAttend._id),
    queryFn: () => reviewsApi.getByCAttend(cAttend._id),
    enabled: open,
    staleTime: 30_000,
  });

  const count = reviews.length;
  const avg =
    count > 0
      ? reviews.reduce((s: number, r: Review) => {
          const scores = [
            Number(r.teachingMethodScore),
            Number(r.atmosphereScore),
            Number(r.documentScore),
          ];
          return s + scores.reduce((a, b) => a + b, 0) / 3;
        }, 0) / count
      : 0;

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r: Review) => {
    const overallScore = Math.round(
      (Number(r.teachingMethodScore) + Number(r.atmosphereScore) + Number(r.documentScore)) / 3
    );
    if (overallScore >= 1 && overallScore <= 5)
      distribution[overallScore] = (distribution[overallScore] ?? 0) + 1;
  });

  const avgUnderstand =
    count > 0
      ? Math.round(reviews.reduce((s: number, r: Review) => s + r.understandPercent, 0) / count)
      : 0;
  const avgUseful =
    count > 0
      ? Math.round(reviews.reduce((s: number, r: Review) => s + r.usefulPercent, 0) / count)
      : 0;

  const comments = reviews.filter((r: Review) => r.thinking && r.thinking.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('sessions.review.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">{formatDate(cAttend.date)}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : count === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {t('sessions.review.noReviews')}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Summary */}
            <div className="flex items-center gap-6 rounded-lg bg-neutral-50 px-4 py-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{avg.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">/ 5</div>
                <StarDisplay value={Math.round(avg)} />
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((s) => (
                  <DistributionBar
                    key={s}
                    label={String(s)}
                    count={distribution[s] ?? 0}
                    max={count}
                  />
                ))}
              </div>
              <div className="text-center text-sm">
                <div className="font-semibold">
                  {count}/{totalStudents}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('sessions.review.reviewedCount', { count: String(count) })}
                </div>
              </div>
            </div>

            {/* Percentages */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-semibold text-primary">{avgUnderstand}%</div>
                <div className="text-xs text-muted-foreground">
                  {t('sessions.review.avgUnderstand')}
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-semibold text-primary">{avgUseful}%</div>
                <div className="text-xs text-muted-foreground">
                  {t('sessions.review.avgUseful')}
                </div>
              </div>
            </div>

            {/* Comments */}
            {comments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t('sessions.review.commentsTitle', { count: String(comments.length) })}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((r: Review) => (
                    <div key={r._id} className="rounded-md bg-neutral-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <StarDisplay
                          value={Math.round(
                            (Number(r.teachingMethodScore) +
                              Number(r.atmosphereScore) +
                              Number(r.documentScore)) /
                              3
                          )}
                        />
                      </div>
                      <p className="text-muted-foreground">{r.thinking}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherSessionsPage() {
  const { subjectId, classSessions } = useSubject();
  const queryClient = useQueryClient();
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<CAttend | null>(null);
  const [reviewTarget, setReviewTarget] = useState<CAttend | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString(localeTag)}`;
  };

  const { data: cAttends = [], isLoading } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cAttendApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
      toast.success(t('sessions.cancelSuccess'));
      setCancelTarget(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.create.errorToast'));
    },
  });

  const sorted = [...cAttends].sort((a, b) => {
    const sa = getCAttendStatus(a);
    const sb = getCAttendStatus(b);
    if (sa === 'live') return -1;
    if (sb === 'live') return 1;
    if (sa === 'upcoming' && sb !== 'upcoming') return -1;
    if (sb === 'upcoming' && sa !== 'upcoming') return 1;
    if (sa === 'upcoming') return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getClassSession = (cAttend: CAttend): ClassSession | null => {
    if (typeof cAttend.classSessionId !== 'string') {
      return cAttend.classSessionId as ClassSession;
    }
    return classSessions.find((cs) => cs._id === cAttend.classSessionId) ?? null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('sessions.createBtn')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && cAttends.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white dark:bg-slate-900 py-12 gap-4 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">{t('sessions.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('sessions.emptyDesc')}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('sessions.createBtn')}
          </Button>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('sessions.table.date')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t('sessions.table.room')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t('sessions.table.attendance')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('sessions.table.status')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  {t('sessions.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((cAttend, idx) => {
                const status = getCAttendStatus(cAttend);
                const cs = getClassSession(cAttend);
                return (
                  <tr
                    key={cAttend._id}
                    className="hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>{formatDate(cAttend.date)}</div>
                      {cs && (
                        <div className="text-xs text-muted-foreground">
                          {cs.start}–{cs.end}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {cs?.room ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {cAttend.numberOfAttend}/{cAttend.acceptedNumber}
                    </td>
                    <td className="px-4 py-3">
                      <SessionStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {status === 'live' && (
                          <Button size="sm" asChild>
                            <Link
                              href={`/teacher/classes/${subjectId}/attendance?session=${cAttend._id}`}
                            >
                              {t('sessions.actions.openAttendance')}
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/teacher/classes/${subjectId}/attendance?session=${cAttend._id}`}
                          >
                            {t('sessions.actions.view')}
                          </Link>
                        </Button>
                        {status === 'ended' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReviewTarget(cAttend)}
                          >
                            <BarChart2 className="h-3.5 w-3.5 mr-1" />
                            {t('sessions.actions.review')}
                          </Button>
                        )}
                        {status !== 'live' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelTarget(cAttend)}
                          >
                            {t('sessions.actions.cancel')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateSessionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        classSessions={classSessions}
        subjectId={subjectId}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Hủy buổi học?"
        description="Bạn có chắc muốn hủy buổi học này? Hành động này không thể hoàn tác."
        confirmLabel={t('sessions.actions.cancel')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (cancelTarget) deleteMutation.mutate(cancelTarget._id);
        }}
      />

      {reviewTarget && (
        <ReviewSummaryModal
          open={!!reviewTarget}
          onOpenChange={(open) => {
            if (!open) setReviewTarget(null);
          }}
          cAttend={reviewTarget}
          totalStudents={reviewTarget.acceptedNumber ?? 0}
        />
      )}
    </div>
  );
}
