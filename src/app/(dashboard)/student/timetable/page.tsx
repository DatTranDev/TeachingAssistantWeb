'use client';

import Link from 'next/link';
import { LogIn, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { TimetableCard } from '@/components/features/timetable/TimetableCard';
import { TimetableCardSkeleton } from '@/components/features/timetable/TimetableCardSkeleton';
import { useT } from '@/hooks/use-t';

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const { t } = useT();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: queryKeys.subjects.byUser(user?._id ?? ''),
    queryFn: () => subjectsApi.getByUserId(user!._id),
    enabled: !!user?._id,
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('student.timetable.title')}</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('student.timetable.classesCount', { count: subjects.length })}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/student/classes">
            <LogIn className="mr-2 h-4 w-4" />
            {t('student.timetable.joinBtn')}
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TimetableCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white dark:bg-slate-900 py-16 gap-4 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="text-lg font-medium">{t('student.timetable.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('student.timetable.emptyDesc')}</p>
          </div>
          <Button asChild>
            <Link href="/student/classes">
              <LogIn className="mr-2 h-4 w-4" />
              {t('student.timetable.joinBtn')}
            </Link>
          </Button>
        </div>
      )}

      {/* Subject grid */}
      {!isLoading && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <TimetableCard key={subject._id} subject={subject} role="student" />
          ))}
        </div>
      )}
    </div>
  );
}
