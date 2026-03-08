'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  ThumbsUp,
  Trash2,
  Paperclip,
  Mail,
  School,
  LogOut,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { questionsApi } from '@/lib/api/questions';
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
import type { Question, User } from '@/types/domain';

type SortMode = 'recent' | 'votes';
type FilterMode = 'all' | 'unanswered';

function getStudent(studentId: Question['studentId']): User | null {
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
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className="mt-1">
      {status === 'loading' && <Skeleton className="h-56 w-full max-w-sm rounded-xl" />}
      {status === 'error' ? (
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

export default function TeacherDiscussionPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useT();

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('timeAgo.justNow');
    if (mins < 60) return t('timeAgo.minutesAgo', { count: String(mins) });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('timeAgo.hoursAgo', { count: String(hrs) });
    return t('timeAgo.daysAgo', { count: String(Math.floor(hrs / 24)) });
  };

  const [sort, setSort] = useState<SortMode>('recent');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [kickTarget, setKickTarget] = useState<User | null>(null);

  useSubjectRoom(user?._id, subjectId);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.bySubject(subjectId),
    queryFn: () => questionsApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  // Real-time: new question posted by student
  const handleReceiveSubjectMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.bySubject(subjectId) });
  }, [queryClient, subjectId]);
  useSocketEvent('receiveSubjectMessage', handleReceiveSubjectMessage);

  // Real-time: resolve event
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

  // Real-time: delete event
  const handleReceiveDeleteMessage = useCallback(
    (questionId: string) => {
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) => old?.filter((q) => q._id !== questionId) ?? []
      );
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveDeleteMessage', handleReceiveDeleteMessage);

  // Real-time: question revoked by student
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.questions.bySubject(subjectId) });
      const snapshot = queryClient.getQueryData(queryKeys.questions.bySubject(subjectId));
      queryClient.setQueryData(
        queryKeys.questions.bySubject(subjectId),
        (old: Question[] | undefined) => old?.filter((q) => q._id !== id) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.questions.bySubject(subjectId), ctx.snapshot);
      }
      toast.error(t('discussion.deleteError'));
    },
    onSuccess: (_data, id) => {
      if (socket) {
        socket.emit('sendDeleteMessage', { subjectID: subjectId, messageID: id });
      }
      toast.success(t('discussion.deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  // Build stable anonymous identity map: studentId -> sequential number
  const anonymousMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    // Walk questions in chronological order so numbers are stable
    const sorted = [...questions].sort(
      (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
    for (const q of sorted) {
      const author = getStudent(q.studentId);
      const id = author?._id ?? (typeof q.studentId === 'string' ? q.studentId : '');
      if (id && !map.has(id)) {
        counter++;
        map.set(id, counter);
      }
    }
    return map;
  }, [questions]);

  const kickMutation = useMutation({
    mutationFn: (studentId: string) => subjectsApi.leave({ studentId, subjectId }),
    onSuccess: () => {
      toast.success(t('discussion.removeSuccess'));
      setKickTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.bySubject(subjectId) });
    },
    onError: () => {
      toast.error(t('discussion.removeError'));
    },
  });

  const displayed = useMemo(() => {
    let list = [...questions];
    if (filter === 'unanswered') list = list.filter((q) => !q.isResolved);
    list.sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
    return list;
  }, [questions, filter]);

  // unanswered = questions not yet revoked by student
  const unansweredCount = questions.filter((q) => !q.isResolved).length;

  return (
    <div className="space-y-6">
      {/* No unanswered banner — Question.isResolved means revoked, not answered */}

      {/* Sort/Filter */}
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
            {filter === 'unanswered'
              ? t('discussion.emptyAllAnswered')
              : t('discussion.emptyNoQuestions')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((q) => {
            const author = getStudent(q.studentId);
            const authorId = author?._id ?? (typeof q.studentId === 'string' ? q.studentId : '');
            const isMe = authorId === user?._id;
            const anonNumber = anonymousMap.get(authorId);
            const anonLabel = t('discussion.anonymousN', { n: String(anonNumber ?? '?') });
            const displayName = isMe ? (author?.name ?? anonLabel) : anonLabel;
            const initial = author?.name?.[0]?.toUpperCase() ?? '?';
            return (
              <div
                key={q._id}
                className={cn(
                  'rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-2 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors',
                  q.isResolved ? 'border-green-200 dark:border-green-900' : 'dark:border-slate-700'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar with popover for student info */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="group relative h-8 w-8 rounded-full bg-neutral-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer ring-1 ring-transparent hover:ring-2 hover:ring-primary/40 transition-all overflow-hidden"
                        >
                          {isMe && author?.avatar ? (
                            <img
                              src={author.avatar}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            (anonNumber ?? '?')
                          )}
                          {!isMe && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                              <Info className="h-3 w-3 text-white" />
                            </span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="w-72 p-0 shadow-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700"
                      >
                        {author ? (
                          <div className="flex flex-col">
                            {/* Header with accent background */}
                            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-slate-800 rounded-t-md border-b border-neutral-200 dark:border-slate-700">
                              <div className="h-12 w-12 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0 overflow-hidden bg-neutral-200 dark:bg-slate-700 flex items-center justify-center text-base font-semibold text-neutral-600 dark:text-neutral-300">
                                {author.avatar ? (
                                  <img
                                    src={author.avatar}
                                    alt=""
                                    className="h-12 w-12 object-cover"
                                  />
                                ) : (
                                  initial
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{author.name}</p>
                                {author.userCode && (
                                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    {author.userCode}
                                    <span className="mx-1.5">·</span>
                                    {author.role === 'student'
                                      ? t('discussion.roleStudent')
                                      : t('discussion.roleTeacher')}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Details */}
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
                            {/* Kick button */}
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
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground text-center">
                            {t('discussion.anonymous')}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>

                    <div className="min-w-0">
                      <span className="text-sm font-medium">{displayName}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {q.createdAt ? timeAgo(q.createdAt) : ''}
                  </span>
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

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {q.isResolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-slate-700 text-muted-foreground px-2 py-0.5 text-xs font-medium">
                        ↩ {t('discussion.revokedQuestion')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {Array.isArray((q as Question & { upvotes?: string[] }).upvotes)
                        ? ((q as Question & { upvotes?: string[] }).upvotes?.length ?? 0)
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setDeleteTarget(q)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('discussion.deleteConfirmTitle')}
        description={t('discussion.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />

      {/* Kick student confirm */}
      <ConfirmDialog
        open={!!kickTarget}
        onOpenChange={(open) => {
          if (!open) setKickTarget(null);
        }}
        title={t('discussion.removeConfirmTitle')}
        description={t('discussion.removeConfirmDesc')}
        confirmLabel={t('discussion.removeFromClass')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={kickMutation.isPending}
        onConfirm={() => kickTarget && kickMutation.mutate(kickTarget._id)}
      />
    </div>
  );
}
