'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Subject } from '@/types/domain';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

const schema = z.object({
  name: z.string().min(1, 'Tên môn học là bắt buộc'),
  maxAbsences: z.number().int().min(0, 'Phải >= 0'),
});

type FormValues = z.infer<typeof schema>;

interface SubjectSettingsFormProps {
  subject: Subject;
  subjectId: string;
}

export function SubjectSettingsForm({ subject, subjectId }: SubjectSettingsFormProps) {
  const queryClient = useQueryClient();
  const { t } = useT();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: subject.name,
      maxAbsences: subject.maxAbsences,
    },
  });

  useEffect(() => {
    reset({ name: subject.name, maxAbsences: subject.maxAbsences });
  }, [subject, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => subjectsApi.update(subjectId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byId(subjectId) });
      toast.success(t('subjects.settingsForm.saveSuccess'));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('subjects.settingsForm.saveError'));
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <FormField label={t('subjects.settingsForm.nameLabel')} error={errors.name?.message}>
        <Input {...register('name')} />
      </FormField>

      <FormField label={t('subjects.settingsForm.codeLabel')}>
        <Input value={subject.code} disabled className="bg-neutral-50 text-muted-foreground" />
      </FormField>

      <FormField
        label={t('subjects.settingsForm.maxAbsencesLabel')}
        error={errors.maxAbsences?.message}
      >
        <Input type="number" min={0} {...register('maxAbsences', { valueAsNumber: true })} />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('subjects.settingsForm.saveBtn')}
        </Button>
      </div>
    </form>
  );
}
