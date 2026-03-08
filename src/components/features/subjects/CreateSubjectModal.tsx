'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createSubjectSchema, type CreateSubjectFormValues } from '@/lib/validations/subject';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

interface CreateSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubjectModal({ open, onOpenChange }: CreateSubjectModalProps) {
  const { user } = useAuth();
  const { t } = useT();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateSubjectFormValues) =>
      subjectsApi.create({
        hostId: user!._id,
        name: values.name,
        code: values.code,
        maxAbsences: values.maxAbsences,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byUser(user!._id) });
      toast.success(t('subjects.create.successToast'));
      reset();
      onOpenChange(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.create.errorToast'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('subjects.create.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField label={t('subjects.create.nameLabel')} required error={errors.name?.message}>
            <Input placeholder="VD: Lập trình Web" {...register('name')} />
          </FormField>

          <FormField label={t('subjects.create.codeLabel')} required error={errors.code?.message}>
            <Input placeholder="VD: CS101" {...register('code')} />
          </FormField>

          <FormField
            label={t('subjects.create.maxAbsencesLabel')}
            error={errors.maxAbsences?.message}
          >
            <Input
              type="number"
              min={0}
              placeholder="VD: 3"
              {...register('maxAbsences', { valueAsNumber: true })}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('subjects.create.cancelBtn')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subjects.create.createBtn')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
