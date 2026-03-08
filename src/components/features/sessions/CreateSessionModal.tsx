'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cAttendApi } from '@/lib/api/cAttend';
import { queryKeys } from '@/lib/api/queryKeys';
import type { ClassSession } from '@/types/domain';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

const createSessionSchema = z.object({
  classSessionId: z.string().min(1, 'Chọn lịch học là bắt buộc'),
  date: z.string().min(1, 'Ngày là bắt buộc'),
  timeExpired: z.number().int().min(1),
  enableGps: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type CreateSessionFormValues = z.infer<typeof createSessionSchema>;

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSessions: ClassSession[];
  subjectId: string;
}

export function CreateSessionModal({
  open,
  onOpenChange,
  classSessions,
  subjectId,
}: CreateSessionModalProps) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [enableGps, setEnableGps] = useState(false);
  const getDayLong = (d: number): string => (d >= 1 && d <= 7 ? t(`days.long.d${d}` as TKey) : '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: { timeExpired: 15, enableGps: false },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateSessionFormValues) =>
      cAttendApi.create({
        classSessionId: values.classSessionId,
        date: values.date,
        timeExpired: values.timeExpired,
        teacherGPS:
          values.enableGps && values.latitude !== undefined && values.longitude !== undefined
            ? { latitude: values.latitude, longitude: values.longitude }
            : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
      toast.success(t('sessions.create.successToast'));
      reset();
      setEnableGps(false);
      onOpenChange(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('sessions.create.errorToast'));
    },
  });

  const handleGpsToggle = (checked: boolean) => {
    setEnableGps(checked);
    setValue('enableGps', checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sessions.create.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField
            label={t('sessions.create.scheduleLabel')}
            error={errors.classSessionId?.message}
          >
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('classSessionId')}
            >
              <option value="">{t('sessions.create.schedulePlaceholder')}</option>
              {classSessions.map((cs) => (
                <option key={cs._id} value={cs._id}>
                  {getDayLong(cs.dayOfWeek)} — {cs.start}–{cs.end} — Phòng {cs.room}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t('sessions.create.dateLabel')} error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </FormField>

          <FormField
            label={t('sessions.create.attendanceTimeLabel')}
            error={errors.timeExpired?.message}
          >
            <Input
              type="number"
              min={1}
              placeholder="15"
              {...register('timeExpired', { valueAsNumber: true })}
            />
          </FormField>

          {/* GPS toggle */}
          <div className="flex items-center gap-3">
            <Switch id="enable-gps" checked={enableGps} onCheckedChange={handleGpsToggle} />
            <Label htmlFor="enable-gps">{t('sessions.create.enableGpsLabel')}</Label>
          </div>

          {enableGps && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude" error={errors.latitude?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="10.123"
                  {...register('latitude', { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="Longitude" error={errors.longitude?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="106.456"
                  {...register('longitude', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('sessions.create.cancelBtn')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('sessions.create.createBtn')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
