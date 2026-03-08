/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
  School,
  LogOut,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { discussionsApi } from '@/lib/api/discussions';
import { cAttendApi } from '@/lib/api/cAttend';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { useSocket } from '@/providers/socket-provider';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Discussion, User } from '@/types/domain';

// ─── pure helpers ────────────────────────────────────────────────────────────

function timeAgoFn(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function getCreator(creator: Discussion['creator']): User | null {
  return typeof creator === 'object' && creator !== null ? (creator as User) : null;
}

function getDiscussionId(d: Discussion['replyOf']): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return (d as Discussion)._id;
}

function isImageUrl(url: string): boolean {
  return (
    /^https?:\/\//.test(url) &&
    /\.(jpg|jpeg|png|gif|webp|svg)|(firebasestorage\.googleapis\.com)/i.test(url)
  );
}

function DiscussionImage({ src }: { src: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className="mt-1">
      {status === 'loading' && <Skeleton className="h-48 w-full max-w-sm rounded-xl" />}
      {status === 'error' ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-primary hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Paperclip className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-xs">Xem tệp đính kèm</span>
        </a>
      ) : (
        <img
          src={src}
          alt=""
          className={cn(
            'max-h-72 max-w-full rounded-xl object-contain border cursor-zoom-in',
            status === 'loading' ? 'hidden' : 'block'
          )}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          onClick={() => window.open(src, '_blank')}
        />
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

type SortMode = 'recent' | 'votes';
type FilterMode = 'all' | 'unanswered';

export default function TeacherSessionDiscussionPage() {
  const params = useParams();
  const cAttendId = params.cAttendId as string;
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useT();

  const timeAgo = timeAgoFn;

  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [deleteTarget, setDeleteTarget] = useState<Discussion | null>(null);
  const [kickTarget, setKickTarget] = useState<User | null>(null);

  // Join cAttend-scoped socket room matching mobile pattern
  useSubjectRoom(user?._id, cAttendId);

  // ─── Session info ───────────────────────────────────────────────────────────
  const { data: cAttends = [] } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 60_000,
  });
  const session = cAttends.find((c) => c._id === cAttendId);

  // ─── Discussions query ──────────────────────────────────────────────────────
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: queryKeys.discussions.byCAttend(cAttendId),
    queryFn: () => discussionsApi.getByCAttend(cAttendId),
    staleTime: 0,
    refetchInterval: 5_000,
    enabled: !!cAttendId,
  });

  // ─── Socket events ──────────────────────────────────────────────────────────
  const invalidateDiscussions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.discussions.byCAttend(cAttendId) });
  }, [queryClient, cAttendId]);

  useSocketEvent('receiveSubjectMessage', invalidateDiscussions);
  useSocketEvent('receiveReply', invalidateDiscussions);

  const handleReceiveVote = useCallback(
    (updated: Discussion) => {
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) =>
          old?.map((d) =>
            d._id === updated._id
              ? { ...d, upvotes: updated.upvotes, downvotes: updated.downvotes }
              : d
          ) ?? []
      );
    },
    [queryClient, cAttendId]
  );
  useSocketEvent('receiveVote', handleReceiveVote as (msg: unknown) => void);

  const handleReceiveDeleteMessage = useCallback(
    (discussionId: string) => {
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) => old?.filter((d) => d._id !== discussionId) ?? []
      );
    },
    [queryClient, cAttendId]
  );
  useSocketEvent('receiveDeleteMessage', handleReceiveDeleteMessage);

  const handleReceiveResolve = useCallback(
    (discussionId: string) => {
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) =>
          old?.map((d) => (d._id === discussionId ? { ...d, isResolved: true } : d)) ?? []
      );
    },
    [queryClient, cAttendId]
  );
  useSocketEvent('receiveResolve', handleReceiveResolve);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const resolveMutation = useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      discussionsApi.update(id, { isResolved: resolved }),
    onMutate: async ({ id, resolved }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.discussions.byCAttend(cAttendId) });
      const snapshot = queryClient.getQueryData(queryKeys.discussions.byCAttend(cAttendId));
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) =>
          old?.map((d) => (d._id === id ? { ...d, isResolved: resolved } : d)) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(queryKeys.discussions.byCAttend(cAttendId), ctx.snapshot);
      toast.error(t('discussion.resolveError'));
    },
    onSuccess: (_data, { id, resolved }) => {
      if (resolved && socket)
        socket.emit('sendResolve', { subjectID: cAttendId, messageID: id });
      toast.success(resolved ? t('discussion.resolvedToast') : t('discussion.unresolvedToast'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => discussionsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.discussions.byCAttend(cAttendId) });
      const snapshot = queryClient.getQueryData(queryKeys.discussions.byCAttend(cAttendId));
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) => old?.filter((d) => d._id !== id) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(queryKeys.discussions.byCAttend(cAttendId), ctx.snapshot);
      toast.error(t('discussion.deleteError'));
    },
    onSuccess: (_data, id) => {
      socket?.emit('sendDeleteMessage', { subjectID: cAttendId, messageID: id });
      toast.success(t('discussion.deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  const kickMutation = useMutation({
    mutationFn: (studentId: string) => subjectsApi.leave({ studentId, subjectId }),
    onSuccess: () => {
      toast.success(t('discussion.removeSuccess'));
      setKickTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.discussions.byCAttend(cAttendId) });
    },
    onError: () => toast.error(t('discussion.removeError')),
  });

  // ─── Sorted / filtered display ──────────────────────────────────────────────
  const mainPosts = useMemo(() => {
    let list = discussions.filter((d) => !getDiscussionId(d.replyOf));
    if (filter === 'unanswered') list = list.filter((d) => !d.isResolved);
    if (sort === 'votes') {
      list = [...list].sort((a, b) => {
        const scoreA = (a.upvotes?.length ?? 0) - (a.downvotes?.length ?? 0);
        const scoreB = (b.upvotes?.length ?? 0) - (b.downvotes?.length ?? 0);
        return scoreB - scoreA;
      });
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }
    return list;
  }, [discussions, sort, filter]);

  const repliesFor = useCallback(
    (parentId: string) =>
      discussions
        .filter((d) => getDiscussionId(d.replyOf) === parentId)
        .sort(
          (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        ),
    [discussions]
  );

  const unansweredCount = useMemo(
    () => discussions.filter((d) => !getDiscussionId(d.replyOf) && !d.isResolved).length,
    [discussions]
  );

  // ─── Render helpers ──────────────────────────────────────────────────────────
  const renderKickPopover = (author: User) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group relative h-8 w-8 rounded-full bg-neutral-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer ring-1 ring-transparent hover:ring-2 hover:ring-primary/40 transition-all overflow-hidden"
        >
          {author.avatar ? (
            <img src={author.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            author.name?.[0]?.toUpperCase() ?? '?'
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Info className="h-3 w-3 text-white" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-72 p-0 shadow-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-slate-800 rounded-t-md border-b dark:border-slate-700">
            <div className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0 overflow-hidden bg-neutral-200 dark:bg-slate-700 flex items-center justify-center text-base font-semibold text-neutral-600 dark:text-neutral-300">
              {author.avatar ? (
                <img src={author.avatar} alt="" className="h-12 w-12 object-cover" />
              ) : (
                author.name?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{author.name}</p>
              {author.userCode && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {author.userCode} · {t('discussion.roleStudent')}
                </p>
              )}
            </div>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {author.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{author.email}</span>
              </div>
            )}
            {author.school && (
              <div className="flex items-center gap-2.5 text-sm">
                <School className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{author.school}</span>
              </div>
            )}
          </div>
          <div className="border-t dark:border-slate-700 px-2 py-2">
            <button
              type="button"
              onClick={() => setKickTarget(author)}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('discussion.removeFromClass')}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const renderPost = (d: Discussion, isReply = false) => {
    const creator = getCreator(d.creator);
    const isStudent = creator?.role === 'student' || !creator?.role;
    const displayName =
      creator?.role === 'teacher'
        ? t('discussion.roleTeacher')
        : creator?.name ?? 'Sinh viên';
    const replies = isReply ? [] : repliesFor(d._id);

    return (
      <div
        key={d._id}
        className={cn(
          'rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-2 transition-colors',
          d.isResolved ? 'border-green-200 dark:border-green-900' : 'dark:border-slate-700',
          isReply && 'border-l-4 border-l-primary/30 rounded-l-none ml-4'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {creator && isStudent && !isReply ? (
              renderKickPopover(creator)
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-400">
                {creator?.name?.[0]?.toUpperCase() ?? 'T'}
              </div>
            )}
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium leading-tight">{displayName}</span>
              {creator?.role === 'teacher' && (
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 text-xs font-medium">
                  {t('discussion.roleTeacher')}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {d.createdAt ? timeAgo(d.createdAt) : ''}
            </span>
            {!isReply && (
              <>
                <button
                  type="button"
                  title={d.isResolved ? 'Đánh dấu chưa trả lời' : 'Đánh dấu đã trả lời'}
                  onClick={() => resolveMutation.mutate({ id: d._id, resolved: !d.isResolved })}
                  disabled={resolveMutation.isPending}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    d.isResolved
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                  )}
                >
                  {d.isResolved ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Xóa bài"
                  onClick={() => setDeleteTarget(d)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <>
          {!isReply && d.title && (
            <p className="font-semibold text-sm leading-snug">{d.title}</p>
          )}
          {isImageUrl(d.content) ? (
            <DiscussionImage src={d.content} />
          ) : (
            <p className="text-sm leading-relaxed">{d.content}</p>
          )}
          {(d.images ?? []).map((img) => (
            <DiscussionImage key={img} src={img} />
          ))}
        </>

        {/* Vote summary (read-only for teacher) */}
        {!isReply && (
          <div className="flex items-center gap-3 pt-1">
            {d.isResolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                ✓ {t('discussion.resolved')}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3.5 w-3.5" />
              {(d.upvotes ?? []).length}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsDown className="h-3.5 w-3.5" />
              {(d.downvotes ?? []).length}
            </span>
          </div>
        )}

        {/* Replies */}
        {!isReply && replies.length > 0 && (
          <div className="pt-1 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {t('discussion.commentCount', { n: String(replies.length) })}
            </p>
            <div className="space-y-2">
              {replies.map((r) => renderPost(r, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Page ────────────────────────────────────────────────────────────────────
  const sessionLabel = session
    ? `Buổi ${session.sessionNumber} — ${new Date(session.date).toLocaleDateString('vi-VN')}`
    : 'Buổi học';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/teacher/classes/${subjectId}/discussion`}>
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-semibold text-lg leading-tight">{sessionLabel}</h1>
          <p className="text-xs text-muted-foreground">{t('discussion.sessionSubtitleTeacher')}</p>
        </div>
      </div>

      {/* Unanswered banner */}
      {!isLoading && unansweredCount > 0 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
          {t('discussion.unansweredAlert', { count: String(unansweredCount) })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 rounded-lg bg-neutral-100 dark:bg-slate-800 p-1">
          {(['recent', 'votes'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                sort === s
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'recent' ? t('discussion.sortRecent') : t('discussion.sortVotes')}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-100 dark:bg-slate-800 p-1">
          {(['all', 'unanswered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? t('discussion.filterAll') : t('discussion.filterUnanswered')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : mainPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 py-14 gap-3 text-center">
          <MessageSquare className="h-9 w-9 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            {filter === 'unanswered'
              ? t('discussion.emptyAllAnswered')
              : t('discussion.emptyNoQuestions')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mainPosts.map((d) => renderPost(d))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('discussion.deleteConfirmTitle')}
        description={t('discussion.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        isLoading={deleteMutation.isPending}
      />

      {/* Kick confirm */}
      <ConfirmDialog
        open={!!kickTarget}
        onOpenChange={(open) => { if (!open) setKickTarget(null); }}
        title={t('discussion.removeConfirmTitle')}
        description={t('discussion.removeConfirmDesc')}
        confirmLabel={t('discussion.removeFromClass')}
        onConfirm={() => kickTarget && kickMutation.mutate(kickTarget._id)}
        isLoading={kickMutation.isPending}
      />
    </div>
  );
}
