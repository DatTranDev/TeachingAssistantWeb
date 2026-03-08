'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { groupsApi, groupMessagesApi } from '@/lib/api/groups';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { useSocket } from '@/providers/socket-provider';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Group, GroupMessage, User } from '@/types/domain';

function getSender(senderId: GroupMessage['senderId']): User | null {
  if (typeof senderId === 'object' && senderId !== null) return senderId as User;
  return null;
}

function getSenderId(senderId: GroupMessage['senderId']): string {
  if (typeof senderId === 'object' && senderId !== null) return (senderId as User)._id;
  return senderId as string;
}

function formatTime(dateStr?: string, locale = 'vi'): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr?: string, today?: string, yesterday?: string, locale = 'vi'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const prev = new Date(now);
  prev.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return today ?? 'Today';
  if (d.toDateString() === prev.toDateString()) return yesterday ?? 'Yesterday';
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isSameDate(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isSameSenderWithin3Min(a: GroupMessage, b: GroupMessage): boolean {
  if (getSenderId(a.senderId) !== getSenderId(b.senderId)) return false;
  if (!a.createdAt || !b.createdAt) return false;
  return (
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < 3 * 60 * 1000
  );
}

function UserAvatar({ user }: { user: User }) {
  const initials = user.name?.split(' ').pop()?.charAt(0).toUpperCase() ?? '?';
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}

export default function TeacherGroupChatPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t, locale } = useT();

  const [content, setContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Join subject socket room for revoke events
  useSubjectRoom(user?._id, subjectId);

  // Fetch all groups to find current group info
  const { data: groups = [] } = useQuery({
    queryKey: queryKeys.groups.defaultBySubject(subjectId),
    queryFn: () => groupsApi.getDefaultBySubject(subjectId),
    staleTime: 60_000,
  });
  const group: Group | undefined = groups.find((g) => g._id === groupId);

  // Fetch messages with polling (no socket support for group messages)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: () => groupMessagesApi.getByGroup(groupId, 50),
    refetchInterval: 5_000,
    staleTime: 0,
    enabled: !!groupId,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: () =>
      groupMessagesApi.create({
        groupId,
        senderId: user!._id,
        content: content.trim(),
      }),
    onMutate: async () => {
      const trimmed = content.trim();
      setContent('');
      const optimistic: GroupMessage = {
        _id: `optimistic-${Date.now()}`,
        groupId,
        senderId: user as unknown as User,
        content: trimmed,
        images: [],
        isRevoked: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(['groupMessages', groupId], (old: GroupMessage[] | undefined) => [
        ...(old ?? []),
        optimistic,
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', groupId] });
    },
    onError: () => {
      toast.error(t('groupChat.sendError'));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (messageId: string) => groupMessagesApi.revoke(messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(['groupMessages', groupId], (old: GroupMessage[] | undefined) =>
        (old ?? []).map((m) => (m._id === messageId ? { ...m, isRevoked: true } : m))
      );
      socket?.emit('sendRevokedMessage', { subjectID: subjectId, messageID: messageId });
      toast.success(t('groupChat.revokeSuccess'));
    },
    onError: () => {
      toast.error(t('groupChat.revokeError'));
    },
  });

  const handleReceiveRevokedMessage = useCallback(
    (messageId: string) => {
      queryClient.setQueryData(['groupMessages', groupId], (old: GroupMessage[] | undefined) =>
        (old ?? []).map((m) => (m._id === messageId ? { ...m, isRevoked: true } : m))
      );
    },
    [queryClient, groupId]
  );
  useSocketEvent('receiveRevokedMessage', handleReceiveRevokedMessage);

  const handleSend = useCallback(() => {
    if (!content.trim() || !user) return;
    sendMutation.mutate();
  }, [content, user, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Link href={`/teacher/classes/${subjectId}/groups`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-base">
            {group?.name ?? t('groupChat.groupFallbackName')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('groups.membersCount', { count: String(group?.members?.length ?? 0) })}
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn('flex gap-2', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}
              >
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">{t('groupChat.noMessages')}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const isOwn = getSenderId(msg.senderId) === user?._id;
            const sender = getSender(msg.senderId);
            const showDateSep = !prev || !isSameDate(prev.createdAt, msg.createdAt);
            const showSenderInfo =
              !isOwn && (!prev || !isSameSenderWithin3Min(prev, msg) || showDateSep);

            return (
              <div key={msg._id}>
                {showDateSep && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(
                        msg.createdAt,
                        t('groupChat.today'),
                        t('groupChat.yesterday'),
                        locale
                      )}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div
                  className={cn(
                    'flex gap-2 items-end group',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {!isOwn && (
                    <div className="w-8 shrink-0">
                      {showSenderInfo && sender ? <UserAvatar user={sender} /> : <span />}
                    </div>
                  )}
                  <div
                    className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}
                  >
                    {showSenderInfo && sender && (
                      <span className="text-xs text-muted-foreground mb-0.5 px-1">
                        {sender.name}
                      </span>
                    )}
                    <div className="flex items-end gap-1">
                      {isOwn && !msg.isRevoked && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mb-1 shrink-0"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="left"
                            align="end"
                            className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 shadow-lg"
                          >
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                              onClick={() => revokeMutation.mutate(msg._id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {t('groupChat.revokeAction')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div
                        className={cn(
                          'px-4 py-2 rounded-2xl text-sm wrap-break-word',
                          msg.isRevoked
                            ? 'bg-neutral-100 dark:bg-slate-800 text-muted-foreground italic'
                            : isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-neutral-100 dark:bg-slate-800 text-foreground rounded-bl-sm'
                        )}
                      >
                        {msg.isRevoked ? t('groupChat.revokedMessage') : msg.content}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 px-1">
                      {formatTime(msg.createdAt, locale)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3 flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          placeholder={t('groupChat.messagePlaceholder')}
          rows={1}
          className="min-h-10 max-h-30 resize-none flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
