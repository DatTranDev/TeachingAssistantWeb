'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

interface DeleteSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  userId: string;
}

export function DeleteSubjectDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  userId,
}: DeleteSubjectDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [inputValue, setInputValue] = useState('');

  const canDelete = inputValue === subjectName;

  const mutation = useMutation({
    mutationFn: () => subjectsApi.delete(subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byUser(userId) });
      toast.success(t('subjects.deleteDialog.successToast'));
      onOpenChange(false);
      router.push('/teacher/classes');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.deleteDialog.errorToast'));
    },
  });

  const handleClose = () => {
    setInputValue('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t('subjects.deleteDialog.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('subjects.deleteDialog.description')}</p>
        <div className="space-y-4">
          <FormField label={t('subjects.deleteDialog.inputLabel', { name: subjectName })}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={subjectName}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('subjects.deleteDialog.cancelBtn')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={!canDelete || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subjects.deleteDialog.deleteBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
