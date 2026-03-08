'use client';

import { cn } from '@/lib/utils';

type CAttendStatus = 'live' | 'upcoming' | 'ended' | 'cancelled';

interface SessionStatusBadgeProps {
  status: CAttendStatus;
}

const STATUS_CONFIG: Record<CAttendStatus, { label: string; className: string }> = {
  live: { label: 'Đang diễn ra', className: 'bg-green-100 text-green-700' },
  upcoming: { label: 'Sắp tới', className: 'bg-blue-100 text-blue-700' },
  ended: { label: 'Đã kết thúc', className: 'bg-neutral-100 text-neutral-500' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-500' },
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
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
