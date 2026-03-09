'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

interface Tab {
  label: string;
  href: string;
}

interface SubjectTabsProps {
  subjectId: string;
  role: 'teacher' | 'student';
}

export function SubjectTabs({ subjectId, role }: SubjectTabsProps) {
  const pathname = usePathname();
  const { t } = useT();

  const TEACHER_TABS: Tab[] = [
    { label: t('subjectTabs.sessions'), href: `/teacher/classes/${subjectId}/sessions` },
    { label: t('subjectTabs.attendance'), href: `/teacher/classes/${subjectId}/attendance` },
    { label: t('subjectTabs.discussion'), href: `/teacher/classes/${subjectId}/discussion` },
    { label: t('subjectTabs.channel'), href: `/teacher/classes/${subjectId}/channel` },
    { label: t('subjectTabs.documents'), href: `/teacher/classes/${subjectId}/documents` },
    { label: t('subjectTabs.groups'), href: `/teacher/classes/${subjectId}/groups` },
    { label: t('subjectTabs.statistics'), href: `/teacher/classes/${subjectId}/statistics` },
    { label: t('subjectTabs.settings'), href: `/teacher/classes/${subjectId}/settings` },
  ];
  const STUDENT_TABS: Tab[] = [
    { label: t('subjectTabs.sessions'), href: `/student/classes/${subjectId}/sessions` },
    { label: t('subjectTabs.attendance'), href: `/student/classes/${subjectId}/attendance` },
    { label: t('subjectTabs.discussion'), href: `/student/classes/${subjectId}/discussion` },
    { label: t('subjectTabs.channel'), href: `/student/classes/${subjectId}/channel` },
    { label: t('subjectTabs.documents'), href: `/student/classes/${subjectId}/documents` },
    { label: t('subjectTabs.groups'), href: `/student/classes/${subjectId}/groups` },
    { label: t('subjectTabs.statistics'), href: `/student/classes/${subjectId}/statistics` },
  ];
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS;

  return (
    <div className="border-b bg-white dark:bg-slate-900 shrink-0">
      <nav className="flex overflow-x-auto scrollbar-none -mb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neutral-300'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
