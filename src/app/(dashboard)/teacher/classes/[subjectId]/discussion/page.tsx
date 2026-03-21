'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenText, CalendarDays, MessageSquare } from 'lucide-react';
import { cAttendApi } from '@/lib/api/cAttend';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useT } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(input: string, localeTag: string): string {
  return new Date(input).toLocaleDateString(localeTag);
}

export default function TeacherDiscussionHubPage() {
  const { subjectId } = useSubject();
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';

  const { data: cAttends = [], isLoading } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const sorted = useMemo(
    () => [...cAttends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [cAttends]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('discussionHub.generalLabel')}
            </p>
            <h2 className="text-lg font-semibold mt-1">{t('discussionHub.generalTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('discussionHub.generalDesc')}</p>
          </div>
          <BookOpenText className="h-5 w-5 text-primary shrink-0" />
        </div>
        <div className="mt-4">
          <Link href={`/teacher/classes/${subjectId}/discussion/general`}>
            <Button size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('discussionHub.enterGeneral')}
            </Button>
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t('discussionHub.sessionQATitle')}</h2>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 p-6 text-sm text-muted-foreground">
            {t('discussionHub.noSessionsForSubject')}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((session) => (
              <div
                key={session._id}
                className="rounded-xl border bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">
                    {t('discussionHub.sessionN', { n: String(session.sessionNumber) })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(session.date, localeTag)}
                  </p>
                </div>
                <Link href={`/teacher/classes/${subjectId}/discussion/sessions/${session._id}`}>
                  <Button size="sm" variant="outline">
                    {t('discussionHub.enterDiscussion')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
