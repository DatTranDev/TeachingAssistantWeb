'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { classSessionsApi } from '@/lib/api/classSessions';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ClassSession, Subject } from '@/types/domain';
import type { TKey } from '@/hooks/use-t';

// ─── Palettes ─────────────────────────────────────────────────────────────────

const SUBJECT_PALETTES = [
  {
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800',
    title: 'text-violet-900 dark:text-violet-100',
    muted: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-800/40 dark:text-violet-300',
    dot: 'bg-violet-500',
    tooltip: 'bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-700',
  },
  {
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    title: 'text-emerald-900 dark:text-emerald-100',
    muted: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    tooltip: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700',
  },
  {
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800',
    title: 'text-sky-900 dark:text-sky-100',
    muted: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-800/40 dark:text-sky-300',
    dot: 'bg-sky-500',
    tooltip: 'bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:border-sky-700',
  },
  {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    title: 'text-amber-900 dark:text-amber-100',
    muted: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300',
    dot: 'bg-amber-500',
    tooltip: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700',
  },
  {
    card: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    title: 'text-rose-900 dark:text-rose-100',
    muted: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-800/40 dark:text-rose-300',
    dot: 'bg-rose-500',
    tooltip: 'bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-700',
  },
  {
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    title: 'text-orange-900 dark:text-orange-100',
    muted: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-800/40 dark:text-orange-300',
    dot: 'bg-orange-500',
    tooltip: 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-700',
  },
  {
    card: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
    title: 'text-teal-900 dark:text-teal-100',
    muted: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-800/40 dark:text-teal-300',
    dot: 'bg-teal-500',
    tooltip: 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700',
  },
  {
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800',
    title: 'text-pink-900 dark:text-pink-100',
    muted: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-800/40 dark:text-pink-300',
    dot: 'bg-pink-500',
    tooltip: 'bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-700',
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeRange(start: string, end: string): string {
  const fmt = (hhmm: string) => {
    const parts = hhmm.split(':').map(Number);
    const hh = parts[0] ?? 0;
    const mm = parts[1] ?? 0;
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${mm.toString().padStart(2, '0')} ${period}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function getSubjectId(subjectId: ClassSession['subjectId']): string {
  if (typeof subjectId === 'string') return subjectId;
  return (subjectId as Subject)._id;
}

/** JS getDay() 0=Sun…6=Sat → 0=Mon…6=Sun */
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

/** Returns a 6×7 grid of Date|null cells for the month, aligned Mon–Sun */
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
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────────
  if (classSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white dark:bg-slate-900 py-20 flex flex-col items-center gap-3 text-center px-4">
        <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="font-semibold text-muted-foreground">{t('weekCalendar.noSessions')}</p>
          <p className="text-sm text-muted-foreground/60 max-w-sm mt-1">
            {t('weekCalendar.noSessionsDesc')}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-sm">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white dark:bg-slate-900">
          <h2 className="text-base font-semibold capitalize tracking-tight">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            {monthOffset !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthOffset(0)}
                className="h-8 rounded-full px-3.5 text-xs mr-1"
              >
                {t('weekCalendar.today')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setMonthOffset((o) => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setMonthOffset((o) => o + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse" style={{ minWidth: '700px' }}>

            {/* Day-of-week header */}
            <thead>
              <tr className="bg-neutral-50 dark:bg-slate-950/50">
                {([1, 2, 3, 4, 5, 6, 7] as const).map((dow) => (
                  <th
                    key={dow}
                    className={cn(
                      'py-3 text-center text-[11px] font-semibold uppercase tracking-widest border-b',
                      dow >= 6 ? 'text-muted-foreground/40' : 'text-muted-foreground'
                    )}
                  >
                    {getDayShort(dow)}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Calendar body */}
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((date, di) => {
                    const dow = di + 1; // 1=Mon…7=Sun
                    const isToday = date ? isSameDay(date, today) : false;
                    const isCurrentMonth = date?.getMonth() === month;
                    const isWeekend = dow >= 6;

                    // Only show sessions for current-month cells
                    const daySessions = isCurrentMonth ? (sessionsByDOW.get(dow) ?? []) : [];

                    return (
                      <td
                        key={di}
                        className={cn(
                          'align-top border border-neutral-100 dark:border-slate-800/70 p-2',
                          'h-30 w-[calc(100%/7)]',
                          isWeekend && 'bg-neutral-50/70 dark:bg-slate-950/30',
                          isToday && 'bg-primary/3 dark:bg-primary/10',
                          !date && 'bg-neutral-50/30 dark:bg-slate-950/20',
                        )}
                      >
                        {date && (
                          <div className="flex flex-col gap-1.5 h-full">

                            {/* Date number */}
                            <div className="flex justify-end">
                              <span
                                className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium',
                                  isToday
                                    ? 'bg-primary text-primary-foreground font-bold'
                                    : isCurrentMonth
                                    ? isWeekend
                                      ? 'text-muted-foreground/50'
                                      : 'text-foreground'
                                    : 'text-muted-foreground/25',
                                )}
                              >
                                {date.getDate()}
                              </span>
                            </div>

                            {/* Session cards */}
                            <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                              {daySessions.map((cs) => {
                                const subjectId = getSubjectId(cs.subjectId);
                                const subject = subjectMap.get(subjectId);
                                const palette = SUBJECT_PALETTES[(subject?.colorIdx ?? 0)]!;
                                const detailHref =
                                  role === 'teacher'
                                    ? `/teacher/classes/${subjectId}`
                                    : `/student/classes/${subjectId}`;

                                return (
                                  <Tooltip key={cs._id}>
                                    <TooltipTrigger asChild>
                                      <Link
                                        href={detailHref}
                                        className={cn(
                                          'block rounded-xl border px-2 py-1.5 text-left',
                                          'transition-all duration-150 hover:shadow-md hover:-translate-y-px active:scale-[0.98]',
                                          palette.card,
                                        )}
                                      >
                                        {/* Subject code */}
                                        <p className={cn('text-[11px] font-bold leading-tight truncate', palette.title)}>
                                          {subject?.code ?? '—'}
                                        </p>

                                        {/* Subject name */}
                                        {subject?.name && (
                                          <p className={cn('text-[10px] leading-tight truncate mt-0.5', palette.muted)}>
                                            {subject.name}
                                          </p>
                                        )}

                                        {/* Badges row */}
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium', palette.badge)}>
                                            <Clock className="h-2.25 w-2.25" />
                                            {cs.start}–{cs.end}
                                          </span>
                                          {cs.room && (
                                            <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium', palette.badge)}>
                                              <MapPin className="h-2.25 w-2.25" />
                                              {cs.room}
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    </TooltipTrigger>

                                    {/* Hover tooltip — rendered via portal, no overflow clip */}
                                    <TooltipContent
                                      side="right"
                                      align="start"
                                      className="p-0 w-56 rounded-2xl overflow-hidden border-0 shadow-xl"
                                    >
                                      {/* Colored header */}
                                      <div className={cn('px-3.5 pt-3 pb-2.5 border-b', palette.tooltip)}>
                                        <div className="flex items-start gap-2">
                                          <div className={cn('mt-0.5 h-2.5 w-2.5 rounded-full shrink-0', palette.dot)} />
                                          <div className="min-w-0">
                                            <p className={cn('text-xs font-bold leading-tight', palette.title)}>
                                              {subject?.code ?? '—'}
                                            </p>
                                            {subject?.name && (
                                              <p className={cn('text-[11px] mt-0.5 leading-snug', palette.muted)}>
                                                {subject.name}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Details body */}
                                      <div className="px-3.5 py-2.5 space-y-1.5 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                          <Clock className="h-3 w-3 shrink-0" />
                                          <span>{formatTimeRange(cs.start, cs.end)}</span>
                                        </div>
                                        {cs.room && (
                                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span>{t('weekCalendar.room')}: {cs.room}</span>
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Subject legend ── */}
        {subjects.length > 0 && (
          <div className="px-5 py-3 border-t bg-neutral-50/60 dark:bg-slate-900/40 flex flex-wrap gap-x-5 gap-y-1.5">
            {subjects.map((s, i) => {
              const palette = SUBJECT_PALETTES[i % SUBJECT_PALETTES.length]!;
              return (
                <div key={s._id} className="flex items-center gap-1.5">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', palette.dot)} />
                  <span className="text-xs font-medium text-muted-foreground">{s.code}</span>
                  {s.name && (
                    <span className="hidden sm:inline text-xs text-muted-foreground/50">
                      – {s.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

