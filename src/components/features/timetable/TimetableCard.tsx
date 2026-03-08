'use client';

import Link from 'next/link';
import { CalendarDays, Users, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { cAttendApi } from '@/lib/api/cAttend';
import type { Subject, CAttend, ClassSession } from '@/types/domain';
import { SessionBadge } from './SessionBadge';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

interface TimetableCardProps {
  subject: Subject;
  role: 'teacher' | 'student';
}

type SessionStatus = 'live' | 'upcoming' | 'ended';

function getSessionStatus(cAttend: CAttend): SessionStatus {
  if (cAttend.isActive && !cAttend.isClosed) return 'live';
  if (cAttend.isClosed) return 'ended';
  const today = new Date();
  const sessionDate = new Date(cAttend.date);
  if (sessionDate > today) return 'upcoming';
  return 'ended';
}

function getNextCAttend(cAttends: CAttend[]): CAttend | null {
  const now = new Date();

  // Active session takes priority
  const live = cAttends.find((c) => c.isActive && !c.isClosed);
  if (live) return live;

  // Otherwise earliest future session
  const upcoming = cAttends
    .filter((c) => !c.isClosed && new Date(c.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? cAttends[cAttends.length - 1] ?? null;
}

export function TimetableCard({ subject, role }: TimetableCardProps) {
  const { t } = useT();

  const getDayLong = (d: Date): string => {
    const idx = d.getDay() === 0 ? 7 : d.getDay();
    return idx >= 1 && idx <= 7 ? t(`days.long.d${idx}` as TKey) : '';
  };

  const formatSessionDate = (date: string, classSession?: ClassSession | null): string => {
    const d = new Date(date);
    const day = getDayLong(d);
    const dateStr = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    if (classSession && typeof classSession !== 'string') {
      return `${day}, ${dateStr} ${t('timetableCard.at')} ${classSession.start}`;
    }
    return `${day}, ${dateStr}`;
  };
  const { data: cAttends = [] } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subject._id),
    queryFn: () => cAttendApi.getBySubject(subject._id),
    staleTime: 60_000,
  });

  const nextCAttend = getNextCAttend(cAttends);
  const status: SessionStatus | null = nextCAttend ? getSessionStatus(nextCAttend) : null;

  const classSession =
    nextCAttend && typeof nextCAttend.classSessionId !== 'string'
      ? (nextCAttend.classSessionId as ClassSession)
      : null;

  const detailHref =
    role === 'teacher' ? `/teacher/classes/${subject._id}` : `/student/classes/${subject._id}`;

  const hostName =
    typeof subject.hostId !== 'string' ? (subject.hostId as { name: string }).name : '';

  return (
    <div className="flex flex-col rounded-xl border bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-shadow gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {subject.code}
        </span>
        {status && <SessionBadge status={status} />}
      </div>

      {/* Subject name */}
      <h3 className="text-base font-semibold leading-snug line-clamp-2">{subject.name}</h3>

      {/* Role-specific info */}
      {role === 'student' && hostName && (
        <p className="text-sm text-muted-foreground">
          {t('timetableCard.teacherLabel')}
          {hostName}
        </p>
      )}
      {role === 'teacher' && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {t('timetableCard.joinCodeLabel')}
            {subject.joinCode}
          </span>
        </div>
      )}

      <div className="border-t" />

      {/* Next session */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground min-h-[2.5rem]">
        <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
        {nextCAttend ? (
          <div>
            <p className="text-foreground font-medium">{t('timetableCard.nextSession')}</p>
            <p>{formatSessionDate(nextCAttend.date, classSession)}</p>
            {classSession && (
              <p>
                {t('timetableCard.roomLabel')}
                {classSession.room}
              </p>
            )}
          </div>
        ) : (
          <span>{t('timetableCard.noSessions')}</span>
        )}
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={detailHref}>
            {t('timetableCard.viewDetail')} <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
