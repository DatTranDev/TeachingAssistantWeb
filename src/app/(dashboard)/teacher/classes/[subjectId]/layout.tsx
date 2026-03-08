'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { SubjectContext } from '@/contexts/SubjectContext';
import { SubjectHeader } from '@/components/features/subjects/SubjectHeader';
import { SubjectTabs } from '@/components/features/subjects/SubjectTabs';

export default function TeacherSubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.subjects.byId(subjectId),
    queryFn: () => subjectsApi.getById(subjectId),
    staleTime: 60_000,
  });

  return (
    <SubjectContext.Provider
      value={{
        subjectId,
        subject: data?.subject ?? null,
        classSessions: data?.classSessions ?? [],
        isLoading,
      }}
    >
      <div className="flex flex-col min-h-full">
        <div className="px-4 pt-4 lg:px-6 lg:pt-6">
          <SubjectHeader
            subject={data?.subject ?? null}
            isLoading={isLoading}
            role="teacher"
            backHref="/teacher/classes"
          />
        </div>

        <SubjectTabs subjectId={subjectId} role="teacher" />

        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </div>
    </SubjectContext.Provider>
  );
}
