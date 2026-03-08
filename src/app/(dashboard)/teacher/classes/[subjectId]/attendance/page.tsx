'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { subjectsApi } from '@/lib/api/subjects';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentAttendanceTable } from '@/components/features/attendance/StudentAttendanceTable';
import { AbsenceRequestReviewList } from '@/components/features/absence/AbsenceRequestReviewList';

export default function TeacherAttendancePage() {
  const { subjectId, subject, isLoading: subjectLoading } = useSubject();

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: queryKeys.subjects.students(subjectId),
    queryFn: () => subjectsApi.getStudents(subjectId),
    staleTime: 60_000,
  });

  const isLoading = subjectLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white dark:bg-slate-900 py-12 gap-4 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">Chưa có sinh viên nào</p>
          <p className="text-sm text-muted-foreground">Sinh viên tham gia lớp sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <StudentAttendanceTable
          students={students}
          subjectId={subjectId}
          maxAbsences={subject?.maxAbsences ?? 3}
          subjectCode={subject?.code ?? ''}
          subjectName={subject?.name ?? ''}
        />
      )}

      <AbsenceRequestReviewList subjectId={subjectId} />
    </div>
  );
}
