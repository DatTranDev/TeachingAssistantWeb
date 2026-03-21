'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  StickyNote,
  Plus,
  CheckSquare,
  Users,
  Timer,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { classSessionsApi } from '@/lib/api/classSessions';
import { subjectsApi } from '@/lib/api/subjects';
import { notesApi } from '@/lib/api/notes';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ClassSession, Subject, TimetableNote } from '@/types/domain';
import type { TKey } from '@/hooks/use-t';
import { NoteDetailDialog } from './NoteDetailDialog';
import { NoteFormDialog } from './NoteFormDialog';

// ─── Palettes ─────────────────────────────────────────────────────────────────

const SUBJECT_PALETTES = [
  {
    card: 'bg-violet-100 border-violet-300 dark:bg-violet-900/30 dark:border-violet-700',
    title: 'text-violet-900 dark:text-violet-100',
    muted: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-200 text-violet-800 dark:bg-violet-800/40 dark:text-violet-300',
    dot: 'bg-violet-500',
    header: 'bg-violet-500',
  },
  {
    card: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700',
    title: 'text-emerald-900 dark:text-emerald-100',
    muted: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    header: 'bg-emerald-500',
  },
  {
    card: 'bg-sky-100 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700',
    title: 'text-sky-900 dark:text-sky-100',
    muted: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-200 text-sky-800 dark:bg-sky-800/40 dark:text-sky-300',
    dot: 'bg-sky-500',
    header: 'bg-sky-500',
  },
  {
    card: 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700',
    title: 'text-amber-900 dark:text-amber-100',
    muted: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-200 text-amber-800 dark:bg-amber-800/40 dark:text-amber-300',
    dot: 'bg-amber-500',
    header: 'bg-amber-500',
  },
  {
    card: 'bg-rose-100 border-rose-300 dark:bg-rose-900/30 dark:border-rose-700',
    title: 'text-rose-900 dark:text-rose-100',
    muted: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-200 text-rose-800 dark:bg-rose-800/40 dark:text-rose-300',
    dot: 'bg-rose-500',
    header: 'bg-rose-500',
  },
  {
    card: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
    title: 'text-orange-900 dark:text-orange-100',
    muted: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-200 text-orange-800 dark:bg-orange-800/40 dark:text-orange-300',
    dot: 'bg-orange-500',
    header: 'bg-orange-500',
  },
  {
    card: 'bg-teal-100 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700',
    title: 'text-teal-900 dark:text-teal-100',
    muted: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-200 text-teal-800 dark:bg-teal-800/40 dark:text-teal-300',
    dot: 'bg-teal-500',
    header: 'bg-teal-500',
  },
  {
    card: 'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700',
    title: 'text-pink-900 dark:text-pink-100',
    muted: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-200 text-pink-800 dark:bg-pink-800/40 dark:text-pink-300',
    dot: 'bg-pink-500',
    header: 'bg-pink-500',
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12(hhmm: string): string {
  const parts = hhmm.split(':').map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${period}`;
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}

function getSubjectId(subjectId: ClassSession['subjectId']): string {
  if (typeof subjectId === 'string') return subjectId;
  return (subjectId as Subject)._id;
}

function getDOWIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = getDOWIndex(firstDay);
  const cells: (Date | null)[] = [
    ...Array<null>(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ─── Session Detail Dialog ────────────────────────────────────────────────────

interface SessionDetailDialogProps {
  session: ClassSession | null;
  subject: (Subject & { colorIdx: number }) | null;
  role: 'student' | 'teacher';
  onClose: () => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

function SessionDetailDialog({ session, subject, role, onClose, t }: SessionDetailDialogProps) {
  if (!session || !subject) return null;
  const palette = SUBJECT_PALETTES[subject.colorIdx % SUBJECT_PALETTES.length]!;
  const detailHref =
    role === 'teacher' ? `/teacher/classes/${subject._id}` : `/student/classes/${subject._id}`;

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs p-0 overflow-hidden rounded-2xl">
        {/* Colored header strip */}
        <div className={cn('px-4 pt-4 pb-3', palette.card)}>
          <DialogHeader className="p-0">
            <div className="flex items-start gap-2.5">
              <div className={cn('mt-1 h-2.5 w-2.5 rounded-full shrink-0', palette.dot)} />
              <div>
                <DialogTitle className={cn('text-sm font-bold', palette.title)}>
                  {subject.code}
                </DialogTitle>
                {subject.name && (
                  <p className={cn('text-xs mt-0.5 leading-snug', palette.muted)}>{subject.name}</p>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{formatTimeRange(session.start, session.end)}</span>
          </div>
          {session.room && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{t('weekCalendar.room')} {session.room}</span>
            </div>
          )}

          <div className="pt-1">
            <Link
              href={detailHref}
              onClick={onClose}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors',
                palette.badge
              )}
            >
              {t('subjects.card.viewDetail')} →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WeekCalendarProps {
  role: 'student' | 'teacher';
}

export function WeekCalendar({ role }: WeekCalendarProps) {
  const { user } = useAuth();
  const { t, locale } = useT();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedSession, setSelectedSession] = useState<{
    session: ClassSession;
    subject: Subject & { colorIdx: number };
  } | null>(null);
  const [selectedNote, setSelectedNote] = useState<TimetableNote | null>(null);
  const [addNoteDate, setAddNoteDate] = useState<string | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: queryKeys.subjects.byUser(user?._id ?? ''),
    queryFn: () => subjectsApi.getByUserId(user!._id),
    enabled: !!user?._id,
    staleTime: 60_000,
  });

  const { data: classSessions = [], isLoading } = useQuery({
    queryKey: queryKeys.classSessions.byUser(user?._id ?? ''),
    queryFn: () => classSessionsApi.getByUser(user!._id),
    enabled: !!user?._id,
    staleTime: 60_000,
  });

  const { data: notes = [] } = useQuery({
    queryKey: queryKeys.notes.byUser(user?._id ?? ''),
    queryFn: () => notesApi.getByUser(user!._id),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  // Subject color map
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject & { colorIdx: number }>();
    subjects.forEach((s, i) => map.set(s._id, { ...s, colorIdx: i % SUBJECT_PALETTES.length }));
    return map;
  }, [subjects]);

  // Sessions indexed by dayOfWeek (1=Mon…7=Sun)
  const sessionsByDOW = useMemo(() => {
    const map = new Map<number, ClassSession[]>();
    classSessions.forEach((cs) => {
      const arr = map.get(cs.dayOfWeek) ?? [];
      arr.push(cs);
      map.set(cs.dayOfWeek, arr);
    });
    return map;
  }, [classSessions]);

  // Notes indexed by YYYY-MM-DD
  const notesByDate = useMemo(() => {
    const map = new Map<string, TimetableNote[]>();
    notes.forEach((n) => {
      const arr = map.get(n.date) ?? [];
      arr.push(n);
      map.set(n.date, arr);
    });
    return map;
  }, [notes]);

  // Current month/year
  const { year, month } = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [today, monthOffset]);

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const monthLabel = useMemo(() => {
    const localeStr = locale === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(year, month, 1).toLocaleDateString(localeStr, {
      month: 'long',
      year: 'numeric',
    });
  }, [year, month, locale]);

  const getDayShort = (dow: number) => t(`days.short.d${dow}` as TKey);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-44 rounded-lg" />
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  const numWeeks = weeks.length; // 4, 5, or 6

  return (
    <>
      <div
        className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col"
        style={{ height: 'calc(100vh - 8rem)' }}
      >
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-base font-semibold capitalize tracking-tight">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            {monthOffset !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthOffset(0)}
                className="h-7 rounded-full px-3 text-xs mr-1"
              >
                {t('weekCalendar.today')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setMonthOffset((o) => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setMonthOffset((o) => o + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b shrink-0 bg-neutral-50 dark:bg-slate-950/50">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((dow) => (
              <div
                key={dow}
                className={cn(
                  'py-2 text-center text-[10px] font-semibold uppercase tracking-widest',
                  dow >= 6 ? 'text-muted-foreground/40' : 'text-muted-foreground'
                )}
              >
                {getDayShort(dow)}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div
            className="flex-1 grid min-h-0"
            style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
                {week.map((date, di) => {
                  const dow = di + 1; // 1=Mon…7=Sun
                  const isToday = date ? isSameDay(date, today) : false;
                  const isCurrentMonth = date?.getMonth() === month;
                  const isWeekend = dow >= 6;
                  const dateKey = date ? toYYYYMMDD(date) : null;

                  const daySessions: ClassSession[] = isCurrentMonth
                    ? (sessionsByDOW.get(dow) ?? [])
                    : [];

                  const dayNotes: TimetableNote[] = dateKey
                    ? (notesByDate.get(dateKey) ?? [])
                    : [];

                  const MAX_VISIBLE_SESSIONS = 3;
                  const MAX_VISIBLE_NOTES = 2;
                  const visibleSessions = daySessions.slice(0, MAX_VISIBLE_SESSIONS);
                  const hiddenSessionCount = Math.max(0, daySessions.length - MAX_VISIBLE_SESSIONS);
                  const visibleNotes = dayNotes.slice(0, MAX_VISIBLE_NOTES);
                  const hiddenNoteCount = Math.max(0, dayNotes.length - MAX_VISIBLE_NOTES);

                  return (
                    <div
                      key={di}
                      className={cn(
                        'border-r last:border-r-0 p-1 flex flex-col gap-0.5 relative group overflow-hidden',
                        isWeekend && 'bg-neutral-50/80 dark:bg-slate-950/30',
                        isToday && 'bg-primary/5 dark:bg-primary/10',
                        !date && 'bg-neutral-50/30 dark:bg-slate-950/20'
                      )}
                    >
                      {date && (
                        <>
                          {/* Date number + add button row */}
                          <div className="flex items-center justify-between px-0.5">
                            <span
                              className={cn(
                                'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium leading-none',
                                isToday
                                  ? 'bg-primary text-primary-foreground font-bold'
                                  : isCurrentMonth
                                    ? isWeekend
                                      ? 'text-muted-foreground/50'
                                      : 'text-foreground'
                                    : 'text-muted-foreground/25'
                              )}
                            >
                              {date.getDate()}
                            </span>
                            {isCurrentMonth && dateKey && (
                              <button
                                type="button"
                                onClick={() => setAddNoteDate(dateKey)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground/60 hover:text-foreground"
                                aria-label="Add note"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Session chips */}
                          <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                            {visibleSessions.map((cs) => {
                              const subjectId = getSubjectId(cs.subjectId);
                              const subject = subjectMap.get(subjectId);
                              const palette = SUBJECT_PALETTES[subject?.colorIdx ?? 0]!;

                              return (
                                <button
                                  key={cs._id}
                                  type="button"
                                  onClick={() => {
                                    if (subject) setSelectedSession({ session: cs, subject });
                                  }}
                                  className={cn(
                                    'w-full text-left rounded-md border px-1.5 py-1 cursor-pointer',
                                    'transition-all duration-100 hover:shadow-sm hover:brightness-95 active:scale-[0.98]',
                                    'overflow-hidden flex items-center justify-between leading-none',
                                    palette.card
                                  )}
                                >
                                  <span className={cn('text-[10px] font-bold truncate', palette.title)}>
                                    {subject?.code ?? '—'}
                                  </span>
                                  <span className={cn('text-[9px] font-medium opacity-80', palette.muted)}>
                                    {cs.start}–{cs.end}
                                  </span>
                                </button>
                              );
                            })}

                            {hiddenSessionCount > 0 && (
                              <p className="text-[9px] text-muted-foreground px-1">
                                +{hiddenSessionCount} more
                              </p>
                            )}

                            {/* Note chips */}
                            {visibleNotes.map((note) => (
                              <button
                                key={note._id}
                                type="button"
                                onClick={() => setSelectedNote(note)}
                                className={cn(
                                  'w-full text-left rounded-md border border-dashed px-1.5 py-0.5 overflow-hidden',
                                  'transition-all duration-100 hover:shadow-sm active:scale-[0.98]',
                                  note.done
                                    ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-900/20'
                                    : 'border-amber-300 bg-amber-50/60 dark:bg-amber-900/20'
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <StickyNote
                                    className={cn(
                                      'h-2.5 w-2.5 shrink-0',
                                      note.done ? 'text-emerald-500' : 'text-amber-500'
                                    )}
                                  />
                                  <p
                                    className={cn(
                                      'text-[10px] font-medium leading-tight truncate',
                                      note.done
                                        ? 'text-emerald-700 dark:text-emerald-300 line-through'
                                        : 'text-amber-700 dark:text-amber-300'
                                    )}
                                  >
                                    {note.title}
                                  </p>
                                </div>
                              </button>
                            ))}

                            {hiddenNoteCount > 0 && (
                              <p className="text-[9px] text-muted-foreground px-1">
                                +{hiddenNoteCount} note{hiddenNoteCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legend ── */}
        {subjects.length > 0 && (
          <div className="px-4 py-2 border-t bg-neutral-50/60 dark:bg-slate-900/40 flex flex-wrap gap-x-4 gap-y-1 shrink-0">
            {subjects.map((s, i) => {
              const palette = SUBJECT_PALETTES[i % SUBJECT_PALETTES.length]!;
              return (
                <div key={s._id} className="flex items-center gap-1.5">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', palette.dot)} />
                  <span className="text-[11px] font-medium text-muted-foreground">{s.code}</span>
                  {s.name && (
                    <span className="hidden sm:inline text-[11px] text-muted-foreground/50">
                      – {s.name}
                    </span>
                  )}
                </div>
              );
            })}
             <div className="flex items-center gap-1.5">
               <StickyNote className="h-2 w-2 text-amber-500 shrink-0" />
               <span className="text-[11px] font-medium text-muted-foreground">{t('notes.title')}</span>
             </div>
          </div>
        )}
      </div>

      {/* ── Empty state (no class sessions AND no notes yet) ── */}
      {classSessions.length === 0 && notes.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed bg-white dark:bg-slate-900 py-10 flex flex-col items-center gap-3 text-center px-4">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="font-semibold text-muted-foreground">{t('weekCalendar.noSessions')}</p>
            <p className="text-sm text-muted-foreground/60 max-w-sm mt-1">
              {t('weekCalendar.noSessionsDesc')}
            </p>
          </div>
        </div>
      )}

      {/* ── Session detail dialog ── */}
       <SessionDetailDialog
        session={selectedSession?.session ?? null}
        subject={selectedSession?.subject ?? null}
        role={role}
        onClose={() => setSelectedSession(null)}
        t={t}
      />

      {/* ── Note detail dialog ── */}
      <NoteDetailDialog
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />

      {/* ── Add note dialog ── */}
      <NoteFormDialog
        open={!!addNoteDate}
        defaultDate={addNoteDate ?? undefined}
        onClose={() => setAddNoteDate(null)}
      />
    </>
  );
}
