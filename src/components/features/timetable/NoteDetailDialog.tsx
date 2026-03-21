'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Clock, MapPin, Users, CheckSquare, Pencil, Trash2, Timer, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { notesApi } from '@/lib/api/notes';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { NoteFormDialog } from './NoteFormDialog';
import { Input } from '@/components/ui/input';
import type { TimetableNote } from '@/types/domain';

interface NoteDetailDialogProps {
  note: TimetableNote | null;
  onClose: () => void;
}

export function NoteDetailDialog({ note, onClose }: NoteDetailDialogProps) {
  const { user } = useAuth();
  const { t, locale } = useT();
  const qc = useQueryClient();
  const [editedNote, setEditedNote] = useState<Partial<TimetableNote>>({});
  const [newCheckText, setNewCheckText] = useState('');

  const invalidate = () => {
    if (user?._id) qc.invalidateQueries({ queryKey: queryKeys.notes.byUser(user._id) });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TimetableNote> }) =>
      notesApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditedNote({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => { invalidate(); onClose(); },
  });

  if (!note) return null;

  const handleToggleItem = (i: number) => {
    const updated = note.checklist.map((c, idx) =>
      idx === i ? { ...c, done: !c.done } : c
    );
    updateMutation.mutate({ id: note._id, payload: { checklist: updated } });
  };

  const handleToggleDone = () => {
    updateMutation.mutate({ id: note._id, payload: { done: !note.done } });
  };

  const handleUpdateField = (field: keyof TimetableNote, value: any) => {
    setEditedNote((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInline = (field: keyof TimetableNote) => {
    const val = editedNote[field];
    if (val !== undefined && val !== note[field]) {
      updateMutation.mutate({ id: note._id, payload: { [field]: val } });
    }
    // Clear specific field from local state after saving (optional, but keep it for now)
    setEditedNote(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAddChecklist = () => {
    const text = newCheckText.trim();
    if (!text) return;
    const updated = [...note.checklist, { text, done: false }];
    updateMutation.mutate({ id: note._id, payload: { checklist: updated } });
    setNewCheckText('');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const localeStr = locale === 'vi' ? 'vi-VN' : 'en-US';
    return d.toLocaleDateString(localeStr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const doneChecked = note.checklist.filter((c) => c.done).length;
  const totalChecked = note.checklist.length;

  return (
    <>
      <Dialog open={!!note} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-0">
            <div className="flex items-start gap-2 group/title">
              <span
                className={cn(
                  'mt-0.5 h-2.5 w-2.5 rounded-full shrink-0',
                  note.done ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
              <div className="flex-1">
                <DialogTitle className="sr-only">{note.title}</DialogTitle>
                <Input
                  className={cn(
                    "h-8 text-sm font-semibold border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 cursor-pointer focus:cursor-text",
                    note.done && "line-through text-muted-foreground"
                  )}
                  value={editedNote.title ?? note.title}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  onBlur={() => handleSaveInline('title')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline('title')}
                />
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-1 text-sm">
            {/* Date */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <Input
                type="date"
                className="h-8 text-xs w-32 border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 cursor-pointer focus:cursor-text"
                value={editedNote.date ?? note.date}
                onChange={(e) => handleUpdateField('date', e.target.value)}
                onBlur={() => handleSaveInline('date')}
              />
              {!editedNote.date && note.date && (
                <span className="text-[10px] opacity-60">({formatDate(note.date)})</span>
              )}
            </div>

            {/* Time + Duration */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="h-8 text-xs w-28 border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 cursor-pointer focus:cursor-text"
                  value={editedNote.time ?? note.time ?? ''}
                  onChange={(e) => handleUpdateField('time', e.target.value)}
                  onBlur={() => handleSaveInline('time')}
                />
                <Timer className="h-3.5 w-3.5 shrink-0 ml-1 ml-1.5" />
                <div className="flex items-center">
                  <Input
                    type="number"
                    className="h-8 text-xs w-14 border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 border-r-0 rounded-r-none pr-0 cursor-pointer focus:cursor-text"
                    value={editedNote.duration ?? note.duration ?? ''}
                    onChange={(e) => handleUpdateField('duration', parseInt(e.target.value, 10))}
                    onBlur={() => handleSaveInline('duration')}
                  />
                  <span className="text-[10px] bg-transparent pr-1.5">min</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <Input
                className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 cursor-pointer focus:cursor-text"
                placeholder={t('notes.placeholder.location')}
                value={editedNote.location ?? note.location ?? ''}
                onChange={(e) => handleUpdateField('location', e.target.value)}
                onBlur={() => handleSaveInline('location')}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveInline('location')}
              />
            </div>

            {/* With whom */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <Input
                className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent hover:bg-muted/30 focus:bg-white transition-all px-1.5 -ml-1.5 cursor-pointer focus:cursor-text"
                placeholder={t('notes.placeholder.doingWith')}
                value={editedNote.doingWith ?? note.doingWith ?? ''}
                onChange={(e) => handleUpdateField('doingWith', e.target.value)}
                onBlur={() => handleSaveInline('doingWith')}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveInline('doingWith')}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">
                  {doneChecked}/{totalChecked} {t('common.done') || 'done'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all"
                  style={{ width: `${totalChecked ? (doneChecked / totalChecked) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-1 pt-1">
                {note.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      id={`detail-chk-${i}`}
                      checked={item.done}
                      onCheckedChange={() => handleToggleItem(i)}
                      disabled={updateMutation.isPending}
                    />
                    <label
                      htmlFor={`detail-chk-${i}`}
                      className={cn('text-sm cursor-pointer select-none', item.done && 'line-through text-muted-foreground')}
                    >
                      {item.text}
                    </label>
                  </div>
                ))}
                {/* Inline add checklist item */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder={t('notes.placeholder.checklist')}
                    className="h-7 text-xs"
                    value={newCheckText}
                    onChange={(e) => setNewCheckText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={handleAddChecklist}
                    disabled={updateMutation.isPending || !newCheckText.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Done toggle row */}
            <button
              type="button"
              onClick={handleToggleDone}
              disabled={updateMutation.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors cursor-pointer',
                note.done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-dashed hover:border-emerald-300 hover:text-emerald-700 text-muted-foreground'
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {note.done ? `✓ ${t('notes.markAsDone')}` : t('notes.markAsDone')}
            </button>
          </div>

          {/* Action row */}
          <div className="flex gap-2 pt-1 border-t mt-1 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
              onClick={() => deleteMutation.mutate(note._id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
