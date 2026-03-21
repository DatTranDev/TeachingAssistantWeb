'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  AlertTriangle,
  CalendarX,
  CalendarCheck,
  MessageSquare,
  Users,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { queryKeys } from '@/lib/api/queryKeys';
import { notificationsApi } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';
import type { Notification, NotificationRecipient, NotificationType } from '@/types/domain';

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; color: string }> = {
  absent_warning: { Icon: AlertTriangle, color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
  absence_request: { Icon: Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  class_cancellation: {
    Icon: CalendarX,
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  },
  class_reschedule: {
    Icon: CalendarCheck,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  },
  new_discussion: { Icon: MessageSquare, color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
  group_assigned: { Icon: Users, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
  other: { Icon: Bell, color: 'text-neutral-500 bg-neutral-100 dark:bg-slate-700' },
};

function getConfig(type: NotificationType): { Icon: React.ElementType; color: string } {
  return (
    TYPE_CONFIG[type as string] ?? {
      Icon: Bell,
      color: 'text-neutral-500 bg-neutral-100 dark:bg-slate-700',
    }
  );
}

function getNotif(r: NotificationRecipient): Notification | null {
  if (typeof r.notificationId === 'object' && r.notificationId !== null) {
    return r.notificationId as Notification;
  }
  return null;
}

type Filter = 'all' | 'unread';

export default function TeacherNotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const queryClient = useQueryClient();
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return t('timeAgo.justNow');
    if (diff < 3600) return t('timeAgo.minutesAgo', { count: String(Math.floor(diff / 60)) });
    if (diff < 86400) return t('timeAgo.hoursAgo', { count: String(Math.floor(diff / 3600)) });
    return d.toLocaleDateString(localeTag);
  };

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.getAll(),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = queryClient.getQueryData<NotificationRecipient[]>(queryKeys.notifications.all);
      queryClient.setQueryData<NotificationRecipient[]>(queryKeys.notifications.all, (old) =>
        (old ?? []).map((r) => (r._id === id ? { ...r, isRead: true } : r))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecipient[]>(queryKeys.notifications.all, (old) =>
        (old ?? []).map((r) => ({ ...r, isRead: true }))
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const filtered = filter === 'unread' ? recipients.filter((r) => !r.isRead) : recipients;
  const unreadCount = recipients.filter((r) => !r.isRead).length;

  const handleItemClick = (r: NotificationRecipient) => {
    if (!r.isRead) markRead.mutate(r._id);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('notifications.unread', { count: String(unreadCount) })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            {t('notifications.markAllRead')}
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(['all', 'unread'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === f
                ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? t('notifications.filterAll') : t('notifications.filterUnread')}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary text-white text-xs px-1.5 py-px">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
          <Bell className="h-10 w-10 opacity-30" />
          <p>{filter === 'unread' ? t('notifications.emptyUnread') : t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const notif = getNotif(r);
            if (!notif) return null;
            const { Icon, color } = getConfig(notif.type as NotificationType);
            return (
              <div
                key={r._id}
                onClick={() => handleItemClick(r)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
                  r.isRead
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-800'
                )}
              >
                <div className={cn('rounded-full p-2 flex-shrink-0', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium leading-tight',
                        !r.isRead && 'font-semibold'
                      )}
                    >
                      {notif.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatTime(notif.createdAt ?? r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notif.content}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove.mutate(r._id);
                  }}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                  aria-label={t('notifications.deleteAriaLabel')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {!r.isRead && (
                  <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
