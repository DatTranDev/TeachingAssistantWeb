'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hash, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { channelsApi, postsApi } from '@/lib/api/channels';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useChannelRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';
import type { Post, User } from '@/types/domain';

function getCreator(creator: Post['creator']): User | null {
  if (typeof creator === 'object' && creator !== null) return creator as User;
  return null;
}

export default function TeacherChannelPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t, locale } = useT();
  const defaultAnnouncementTitle = locale === 'vi' ? 'Thong bao' : 'Announcement';

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('timeAgo.justNow');
    if (mins < 60) return t('timeAgo.minutesAgo', { count: String(mins) });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('timeAgo.hoursAgo', { count: String(hrs) });
    return t('timeAgo.daysAgo', { count: String(Math.floor(hrs / 24)) });
  };

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: queryKeys.channels.bySubject(subjectId),
    queryFn: () => channelsApi.getBySubject(subjectId),
    staleTime: 60_000,
  });

  // Use the first channel as the main announcement channel
  const mainChannel = channels[0];

  useChannelRoom(user?._id, subjectId, mainChannel?._id);

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: queryKeys.posts.byChannel(mainChannel?._id ?? ''),
    queryFn: () => postsApi.getByChannel(mainChannel!._id),
    enabled: !!mainChannel?._id,
    staleTime: 30_000,
  });

  const handleReceiveChannelMessage = useCallback(
    (post: Post) => {
      queryClient.setQueryData(
        queryKeys.posts.byChannel(mainChannel?._id ?? ''),
        (old: Post[] | undefined) => [post, ...(old ?? [])]
      );
    },
    [queryClient, mainChannel?._id]
  );
  useSocketEvent('receiveChannelMessage', handleReceiveChannelMessage);

  const createChannelMutation = useMutation({
    mutationFn: () => channelsApi.create({ subjectId, name: defaultAnnouncementTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.bySubject(subjectId) });
    },
    onError: () => toast.error(t('channel.createChannelError')),
  });

  const createPostMutation = useMutation({
    mutationFn: () =>
      postsApi.create({
        channelId: mainChannel!._id,
        creator: user!._id,
        title: title.trim() || defaultAnnouncementTitle,
        content: content.trim(),
      }),
    onSuccess: (newPost) => {
      queryClient.setQueryData(
        queryKeys.posts.byChannel(mainChannel!._id),
        (old: Post[] | undefined) => [newPost, ...(old ?? [])]
      );
      setTitle('');
      setContent('');
      toast.success(t('channel.postSuccess'));
    },
    onError: () => toast.error(t('channel.postError')),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.byChannel(mainChannel!._id) });
      const snapshot = queryClient.getQueryData(queryKeys.posts.byChannel(mainChannel!._id));
      queryClient.setQueryData(
        queryKeys.posts.byChannel(mainChannel!._id),
        (old: Post[] | undefined) => old?.filter((p) => p._id !== id) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.posts.byChannel(mainChannel!._id), ctx.snapshot);
      }
      toast.error(t('channel.deleteError'));
    },
    onSuccess: () => {
      toast.success(t('channel.deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  const isLoading = loadingChannels || loadingPosts;
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  const canPost = content.trim().length > 0 && content.length <= 2000;

  if (loadingChannels) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!mainChannel) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-4 text-center">
        <Hash className="h-8 w-8 text-muted-foreground/40" />
        <p className="font-medium">{t('channel.noChannel')}</p>
        <p className="text-sm text-muted-foreground">{t('channel.noChannelDesc')}</p>
        <Button
          onClick={() => createChannelMutation.mutate()}
          disabled={createChannelMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('channel.createChannelBtn')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create post */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-3">
        <p className="text-sm font-medium">{t('channel.createPostTitle')}</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('channel.titlePlaceholder')}
          maxLength={200}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('channel.contentPlaceholder')}
          rows={4}
          maxLength={2000}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs',
              content.length > 1800 ? 'text-amber-600' : 'text-muted-foreground'
            )}
          >
            {content.length}/2000
          </span>
          <Button
            size="sm"
            onClick={() => createPostMutation.mutate()}
            disabled={!canPost || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? t('channel.posting') : t('channel.postBtn')}
          </Button>
        </div>
      </div>

      {/* Posts */}
      {loadingPosts ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-3 text-center">
          <Hash className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">{t('channel.noPosts')}</p>
          <p className="text-sm text-muted-foreground">{t('channel.noPostsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post) => {
            const creator = getCreator(post.creator);
            const isOwn =
              creator?._id === user?._id ||
              (typeof post.creator === 'string' && post.creator === user?._id);
            return (
              <div
                key={post._id}
                className="rounded-xl border bg-white dark:bg-slate-900 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                      {creator?.name?.[0]?.toUpperCase() ?? 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {creator?.name ?? t('channel.teacherFallback')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.createdAt ? timeAgo(post.createdAt) : ''}
                      </p>
                    </div>
                  </div>
                  {isOwn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(post)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {post.title &&
                  post.title !== 'Thong bao' &&
                  post.title !== 'Thông báo' &&
                  post.title !== 'Announcement' && (
                    <h3 className="font-semibold text-base">{post.title}</h3>
                  )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('channel.deleteConfirmTitle')}
        description={t('channel.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={deletePostMutation.isPending}
        onConfirm={() => deleteTarget && deletePostMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
