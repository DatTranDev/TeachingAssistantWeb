'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ThumbsUp, Paperclip, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { questionsApi } from '@/lib/api/questions';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { useSocket } from '@/providers/socket-provider';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Question, User } from '@/types/domain';

type SortMode = 'recent' | 'votes';
type FilterMode = 'all' | 'mine';

function getauthor(studentId: Question['studentId']): User | null {
  if (typeof studentId === 'object' && studentId !== null) return studentId as User;
  return null;
}

function isImageUrl(url: string): boolean {
  return (
    /^https?:\/\//.test(url) &&
    /\.(jpg|jpeg|png|gif|webp|svg)|(firebasestorage\.googleapis\.com)/i.test(url)
  );
}

function QuestionImage({ src }: { src: string }) {
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className="mt-1">
      {imgStatus === 'loading' && <Skeleton className="h-56 w-full max-w-sm rounded-xl" />}
      {imgStatus === 'error' ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-neutral-50 dark:bg-slate-800 px-4 py-3 text-sm text-primary hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Paperclip className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-xs">View attachment</span>
        </a>
      ) : (
        <img
          src={src}
          alt=""
          className={cn(
            'max-h-80 max-w-full rounded-xl object-contain border cursor-zoom-in',
            imgStatus === 'loading' ? 'hidden' : 'block'
          )}
          onLoad={() => setImgStatus('loaded')}
          onError={() => setImgStatus('error')}
          onClick={() => window.open(src, '_blank')}
        />
      )}
    </div>
  );
}

export default function StudentDiscussionPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useT();

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
  const { t, locale } = useT();
    if (mins < 60) return t('timeAgo.minutesAgo', { count: String(mins) });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('timeAgo.hoursAgo', { count: String(hrs) });
    return t('timeAgo.daysAgo', { count: String(Math.floor(hrs / 24)) });
  };

  const [content, setContent] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<FilterMode>('all');

  useSubjectRoom(user?._id, subjectId);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.bySubject(subjectId),
    queryFn: () => questionsApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  // Real-time: new question from someone else
  const handleReceiveSubjectMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.bySubject(subjectId) });
  }, [queryClient, subjectId]);
  useSocketEvent('receiveSubjectMessage', handleReceiveSubjectMessage);

  // Real-time: resolved question
  const handleReceiveResolve = useCallback(
    (questionId: string) => {
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) =>
          old?.map((q) => (q._id === questionId ? { ...q, isResolved: true } : q)) ?? []
      );
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveResolve', handleReceiveResolve);

  // Real-time: vote update
  const handleReceiveVote = useCallback(
    (updated: Question) => {
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) =>
          old?.map((q) => (q._id === updated._id ? { ...q, ...updated } : q)) ?? []
      );
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveVote', handleReceiveVote as (msg: unknown) => void);

  // Real-time: question revoked
  const handleReceiveRevokedMessage = useCallback(
    (questionId: string) => {
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) =>
          old?.map((q) => (q._id === questionId ? { ...q, isResolved: true } : q)) ?? []
      );
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveRevokedMessage', handleReceiveRevokedMessage);

  const createMutation = useMutation({
    mutationFn: () =>
      questionsApi.create({
        subjectId,
        studentId: user!._id,
        type: 'text',
        content: content.trim(),
      }),
    onSuccess: (newQuestion) => {
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) => [newQuestion, ...(old ?? [])]
      );
      // Notify others in subject room
      if (socket && user) {
        socket.emit('sendMessageToSubject', {
          subjectID: subjectId,
          message: newQuestion,
          dataMsg: { title: 'Câu hỏi mới', body: content.trim(), subjectId },
        });
      }
      setContent('');
          dataMsg: {
            title: locale === 'vi' ? 'Cau hoi moi' : 'New question',
            body: content.trim(),
            subjectId,
          },
    },
    onError: () => toast.error(t('common.generic')),
  });
      toast.success(t('discussion.posting'));
  const revokeMutation = useMutation({
    mutationFn: (id: string) => questionsApi.update(id, { isResolved: true }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.questions.bySubject(subjectId) });
      const snapshot = queryClient.getQueryData(queryKeys.questions.bySubject(subjectId));
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) =>
          old?.map((q) => (q._id === id ? { ...q, isResolved: true } : q)) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.questions.bySubject(subjectId), ctx.snapshot);
      }
      toast.error(t('discussion.revokeError'));
    },
    onSuccess: (_data, id) => {
      if (socket) {
        socket.emit('sendRevokedMessage', { subjectID: subjectId, messageID: id });
      }
      toast.success(t('discussion.revokeSuccess'));
    },
  });

  // Build stable anonymous identity map: studentId -> sequential number
  const anonymousMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    const sorted = [...questions].sort(
      (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
    for (const q of sorted) {
      const auth = getauthor(q.studentId);
      // Only assign anonymous numbers to students, not teachers
      if (auth?.role === 'teacher') continue;
      const id = auth?._id ?? (typeof q.studentId === 'string' ? q.studentId : '');
      if (id && !map.has(id)) {
        counter++;
        map.set(id, counter);
      }
    }
    return map;
  }, [questions]);

  const displayed = useMemo(() => {
    let list = [...questions];
    if (filter === 'mine') {
      list = list.filter((q) => {
        const sid = typeof q.studentId === 'string' ? q.studentId : (q.studentId as User)._id;
        return sid === user?._id;
      });
    }
    if (sort === 'recent') {
      list.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    } else {
      // votes = upvotes array length (not directly available — sort by recency as fallback)
      list.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }
    return list;
  }, [questions, filter, sort, user?._id]);

  const canSubmit = content.trim().length > 0 && content.length <= 500;

  return (
    <div className="space-y-6">
      {/* Post question */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4 space-y-3">
        <p className="text-sm font-medium">{t('discussion.askTitle')}</p>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('discussion.askPlaceholder')}
          rows={3}
          maxLength={500}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs',
              content.length > 450 ? 'text-amber-600' : 'text-muted-foreground'
            )}
          >
            {content.length}/500
          </span>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending || !user}
          >
            {createMutation.isPending ? t('discussion.sending') : t('discussion.askBtn')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {!isLoading && questions.length > 0 && (
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
            {(['all', 'mine'] as const).map((f) => (
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
                {f === 'all' ? t('discussion.filterAll') : t('discussion.filterMine')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 dark:border-slate-700 py-12 gap-3 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            {filter === 'mine' ? t('discussion.emptyMine') : t('discussion.emptyNoQuestions')}
          </p>
          <p className="text-sm text-muted-foreground">{t('discussion.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((q) => {
            const author = getauthor(q.studentId);
            const isOwn = author?._id === user?._id;
            const isTeacher = author?.role === 'teacher';
            const authorId = author?._id ?? (typeof q.studentId === 'string' ? q.studentId : '');
            const anonNumber = anonymousMap.get(authorId);
            const displayName = isTeacher
              ? (author?.name ?? t('discussion.roleTeacher'))
              : isOwn
                ? t('discussion.anonymousN', { n: String(anonNumber ?? '?') })
                : t('discussion.anonymousN', { n: String(anonNumber ?? '?') });
            const avatarLabel = isTeacher
              ? (author?.name?.[0]?.toUpperCase() ?? 'T')
              : (anonNumber ?? '?');
            return (
              <div
                key={q._id}
                className="group rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4 space-y-2 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      {avatarLabel}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium leading-tight">{displayName}</span>
                      {isOwn && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {t('discussion.youLabel')}
                        </span>
                      )}
                      {isTeacher && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 text-xs font-medium">
                          {t('discussion.roleTeacher')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {q.createdAt ? timeAgo(q.createdAt) : ''}
                    </span>
                    {isOwn && !q.isResolved && (
                      <button
                        type="button"
                        onClick={() => revokeMutation.mutate(q._id)}
                        disabled={revokeMutation.isPending}
                        title={t('discussion.revokeAction')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {q.isResolved ? (
                  <p className="text-sm italic text-muted-foreground">
                    {t('discussion.revokedQuestion')}
                  </p>
                ) : isImageUrl(q.content) ? (
                  <QuestionImage src={q.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{q.content}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {Array.isArray((q as Question & { upvotes?: string[] }).upvotes)
                      ? ((q as Question & { upvotes?: string[] }).upvotes?.length ?? 0)
                      : 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
