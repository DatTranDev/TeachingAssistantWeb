'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Paperclip, X } from 'lucide-react';
import { absenceRequestsApi } from '@/lib/api/absenceRequests';
import { uploadApi } from '@/lib/api/upload';
import type { CAttend } from '@/types/domain';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/hooks/use-t';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

interface AbsenceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  subjectId: string;
  cAttend: CAttend;
  onSuccess?: () => void;
}

export function AbsenceRequestModal({
  open,
  onOpenChange,
  studentId,
  subjectId,
  cAttend,
  onSuccess,
}: AbsenceRequestModalProps) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionDate = new Date(cAttend.date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError(t('absenceRequests.request.fileTooLarge'));
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError(t('absenceRequests.request.invalidType'));
      return;
    }
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let proofUrl: string | undefined;
      if (file) {
        proofUrl = await uploadApi.uploadImage(file);
      }
      await absenceRequestsApi.create({
        studentId,
        subjectId,
        date: cAttend.date,
        reason,
        proof: proofUrl ? [proofUrl] : [],
      });
    },
    onSuccess: () => {
      toast.success(t('absenceRequests.request.successToast'));
      onOpenChange(false);
      setReason('');
      setFile(null);
      onSuccess?.();
    },
    onError: () => {
      toast.error(t('absenceRequests.request.errorToast'));
    },
  });

  const canSubmit = reason.trim().length >= 10 && !fileError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('absenceRequests.request.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('absenceRequests.request.sessionLabel', { date: sessionDate })}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>
              {t('absenceRequests.request.reasonLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder={t('absenceRequests.request.reasonPlaceholder')}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-destructive">
                {t('absenceRequests.request.reasonMinLength')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t('absenceRequests.request.attachmentLabel')}</Label>
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border bg-neutral-50 px-3 py-2">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed border-neutral-200 px-4 py-5 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('absenceRequests.request.dropText')}{' '}
                  <span className="text-primary">{t('absenceRequests.request.chooseFile')}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('absenceRequests.request.fileTypes')}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('absenceRequests.request.cancelBtn')}
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('absenceRequests.request.submitBtn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
