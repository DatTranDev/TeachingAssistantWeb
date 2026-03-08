'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { AbsenceRequest, User } from '@/types/domain';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AbsenceRequest;
  onConfirm: (comment: string) => Promise<void>;
}

function getStudentName(studentId: AbsenceRequest['studentId']): string {
  if (typeof studentId === 'object' && studentId !== null) {
    return (studentId as User).name ?? '';
  }
  return '';
}

export function AbsenceRejectModal({ open, onOpenChange, request, onConfirm }: Props) {
  const { t } = useT();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString('vi-VN')}`;
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(comment.trim());
      setComment('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('absenceRequests.reject.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-neutral-50 border px-3 py-2 text-sm space-y-0.5">
            <p className="font-medium">{getStudentName(request.studentId)}</p>
            <p className="text-muted-foreground">{formatDate(request.date)}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment">{t('absenceRequests.reject.reasonLabel')}</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('absenceRequests.reject.reasonPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('absenceRequests.reject.cancelBtn')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? t('common.processing') : t('absenceRequests.reject.rejectBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
