'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, ChevronRight } from 'lucide-react';
import type { Subject } from '@/types/domain';
import { Button } from '@/components/ui/button';
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
  const teacherName =
    typeof subject.hostId !== 'string' ? (subject.hostId as { name: string }).name : '';

  return (
    <div className="flex flex-col rounded-xl border bg-white p-5 gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug line-clamp-2 flex-1">{subject.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Tùy chọn</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/student/classes/${subject._id}`}>Xem chi tiết</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onLeave(subject)}
            >
              Rời lớp học
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground uppercase">{subject.code}</span>
        </p>
        {teacherName && <p>Giảng viên: {teacherName}</p>}
      </div>

      <div className="border-t" />

      {/* Detail link */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/student/classes/${subject._id}`}>
            Xem chi tiết <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
