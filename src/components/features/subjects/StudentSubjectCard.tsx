'use client';

import Link from 'next/link';
import { MoreVertical, ChevronRight } from 'lucide-react';
import type { Subject } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StudentSubjectCardProps {
  subject: Subject;
  onLeave: (subject: Subject) => void;
}

export function StudentSubjectCard({ subject, onLeave }: StudentSubjectCardProps) {
  const { t } = useT();
  const teacherName =
    typeof subject.hostId !== 'string' ? (subject.hostId as { name: string }).name : '';

  return (
    <div className="flex flex-col rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-5 gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug line-clamp-2 flex-1">{subject.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('user.userOptions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/student/classes/${subject._id}`}>{t('subjects.card.viewDetail')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onLeave(subject)}
            >
              {t('student.classes.leave')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground uppercase">{subject.code}</span>
        </p>
        {teacherName && (
          <p>
            {t('subjects.header.teacherLabel')}
            {teacherName}
          </p>
        )}
      </div>

      <div className="border-t dark:border-slate-700" />

      {/* Detail link */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/student/classes/${subject._id}`}>
            {t('subjects.card.viewDetail')} <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
