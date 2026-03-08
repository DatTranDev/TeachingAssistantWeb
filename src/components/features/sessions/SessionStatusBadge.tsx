'use client';

import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

type CAttendStatus = 'live' | 'upcoming' | 'ended' | 'cancelled';

interface SessionStatusBadgeProps {
  status: CAttendStatus;
}

const STATUS_CLASS: Record<CAttendStatus, string> = {
  live: 'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
  ended: 'bg-neutral-100 text-neutral-500',
  cancelled: 'bg-red-100 text-red-500',
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const { t } = useT();
  const label = t(`sessionStatus.${status}` as Parameters<typeof t>[0]);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status]
      )}
    >
      {label}
    </span>
  );
}

export function getCAttendStatus(cAttend: {
  isActive: boolean;
  isClosed: boolean;
  date: string;
}): CAttendStatus {
  if (cAttend.isActive && !cAttend.isClosed) return 'live';
  if (cAttend.isClosed) return 'ended';
  const today = new Date();
  const sessionDate = new Date(cAttend.date);
  if (sessionDate > today) return 'upcoming';
  return 'ended';
}
