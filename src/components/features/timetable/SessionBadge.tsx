'use client';

import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

type SessionStatus = 'live' | 'upcoming' | 'ended';

interface SessionBadgeProps {
  status: SessionStatus;
}

const STATUS_CLASS: Record<SessionStatus, string> = {
  live: 'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
  ended: 'bg-neutral-100 text-neutral-500',
};

export function SessionBadge({ status }: SessionBadgeProps) {
  const { t } = useT();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status]
      )}
    >
      {t(`sessionStatus.${status}` as Parameters<typeof t>[0])}
    </span>
  );
}
