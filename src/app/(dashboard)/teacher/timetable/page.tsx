'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { WeekCalendar } from '@/components/features/timetable/WeekCalendar';
import { useT } from '@/hooks/use-t';

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { t } = useT();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: queryKeys.subjects.byUser(user?._id ?? ''),
    queryFn: () => subjectsApi.getByUserId(user!._id),
    enabled: !!user?._id,
  });

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('teacher.timetable.title')}</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('teacher.timetable.classesCount', { count: subjects.length })}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/teacher/classes/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('teacher.timetable.create')}
          </Link>
        </Button>
      </div>

      {/* Weekly calendar */}
      <WeekCalendar role="teacher" />
    </div>
  );
}
