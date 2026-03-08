'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { absenceRequestsApi } from '@/lib/api/absenceRequests';
import { queryKeys } from '@/lib/api/queryKeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AbsenceRejectModal } from './AbsenceRejectModal';
import { cn } from '@/lib/utils';
import type { AbsenceRequest, User } from '@/types/domain';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

interface Props {
  subjectId: string;
}

function getStudent(studentId: AbsenceRequest['studentId']): User | null {
  if (typeof studentId === 'object' && studentId !== null) return studentId as User;
  return null;
}

export function AbsenceRequestReviewList({ subjectId }: Props) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [rejectTarget, setRejectTarget] = useState<AbsenceRequest | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString('vi-VN')}`;
  };
  const STATUS_CONFIG = {
    pending: {
      label: t('absenceRequests.review.statusPending'),
      className: 'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-neutral-400',
    },
    approved: {
      label: t('absenceRequests.review.statusApproved'),
      className: 'bg-green-100 text-green-700',
    },
    rejected: {
      label: t('absenceRequests.review.statusRejected'),
      className: 'bg-red-100 text-red-700',
    },
  } as const;

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: queryKeys.absenceRequests.bySubject(subjectId),
    queryFn: () => absenceRequestsApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const pendingRequests = allRequests.filter((r) => r.status === 'pending');
  const processedRequests = allRequests.filter((r) => r.status !== 'pending');
  const displayed = activeTab === 'pending' ? pendingRequests : processedRequests;

  const approveMutation = useMutation({
    mutationFn: (id: string) => absenceRequestsApi.review(id, 'approved'),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.absenceRequests.bySubject(subjectId) });
      const snapshot = queryClient.getQueryData(queryKeys.absenceRequests.bySubject(subjectId));
      queryClient.setQueryData(
        queryKeys.absenceRequests.bySubject(subjectId),
        (old: AbsenceRequest[] = []) =>
          old.map((r) => (r._id === id ? { ...r, status: 'approved' as const } : r))
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.absenceRequests.bySubject(subjectId), ctx.snapshot);
      }
      toast.error(t('absenceRequests.review.errorToast'));
    },
    onSuccess: () => toast.success(t('absenceRequests.review.approveSuccess')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      absenceRequestsApi.review(id, 'rejected', comment || undefined),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.absenceRequests.bySubject(subjectId) });
      const snapshot = queryClient.getQueryData(queryKeys.absenceRequests.bySubject(subjectId));
      queryClient.setQueryData(
        queryKeys.absenceRequests.bySubject(subjectId),
        (old: AbsenceRequest[] = []) =>
          old.map((r) => (r._id === id ? { ...r, status: 'rejected' as const } : r))
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.absenceRequests.bySubject(subjectId), ctx.snapshot);
      }
      toast.error(t('absenceRequests.review.errorToast'));
    },
    onSuccess: () => toast.success(t('absenceRequests.review.rejectSuccess')),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="font-medium text-sm">{t('absenceRequests.review.title')}</h3>
        {pendingRequests.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
            {t('absenceRequests.review.pendingCount', { count: pendingRequests.length })}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 dark:bg-slate-800 p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'pending'
              ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('absenceRequests.review.pendingTab')}{' '}
          {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </button>
        <button
          onClick={() => setActiveTab('processed')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'processed'
              ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('absenceRequests.review.processedTab')}{' '}
          {processedRequests.length > 0 && `(${processedRequests.length})`}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 py-8 text-center text-sm text-muted-foreground">
          {activeTab === 'pending'
            ? t('absenceRequests.review.noPending')
            : t('absenceRequests.review.noProcessed')}
        </div>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('absenceRequests.review.studentCol')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('absenceRequests.review.sessionCol')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('absenceRequests.review.reasonCol')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('absenceRequests.review.docCol')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  {t('absenceRequests.review.statusCol')}
                </th>
                {activeTab === 'pending' && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayed.map((req) => {
                const student = getStudent(req.studentId);
                const statusConf = STATUS_CONFIG[req.status];
                const proofUrl = req.proof?.[0];
                const isPending = req.status === 'pending';
                return (
                  <tr
                    key={req._id}
                    className="hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium leading-tight">{student?.name ?? '—'}</p>
                        {student?.userCode && (
                          <p className="text-xs text-muted-foreground">{student.userCode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(req.date)}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate">{req.reason}</p>
                      {req.comment && (
                        <p className="text-xs text-red-600 mt-0.5 truncate">→ {req.comment}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          {t('absenceRequests.review.viewProof')}{' '}
                          <ExternalLink className="h-3 w-3" />
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
                    {activeTab === 'pending' && (
                      <td className="px-4 py-3">
                        {isPending && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-green-700 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
                              onClick={() => approveMutation.mutate(req._id)}
                              disabled={approveMutation.isPending}
                              title={t('absenceRequests.review.approveTitle')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-red-700 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => setRejectTarget(req)}
                              disabled={rejectMutation.isPending}
                              title={t('absenceRequests.review.rejectTitle')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <AbsenceRejectModal
          open={!!rejectTarget}
          onOpenChange={(open) => {
            if (!open) setRejectTarget(null);
          }}
          request={rejectTarget}
          onConfirm={async (comment) => {
            await rejectMutation.mutateAsync({ id: rejectTarget._id, comment });
          }}
        />
      )}
    </div>
  );
}
