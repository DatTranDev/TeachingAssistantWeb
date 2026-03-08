'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hash } from 'lucide-react';
import { channelsApi, postsApi } from '@/lib/api/channels';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useChannelRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';
import type { Post, User } from '@/types/domain';

function getCreator(creator: Post['creator']): User | null {
  if (typeof creator === 'object' && creator !== null) return creator as User;
  return null;
}

export default function StudentChannelPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('channel.timeJustNow');
    if (mins < 60) return t('channel.timeMinsAgo', { n: String(mins) });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('channel.timeHoursAgo', { n: String(hrs) });
    return new Date(dateStr).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
  };

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: queryKeys.channels.bySubject(subjectId),
    queryFn: () => channelsApi.getBySubject(subjectId),
    staleTime: 60_000,
  });

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

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  if (loadingChannels || loadingPosts) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!mainChannel || sortedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-3 text-center">
        <Hash className="h-8 w-8 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">{t('channel.noAnnouncements')}</p>
        <p className="text-sm text-muted-foreground">{t('channel.noAnnouncementsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedPosts.map((post) => {
        const creator = getCreator(post.creator);
        return (
          <div
            key={post._id}
            className="rounded-xl border bg-white dark:bg-slate-900 p-5 space-y-3"
          >
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
            {post.title && post.title !== 'Thông báo' && (
              <h3 className="font-semibold text-base">{post.title}</h3>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        );
      })}
    </div>
  );
}
