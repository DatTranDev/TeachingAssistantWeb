'use client';

import { cn } from '@/lib/utils';

type SessionStatus = 'live' | 'upcoming' | 'ended';

interface SessionBadgeProps {
  status: SessionStatus;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  live: {
    label: 'Đang diễn ra',
    className: 'bg-green-100 text-green-700',
  },
  upcoming: {
    label: 'Sắp tới',
    className: 'bg-blue-100 text-blue-700',
  },
  ended: {
    label: 'Đã kết thúc',
    className: 'bg-neutral-100 text-neutral-500',
  },
};

export function SessionBadge({ status }: SessionBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}
