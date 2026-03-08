/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Plus,
  MessageSquare,
  ImageIcon,
  X,
  Send,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { discussionsApi } from '@/lib/api/discussions';
import { cAttendApi } from '@/lib/api/cAttend';
import { uploadApi } from '@/lib/api/upload';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { useSocket } from '@/providers/socket-provider';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Discussion, Reaction, User } from '@/types/domain';

// ─── helpers ─────────────────────────────────────────────────────────────────

const REACTION_EMOJIS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '😊',
  2: '👍',
  3: '❤️',
  4: '😮',
  5: '😢',
};

function getCreator(creator: Discussion['creator']): User | null {
  return typeof creator === 'object' && creator !== null ? (creator as User) : null;
}

function getDiscussionId(d: Discussion['replyOf']): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return (d as Discussion)._id;
}

function getReactionUser(r: Reaction): string {
  if (typeof r.userId === 'string') return r.userId;
  return (r.userId as User)._id;
}

function getReactionId(r: Reaction): string {
  return r._id;
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

export default function StudentSessionDiscussionPage() {
  const params = useParams();
  const cAttendId = params.cAttendId as string;
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [openReactionFor, setOpenReactionFor] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Join cAttend-scoped socket room (matching mobile: joinSubject with cAttendId)
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

  const handleReceiveReaction = useCallback(() => invalidateDiscussions(), [invalidateDiscussions]);
  useSocketEvent('receiveReaction', handleReceiveReaction);
  useSocketEvent('receiveUpdateReaction', handleReceiveReaction);

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

  // ─── Anonymous map ──────────────────────────────────────────────────────────
  const anonymousMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    const sorted = [...discussions].sort(
      (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
    for (const d of sorted) {
      const creator = getCreator(d.creator);
      if (creator?.role === 'teacher') continue;
      const id = creator?._id ?? (typeof d.creator === 'string' ? d.creator : '');
      if (id && !map.has(id)) {
        counter++;
        map.set(id, counter);
      }
    }
    return map;
  }, [discussions]);

  // ─── Sorted display ─────────────────────────────────────────────────────────
  const mainPosts = useMemo(() => {
    const posts = discussions.filter((d) => !getDiscussionId(d.replyOf));
    if (sort === 'votes') {
      return [...posts].sort((a, b) => {
        const scoreA = (a.upvotes?.length ?? 0) - (a.downvotes?.length ?? 0);
        const scoreB = (b.upvotes?.length ?? 0) - (b.downvotes?.length ?? 0);
        return scoreB - scoreA;
      });
    }
    return [...posts].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }, [discussions, sort]);

  const repliesFor = useCallback(
    (parentId: string) =>
      discussions
        .filter((d) => getDiscussionId(d.replyOf) === parentId)
        .sort(
          (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        ),
    [discussions]
  );

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      discussionsApi.create({
        cAttendId,
        creator: user!._id,
        title: newTitle.trim() || undefined,
        content: newContent.trim(),
        images: newImages,
      }),
    onSuccess: (newPost) => {
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) => [newPost, ...(old ?? [])]
      );
      socket?.emit('sendMessageToSubject', {
        subjectID: cAttendId,
        message: newPost,
        dataMsg: { title: 'Bài viết mới', body: newContent.trim(), subjectId: cAttendId },
      });
      setShowCreateDialog(false);
      setNewTitle('');
      setNewContent('');
      setNewImages([]);
      toast.success('Đã đăng bài thành công');
    },
    onError: () => toast.error('Không thể đăng bài. Thử lại sau.'),
  });

  const replyMutation = useMutation({
    mutationFn: (parentId: string) =>
      discussionsApi.create({
        cAttendId,
        creator: user!._id,
        content: replyContent.trim(),
        replyOf: parentId,
      }),
    onSuccess: (newReply) => {
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) => [...(old ?? []), newReply]
      );
      socket?.emit('sendMessageToSubject', {
        subjectID: cAttendId,
        message: newReply,
        dataMsg: { title: 'Bình luận mới', body: replyContent.trim(), subjectId: cAttendId },
      });
      setReplyTarget(null);
      setReplyContent('');
      toast.success('Đã gửi bình luận');
    },
    onError: () => toast.error('Không thể gửi bình luận. Thử lại sau.'),
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'upvote' | 'downvote' }) =>
      discussionsApi.vote(id, type),
    onMutate: async ({ id, type }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.discussions.byCAttend(cAttendId) });
      const snapshot = queryClient.getQueryData(queryKeys.discussions.byCAttend(cAttendId));
      queryClient.setQueryData(
        queryKeys.discussions.byCAttend(cAttendId),
        (old: Discussion[] | undefined) =>
          old?.map((d) => {
            if (d._id !== id) return d;
            const uid = user!._id;
            let upvotes = [...(d.upvotes ?? [])];
            let downvotes = [...(d.downvotes ?? [])];
            if (type === 'upvote') {
              if (upvotes.includes(uid)) upvotes = upvotes.filter((x) => x !== uid);
              else { upvotes.push(uid); downvotes = downvotes.filter((x) => x !== uid); }
            } else {
              if (downvotes.includes(uid)) downvotes = downvotes.filter((x) => x !== uid);
              else { downvotes.push(uid); upvotes = upvotes.filter((x) => x !== uid); }
            }
            return { ...d, upvotes, downvotes };
          }) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(queryKeys.discussions.byCAttend(cAttendId), ctx.snapshot);
      toast.error('Không thể cập nhật vote. Thử lại sau.');
    },
  });


  const addReactionMutation = useMutation({
    mutationFn: ({ discussionId, type }: { discussionId: string; type: 1 | 2 | 3 | 4 | 5 }) =>
      discussionsApi.addReaction({ userId: user!._id, discussionId, type }),
    onSuccess: () => {
      invalidateDiscussions();
      setOpenReactionFor(null);
    },
    onError: () => toast.error('Không thể thêm cảm xúc. Thử lại sau.'),
  });

  const updateReactionMutation = useMutation({
    mutationFn: ({ reactionId, type }: { reactionId: string; type: 1 | 2 | 3 | 4 | 5 }) =>
      discussionsApi.updateReaction(reactionId, type),
    onSuccess: () => {
      invalidateDiscussions();
      setOpenReactionFor(null);
    },
    onError: () => toast.error('Không thể cập nhật cảm xúc. Thử lại sau.'),
  });

  // ─── Image upload helpers ────────────────────────────────────────────────────
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (newImages.length >= 3) {
      toast.error('Tối đa 3 ảnh');
      return;
    }
    setUploadingImages(true);
    try {
      const toUpload = Array.from(files).slice(0, 3 - newImages.length);
      const urls = await uploadApi.uploadImages(toUpload);
      setNewImages((prev) => [...prev, ...urls]);
    } catch {
      toast.error('Tải ảnh thất bại. Thử lại sau.');
    } finally {
      setUploadingImages(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────
  const renderAuthor = (d: Discussion, isOwn: boolean) => {
    const creator = getCreator(d.creator);
    const isTeacher = creator?.role === 'teacher';
    const creatorId =
      creator?._id ?? (typeof d.creator === 'string' ? d.creator : '');
    const anonNum = anonymousMap.get(creatorId);

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {isTeacher ? (creator?.name?.[0]?.toUpperCase() ?? 'T') : (anonNum ?? '?')}
        </div>
        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium leading-tight">
            {isTeacher
              ? (creator?.name ?? t('discussion.roleTeacher'))
              : t('discussion.anonymousN', { n: String(anonNum ?? '?') })}
          </span>
          {isOwn && (
            <span className="text-xs text-muted-foreground">{t('discussion.youLabel')}</span>
          )}
          {isTeacher && (
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 text-xs font-medium">
              {t('discussion.roleTeacher')}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderReactionBar = (d: Discussion) => {
    if (!d.isResolved) return null;
    const reactions = d.reactions ?? [];
    const myReaction = reactions.find((r) => getReactionUser(r) === user?._id);

    // Count by type
    const counts = reactions.reduce<Record<number, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {});

    const handleReact = (type: 1 | 2 | 3 | 4 | 5) => {
      if (myReaction) {
        updateReactionMutation.mutate({ reactionId: getReactionId(myReaction), type });
      } else {
        addReactionMutation.mutate({ discussionId: d._id, type });
      }
    };

    return (
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        {(Object.entries(counts) as [string, number][]).map(([t, count]) => (
          <span
            key={t}
            className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 dark:bg-slate-800 px-2 py-0.5 text-xs cursor-pointer hover:bg-neutral-200 dark:hover:bg-slate-700"
          >
            {REACTION_EMOJIS[Number(t) as 1 | 2 | 3 | 4 | 5]} {count}
          </span>
        ))}
        <Popover
          open={openReactionFor === d._id}
          onOpenChange={(open) => setOpenReactionFor(open ? d._id : null)}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            >
              {myReaction ? REACTION_EMOJIS[myReaction.type] : '+ Cảm xúc'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 shadow-lg">
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReact(type)}
                  className={cn(
                    'text-xl px-1.5 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors',
                    myReaction?.type === type && 'bg-neutral-200 dark:bg-slate-600'
                  )}
                  title={REACTION_EMOJIS[type]}
                >
                  {REACTION_EMOJIS[type]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderPost = (d: Discussion, isReply = false) => {
    const creator = getCreator(d.creator);
    const isOwn =
      creator?._id === user?._id ||
      (typeof d.creator === 'string' && d.creator === user?._id);
    const replies = isReply ? [] : repliesFor(d._id);
    const isExpanded = expandedReplies.has(d._id);

    return (
      <div
        key={d._id}
        className={cn(
          'rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-4 space-y-2',
          isReply && 'border-l-4 border-l-primary/30 rounded-l-none ml-4'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          {renderAuthor(d, isOwn)}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {d.createdAt ? timeAgo(d.createdAt) : ''}
            </span>
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

        {/* Badges & votes */}
        {!isReply && (
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {d.isResolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                ✓ {t('discussion.resolved')}
              </span>
            )}
            <button
              type="button"
              onClick={() => voteMutation.mutate({ id: d._id, type: 'upvote' })}
              disabled={voteMutation.isPending}
              className={cn(
                'inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors',
                (d.upvotes ?? []).includes(user?._id ?? '')
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {(d.upvotes ?? []).length}
            </button>
            <button
              type="button"
              onClick={() => voteMutation.mutate({ id: d._id, type: 'downvote' })}
              disabled={voteMutation.isPending}
              className={cn(
                'inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors',
                (d.downvotes ?? []).includes(user?._id ?? '')
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              {(d.downvotes ?? []).length}
            </button>
          </div>
        )}

        {/* Reactions */}
        {!isReply && renderReactionBar(d)}

        {/* Reply section */}
        {!isReply && (
          <div className="pt-1 space-y-2">
            <div className="flex items-center gap-3">
              {replies.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => {
                      const next = new Set(prev);
                      if (next.has(d._id)) { next.delete(d._id); } else { next.add(d._id); }
                      return next;
                    })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t('discussion.commentCount', { n: String(replies.length) })} {isExpanded ? '▲' : '▼'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(replyTarget === d._id ? null : d._id);
                  setReplyContent('');
                }}
                className="text-xs text-primary hover:underline"
              >
                {t('discussion.replyBtn')}
              </button>
            </div>

            {isExpanded && replies.length > 0 && (
              <div className="space-y-2">
                {replies.map((r) => renderPost(r, true))}
              </div>
            )}

            {replyTarget === d._id && (
              <div className="flex gap-2 items-end">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value.slice(0, 500))}
                  placeholder={t('discussion.replyPlaceholder')}
                  rows={2}
                  className="resize-none flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (replyContent.trim()) replyMutation.mutate(d._id);
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => replyMutation.mutate(d._id)}
                  disabled={!replyContent.trim() || replyMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
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
        <Link href={`/student/classes/${subjectId}/discussion`}>
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-semibold text-lg leading-tight">{sessionLabel}</h1>
          <p className="text-xs text-muted-foreground">{t('discussion.sessionSubtitle')}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          {t('discussion.postBtn')}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : mainPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 py-14 gap-3 text-center">
          <MessageSquare className="h-9 w-9 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">{t('discussion.emptyNoPosts')}</p>
          <p className="text-sm text-muted-foreground">{t('discussion.emptyPostHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mainPosts.map((d) => (
            <div key={d._id} className="group">
              {renderPost(d)}
            </div>
          ))}
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) { setNewTitle(''); setNewContent(''); setNewImages([]); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('discussion.createPostDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t('discussion.postTitleLabel')} <span className="text-muted-foreground/70">{t('discussion.titleOptional')}</span>
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, 100))}
                placeholder={t('discussion.postTitlePlaceholder')}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right mt-0.5">{newTitle.length}/100</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t('discussion.contentLabel')} <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value.slice(0, 500))}
                placeholder={t('discussion.postContentPlaceholder')}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p
                className={cn(
                  'text-xs text-right mt-0.5',
                  newContent.length > 450 ? 'text-amber-600' : 'text-muted-foreground'
                )}
              >
                {newContent.length}/500
              </p>
            </div>

            {/* Images */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {newImages.map((url, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {newImages.length < 3 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImages}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-lg px-3 py-2 w-full justify-center hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ImageIcon className="h-4 w-4" />
                {uploadingImages ? t('discussion.uploadingImages') : t('discussion.addImageBtn')}
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCreateDialog(false); setNewTitle(''); setNewContent(''); setNewImages([]); }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newContent.trim() || createMutation.isPending || uploadingImages}
            >
              {createMutation.isPending ? t('discussion.posting') : t('discussion.postBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
