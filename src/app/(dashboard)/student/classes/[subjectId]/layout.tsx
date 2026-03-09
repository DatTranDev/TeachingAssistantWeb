'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { SubjectContext } from '@/contexts/SubjectContext';
import { SubjectHeader } from '@/components/features/subjects/SubjectHeader';
import { SubjectTabs } from '@/components/features/subjects/SubjectTabs';

export default function StudentSubjectLayout({
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
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-4 pt-2 lg:px-6 lg:pt-3">
          <SubjectHeader
            subject={data?.subject ?? null}
            isLoading={isLoading}
            role="student"
            backHref="/student/classes"
          />
        </div>

        <SubjectTabs subjectId={subjectId} role="student" />

        <div className="flex-1 overflow-y-auto min-h-0 p-4 lg:p-6">{children}</div>
      </div>
    </SubjectContext.Provider>
  );
}
