'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Subject } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';

interface SubjectHeaderProps {
  subject: Subject | null;
  isLoading: boolean;
  role: 'teacher' | 'student';
  backHref: string;
}

export function SubjectHeader({ subject, isLoading, role, backHref }: SubjectHeaderProps) {
  const { t } = useT();
  if (isLoading) {
    return (
      <div className="space-y-2 pb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!subject) return null;

  const teacherName =
    typeof subject.hostId !== 'string' ? (subject.hostId as { name: string }).name : '';

  return (
    <div className="pb-4">
      <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground" asChild>
        <Link href={backHref}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('subjects.header.back')}
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">{subject.name}</h1>

      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
        <span>
          {t('subjects.header.subjectCodeLabel')}
          <span className="font-medium text-foreground uppercase">{subject.code}</span>
        </span>
        {role === 'student' && teacherName && (
          <span>
            {t('subjects.header.teacherLabel')}
            {teacherName}
          </span>
        )}
        {role === 'teacher' && (
          <span>
            {t('subjects.header.joinCodeLabel')}
            <span className="font-mono font-semibold">{subject.joinCode}</span>
          </span>
        )}
        <span>{t('subjects.header.maxAbsencesLabel', { count: String(subject.maxAbsences) })}</span>
      </div>
    </div>
  );
}
