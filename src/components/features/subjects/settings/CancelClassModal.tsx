'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { subjectsApi } from '@/lib/api/subjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

interface CancelClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

export function CancelClassModal({ open, onOpenChange, subjectId }: CancelClassModalProps) {
  const { t } = useT();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [dateError, setDateError] = useState('');

  const mutation = useMutation({
    mutationFn: () => subjectsApi.notifyCancelClass({ subjectId, date, reason }),
    onSuccess: () => {
      toast.success(t('subjects.cancelModal.successToast'));
      setDate('');
      setReason('');
      onOpenChange(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.cancelModal.errorToast'));
    },
  });

  const handleSubmit = () => {
    if (!date) {
      setDateError(t('subjects.cancelModal.dateRequired'));
      return;
    }
    setDateError('');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('subjects.cancelModal.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('subjects.cancelModal.description')}</p>
        <div className="space-y-4">
          <FormField label={t('subjects.cancelModal.dayOffLabel')} error={dateError}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label={t('subjects.cancelModal.reasonLabel')}>
            <Textarea
              rows={3}
              placeholder={t('subjects.cancelModal.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('subjects.cancelModal.cancelBtn')}
            </Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subjects.cancelModal.sendBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
