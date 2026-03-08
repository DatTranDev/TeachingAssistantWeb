'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useT } from '@/hooks/use-t';

interface JoinSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinSubjectModal({ open, onOpenChange }: JoinSubjectModalProps) {
  const { user } = useAuth();
  const { t } = useT();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [fieldError, setFieldError] = useState('');

  const mutation = useMutation({
    mutationFn: () => subjectsApi.join({ studentId: user!._id, joinCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byUser(user!._id) });
      toast.success(t('subjects.join.successToast'));
      setJoinCode('');
      setFieldError('');
      onOpenChange(false);
    },
    onError: (error: { message?: string; response?: { status?: number } }) => {
      const status = error.response?.status;
      if (status === 404) {
        setFieldError(t('subjects.join.invalidCode'));
      } else if (status === 400) {
        setFieldError(t('subjects.join.alreadyJoined'));
      } else {
        toast.error(error.message ?? t('subjects.create.errorToast'));
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    if (!joinCode.trim()) {
      setFieldError(t('subjects.join.codeRequired'));
      return;
    }
    mutation.mutate();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setJoinCode('');
      setFieldError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('subjects.join.title')}</DialogTitle>
          <DialogDescription>{t('subjects.join.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('subjects.join.codeLabel')} required error={fieldError}>
            <Input
              placeholder={t('subjects.join.codePlaceholder')}
              className="font-mono tracking-widest uppercase"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setFieldError('');
              }}
              disabled={mutation.isPending}
              autoFocus
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('subjects.join.cancelBtn')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !joinCode.trim()}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subjects.join.joinBtn')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
