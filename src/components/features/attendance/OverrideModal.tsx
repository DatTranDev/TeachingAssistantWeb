'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import type { AttendanceStatus, User } from '@/types/domain';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useT } from '@/hooks/use-t';

interface OverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: User;
  cAttendId: string;
  sessionDate: string;
  currentStatus?: AttendanceStatus;
  onSuccess?: () => void;
}

export function OverrideModal({
  open,
  onOpenChange,
  student,
  cAttendId,
  sessionDate,
  currentStatus,
  onSuccess,
}: OverrideModalProps) {
  const { t, locale } = useT();
  const [status, setStatus] = useState<AttendanceStatus>(currentStatus ?? 'KP');
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: 'CM', label: `CM — ${t('studentAttendance.statusPresent')}` },
    { value: 'KP', label: `KP — ${t('studentAttendance.statusAbsent')}` },
    { value: 'CP', label: `CP — ${t('studentAttendance.statusExcused')}` },
  ];

  const mutation = useMutation({
    mutationFn: () =>
      attendRecordsApi.addForStudent({
        cAttendId,
        studentId: student._id,
        status,
      }),
    onSuccess: () => {
      toast.success(t('attendance.override.successToast'));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error(t('attendance.override.errorToast'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('attendance.override.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {student.name} — {new Date(sessionDate).toLocaleDateString(localeTag)}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t('attendance.override.statusLabel')}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('attendance.override.saveBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
