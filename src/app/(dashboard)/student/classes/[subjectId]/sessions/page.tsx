'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/api/queryKeys';
import { cAttendApi } from '@/lib/api/cAttend';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { reviewsApi } from '@/lib/api/reviews';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';
import type { CAttend, ClassSession, AttendRecord, AttendanceStatus, Review } from '@/types/domain';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SessionStatusBadge,
  getCAttendStatus,
} from '@/components/features/sessions/SessionStatusBadge';
import { cn } from '@/lib/utils';

function AttendStatusBadge({ status }: { status: AttendanceStatus | null }) {
  const { t } = useT();
  const ATTEND_STATUS_CONFIG: Record<AttendanceStatus, { label: string; className: string }> = {
    CM: {
      label: t('studentSessions.attendStatus.present'),
      className: 'bg-green-100 text-green-700',
    },
    KP: { label: t('studentSessions.attendStatus.absent'), className: 'bg-red-100 text-red-700' },
    CP: {
      label: t('studentSessions.attendStatus.excused'),
      className: 'bg-yellow-100 text-yellow-700',
    },
  };
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500">
        {t('studentSessions.attendStatus.notMarked')}
      </span>
    );
  }
  const { label, className } = ATTEND_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}

function StarRating({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cn('p-0.5 transition-colors', !readOnly && 'cursor-pointer hover:scale-110')}
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              (hover || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-neutral-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

const PERCENT_OPTIONS = [0, 25, 50, 75, 100];

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cAttend: CAttend;
  userId: string;
  sessionLabel: string;
  onReviewed: (cAttendId: string) => void;
}

function ReviewModal({
  open,
  onOpenChange,
  cAttend,
  userId,
  sessionLabel,
  onReviewed,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [teachingScore, setTeachingScore] = useState(0);
  const [atmosphereScore, setAtmosphereScore] = useState(0);
  const [documentScore, setDocumentScore] = useState(0);
  const [understandPct, setUnderstandPct] = useState(75);
  const [usefulPct, setUsefulPct] = useState(75);
  const [thinking, setThinking] = useState('');

  // Check if already reviewed
  const { data: existingReviews = [], isLoading: checkingReview } = useQuery({
    queryKey: queryKeys.reviews.byCAttend(cAttend._id),
    queryFn: () => reviewsApi.getByCAttend(cAttend._id),
    enabled: open,
    staleTime: 60_000,
  });

  const alreadyReviewed = existingReviews.some((r: Review) => {
    const id = typeof r.studentId === 'object' ? (r.studentId as { _id: string })._id : r.studentId;
    return id === userId;
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        studentId: userId,
        cAttendId: cAttend._id,
        teachingMethodScore: teachingScore,
        atmosphereScore: atmosphereScore,
        documentScore: documentScore,
        understandPercent: understandPct,
        usefulPercent: usefulPct,
        thinking: thinking.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t('studentSessions.reviewModal.successToast'));
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byCAttend(cAttend._id) });
      onReviewed(cAttend._id);
      onOpenChange(false);
    },
    onError: (err: { response?: { status?: number } }) => {
      if (err.response?.status === 409) {
        toast.info(t('studentSessions.reviewModal.alreadyReviewedToast'));
        onReviewed(cAttend._id);
        onOpenChange(false);
      } else {
        toast.error(t('studentSessions.reviewModal.errorToast'));
      }
    },
  });

  const canSubmit = teachingScore > 0 && atmosphereScore > 0 && documentScore > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('studentSessions.reviewModal.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">{sessionLabel}</p>
        </DialogHeader>

        {checkingReview ? (
          <div className="py-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : alreadyReviewed ? (
          <div className="py-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700 text-sm font-medium">
              <Star className="h-4 w-4 fill-green-500 text-green-500" />
              {t('studentSessions.reviewModal.alreadyReviewed')}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {[
                {
                  label: t('studentSessions.reviewModal.teachingMethodLabel'),
                  value: teachingScore,
                  set: setTeachingScore,
                },
                {
                  label: t('studentSessions.reviewModal.atmosphereLabel'),
                  value: atmosphereScore,
                  set: setAtmosphereScore,
                },
                {
                  label: t('studentSessions.reviewModal.documentLabel'),
                  value: documentScore,
                  set: setDocumentScore,
                },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <StarRating value={value} onChange={set} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">
                  {t('studentSessions.reviewModal.understandLabel')}
                </Label>
                <Select
                  value={String(understandPct)}
                  onValueChange={(v) => setUnderstandPct(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENT_OPTIONS.map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">
                  {t('studentSessions.reviewModal.usefulLabel')}
                </Label>
                <Select value={String(usefulPct)} onValueChange={(v) => setUsefulPct(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERCENT_OPTIONS.map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1 block">
                {t('studentSessions.reviewModal.thinkingLabel')}
              </Label>
              <Textarea
                placeholder={t('studentSessions.reviewModal.thinkingPlaceholder')}
                value={thinking}
                onChange={(e) => setThinking(e.target.value.slice(0, 500))}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{thinking.length}/500</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('studentSessions.reviewModal.cancelBtn')}
          </Button>
          {!checkingReview && !alreadyReviewed && (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!canSubmit || submitMutation.isPending}
            >
              {submitMutation.isPending
                ? t('studentSessions.reviewModal.submitting')
                : t('studentSessions.reviewModal.submitBtn')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentSessionsPage() {
  const { subjectId, classSessions } = useSubject();
  const { user } = useAuth();
  const { t } = useT();
  const [reviewTarget, setReviewTarget] = useState<CAttend | null>(null);
  // Track sessions reviewed in current session
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

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

  const getAttendStatus = (cAttendId: string): AttendanceStatus | null => {
    const record = attendRecords.find((r: AttendRecord) => {
      const id = typeof r.cAttendId === 'string' ? r.cAttendId : (r.cAttendId as CAttend)._id;
      return id === cAttendId;
    });
    return record?.status ?? null;
  };

  const getClassSession = (cAttend: CAttend): ClassSession | null => {
    if (typeof cAttend.classSessionId !== 'string') {
      return cAttend.classSessionId as ClassSession;
    }
    return classSessions.find((cs) => cs._id === cAttend.classSessionId) ?? null;
  };

  const handleReviewed = useCallback((cAttendId: string) => {
    setReviewedIds((prev) => new Set([...prev, cAttendId]));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString('vi-VN')}`;
  };

  // Sort by date: upcoming first, then past desc
  const sorted = [...cAttends].sort((a, b) => {
    const sa = getCAttendStatus(a);
    const sb = getCAttendStatus(b);
    if (sa === 'live') return -1;
    if (sb === 'live') return 1;
    if (sa === 'upcoming' && sb !== 'upcoming') return -1;
    if (sb === 'upcoming' && sa !== 'upcoming') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-4">
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
          <p className="font-medium">{t('studentSessions.empty')}</p>
          <p className="text-sm text-muted-foreground">{t('studentSessions.emptyDesc')}</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('studentSessions.table.date')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t('studentSessions.table.room')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('studentSessions.table.status')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('studentSessions.table.attendance')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('studentSessions.table.review')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((cAttend, idx) => {
                const status = getCAttendStatus(cAttend);
                const cs = getClassSession(cAttend);
                const attendStatus = getAttendStatus(cAttend._id);
                const isPast = status === 'ended';
                const hasReviewed = reviewedIds.has(cAttend._id);
                return (
                  <tr key={cAttend._id} className="hover:bg-neutral-50 transition-colors">
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
                    <td className="px-4 py-3">
                      <SessionStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3">
                      <AttendStatusBadge status={attendStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {isPast &&
                        (hasReviewed ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                            <Star className="h-3 w-3 fill-green-500 text-green-500" />
                            {t('studentSessions.reviewedBadge')}
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setReviewTarget(cAttend)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {t('studentSessions.reviewBtn')}
                          </Button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewTarget && user && (
        <ReviewModal
          open={!!reviewTarget}
          onOpenChange={(open) => {
            if (!open) setReviewTarget(null);
          }}
          cAttend={reviewTarget}
          userId={user._id}
          sessionLabel={formatDate(reviewTarget.date)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}
