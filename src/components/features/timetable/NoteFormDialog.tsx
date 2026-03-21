'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { notesApi } from '@/lib/api/notes';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import type { TimetableNote, ChecklistItem } from '@/types/domain';

interface NoteFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the date (YYYY-MM-DD) when opening from a day cell */
  defaultDate?: string;
  /** Pass existing note to edit */
  existingNote?: TimetableNote;
}

interface FormState {
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  doingWith: string;
  done: boolean;
  checklist: ChecklistItem[];
}

const EMPTY_FORM: FormState = {
  title: '',
  date: '',
  time: '',
  duration: '',
  location: '',
  doingWith: '',
  done: false,
  checklist: [],
};

function noteToForm(note: TimetableNote): FormState {
  return {
    title: note.title,
    date: note.date,
    time: note.time ?? '',
    duration: note.duration ? String(note.duration) : '',
    location: note.location ?? '',
    doingWith: note.doingWith ?? '',
    done: note.done ?? false,
    checklist: note.checklist.map((c) => ({ ...c })),
  };
}

export function NoteFormDialog({ open, onClose, defaultDate, existingNote }: NoteFormDialogProps) {
  const { user } = useAuth();
  const { t } = useT();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newCheckText, setNewCheckText] = useState('');

  // Sync form when dialog opens / note changes
  useEffect(() => {
    if (open) {
      if (existingNote) {
        setForm(noteToForm(existingNote));
      } else {
        setForm({ ...EMPTY_FORM, date: defaultDate ?? '' });
      }
      setNewCheckText('');
    }
  }, [open, existingNote, defaultDate]);

  const invalidate = () => {
    if (user?._id) qc.invalidateQueries({ queryKey: queryKeys.notes.byUser(user._id) });
  };

  const createMutation = useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => { invalidate(); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof notesApi.update>[1] }) =>
      notesApi.update(id, payload),
    onSuccess: () => { invalidate(); onClose(); },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addChecklist = () => {
    const text = newCheckText.trim();
    if (!text) return;
    set('checklist', [...form.checklist, { text, done: false }]);
    setNewCheckText('');
  };

  const toggleCheck = (i: number) =>
    set('checklist', form.checklist.map((c, idx) => (idx === i ? { ...c, done: !c.done } : c)));

  const removeCheck = (i: number) =>
    set('checklist', form.checklist.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!form.title.trim() || !form.date) return;
    const payload = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      duration: form.duration ? parseInt(form.duration, 10) : 0,
      location: form.location.trim(),
      doingWith: form.doingWith.trim(),
      done: form.done,
      checklist: form.checklist,
    };
    if (existingNote) {
      updateMutation.mutate({ id: existingNote._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4 text-amber-500" />
            {existingNote ? t('notes.editNote') : t('notes.addNote')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="note-title">{t('notes.titleLabel')} *</Label>
            <Input
              id="note-title"
              placeholder={t('notes.placeholder.title')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="note-date">{t('notes.dateLabel')} *</Label>
              <Input
                id="note-date"
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-time">{t('notes.timeLabel')}</Label>
              <Input
                id="note-time"
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="note-duration">{t('notes.durationLabel')}</Label>
            <Input
              id="note-duration"
              type="number"
              min={0}
              placeholder="e.g. 60"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="note-location">{t('notes.locationLabel')}</Label>
            <Input
              id="note-location"
              placeholder={t('notes.placeholder.location')}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>

          {/* Doing with whom */}
          <div className="space-y-1.5">
            <Label htmlFor="note-with">{t('notes.doingWithLabel')}</Label>
            <Input
              id="note-with"
              placeholder={t('notes.placeholder.doingWith')}
              value={form.doingWith}
              onChange={(e) => set('doingWith', e.target.value)}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>{t('notes.checklistLabel')}</Label>
            <div className="space-y-1.5">
              {form.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() => toggleCheck(i)}
                    id={`chk-${i}`}
                  />
                  <label
                    htmlFor={`chk-${i}`}
                    className={cn(
                      'flex-1 text-sm cursor-pointer select-none',
                      item.done && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.text}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCheck(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t('notes.placeholder.checklist')}
                value={newCheckText}
                onChange={(e) => setNewCheckText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklist())}
                className="text-sm h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={addChecklist}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Done toggle */}
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="note-done" className="cursor-pointer text-sm font-normal">
              {t('notes.markAsDone')}
            </Label>
            <Switch
              id="note-done"
              checked={form.done}
              onCheckedChange={(v) => set('done', v)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !form.title.trim() || !form.date}>
            {isLoading ? `${t('common.processing')}…` : existingNote ? t('common.save') : t('notes.addNote')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
