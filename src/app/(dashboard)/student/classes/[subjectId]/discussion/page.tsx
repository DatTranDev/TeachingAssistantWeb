'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, BookOpenText, Users, CalendarDays } from 'lucide-react';
import { cAttendApi } from '@/lib/api/cAttend';
import { groupsApi } from '@/lib/api/groups';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useT } from '@/hooks/use-t';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { CAttend, Group } from '@/types/domain';

function getCAttendId(cAttendId: Group['cAttendId']): string {
  if (!cAttendId) return '';
  if (typeof cAttendId === 'string') return cAttendId;
  return cAttendId._id;
}

function formatSessionDate(input: string, localeTag: string): string {
  return new Date(input).toLocaleDateString(localeTag);
}

export default function StudentDiscussionHubPage() {
  const { subjectId } = useSubject();
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';

  const { data: cAttends = [], isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const { data: defaultGroup, isLoading: loadingDefaultGroup } = useQuery({
    queryKey: queryKeys.groups.myDefault(subjectId),
    queryFn: () => groupsApi.getMyDefaultGroup(subjectId),
    staleTime: 60_000,
  });

  const { data: randomGroups = [], isLoading: loadingRandomGroups } = useQuery({
    queryKey: queryKeys.groups.myRandom(subjectId),
    queryFn: () => groupsApi.getMyRandomGroups(subjectId),
    staleTime: 60_000,
  });

  const cAttendMap = useMemo(() => {
    const map = new Map<string, CAttend>();
    for (const cAttend of cAttends) {
      map.set(cAttend._id, cAttend);
    }
    return map;
  }, [cAttends]);

  const sortedSessions = useMemo(
    () => [...cAttends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [cAttends]
  );

  const sortedRandomGroups = useMemo(
    () =>
      [...randomGroups].sort((a, b) => {
        const aDate = cAttendMap.get(getCAttendId(a.cAttendId))?.date;
        const bDate = cAttendMap.get(getCAttendId(b.cAttendId))?.date;
        return new Date(bDate ?? 0).getTime() - new Date(aDate ?? 0).getTime();
      }),
    [randomGroups, cAttendMap]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('discussionHub.generalLabel')}
              </p>
              <h3 className="text-base font-semibold mt-1">{t('discussionHub.generalTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('discussionHub.generalDesc')}</p>
            </div>
            <BookOpenText className="h-5 w-5 text-primary shrink-0" />
          </div>
          <div className="mt-4">
            <Link href={`/student/classes/${subjectId}/discussion/general`}>
              <Button size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('discussionHub.enterGeneral')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('discussionHub.groupLabel')}
              </p>
              <h3 className="text-base font-semibold mt-1">{t('discussionHub.fixedGroupTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('discussionHub.fixedGroupDesc')}
              </p>
            </div>
            <Users className="h-5 w-5 text-primary shrink-0" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/student/classes/${subjectId}/groups`}>
              <Button size="sm" variant="outline">
                {t('discussionHub.viewGroups')}
              </Button>
            </Link>
            {defaultGroup && (
              <Link href={`/student/classes/${subjectId}/groups/${defaultGroup._id}/chat`}>
                <Button size="sm">{t('discussionHub.myGroup')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">{t('discussionHub.sessionQATitle')}</h2>
        </div>

        {loadingSessions ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 p-6 text-sm text-muted-foreground">
            {t('discussionHub.noSessionsForSubject')}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSessions.map((session) => (
              <div
                key={session._id}
                className="rounded-xl border bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">
                    {t('discussionHub.sessionN', { n: String(session.sessionNumber) })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSessionDate(session.date, localeTag)}
                  </p>
                </div>
                <Link href={`/student/classes/${subjectId}/discussion/sessions/${session._id}`}>
                  <Button size="sm">{t('discussionHub.enterDiscussion')}</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('discussionHub.sessionGroupsTitle')}</h2>
        {loadingRandomGroups || loadingDefaultGroup ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedRandomGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800/50 p-6 text-sm text-muted-foreground">
            {t('discussionHub.noRandomGroups')}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedRandomGroups.map((group) => {
              const cAttend = cAttendMap.get(getCAttendId(group.cAttendId));
              return (
                <div
                  key={group._id}
                  className="rounded-xl border bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cAttend
                        ? t('discussionHub.sessionRef', {
                            n: String(cAttend.sessionNumber),
                            date: formatSessionDate(cAttend.date, localeTag),
                          })
                        : t('discussionHub.noLinkedSession')}
                    </p>
                  </div>
                  <Link href={`/student/classes/${subjectId}/groups/${group._id}/chat`}>
                    <Button size="sm" variant="outline">
                      {t('discussionHub.enterGroup')}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
