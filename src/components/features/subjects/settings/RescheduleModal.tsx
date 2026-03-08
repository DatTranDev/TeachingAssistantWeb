'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { subjectsApi } from '@/lib/api/subjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

export function RescheduleModal({ open, onOpenChange, subjectId }: RescheduleModalProps) {
  const { t } = useT();
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');

  const mutation = useMutation({
    mutationFn: () => subjectsApi.notifyReschedule({ subjectId, date }),
    onSuccess: () => {
      toast.success(t('subjects.rescheduleModal.successToast'));
      setDate('');
      onOpenChange(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.rescheduleModal.errorToast'));
    },
  });

  const handleSubmit = () => {
    if (!date) {
      setDateError(t('subjects.rescheduleModal.dateRequired'));
      return;
    }
    setDateError('');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('subjects.rescheduleModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label={t('subjects.rescheduleModal.dateLabel')} error={dateError}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('subjects.rescheduleModal.cancelBtn')}
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subjects.rescheduleModal.sendBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
