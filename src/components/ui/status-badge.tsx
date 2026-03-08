import { cn } from '@/lib/utils';
import type { AttendanceStatus, AbsenceRequestStatus } from '@/types/domain';

type StatusValue = AttendanceStatus | AbsenceRequestStatus | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Attendance
  CM: { label: 'Present', className: 'bg-success-light text-success' },
  KP: { label: 'Absent', className: 'bg-danger-light text-danger' },
  CP: { label: 'Excused', className: 'bg-warning-light text-warning' },
  // Absence requests
  pending: { label: 'Pending', className: 'bg-warning-light text-warning' },
  approved: { label: 'Approved', className: 'bg-success-light text-success' },
  rejected: { label: 'Rejected', className: 'bg-danger-light text-danger' },
  // Generic
  active: { label: 'Active', className: 'bg-primary-light text-primary' },
  inactive: { label: 'Inactive', className: 'bg-muted/20 text-muted' },
};

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
