'use client';

import { createContext, useContext } from 'react';
import type { Subject, ClassSession } from '@/types/domain';

export interface SubjectContextValue {
  subjectId: string;
  subject: Subject | null;
  classSessions: ClassSession[];
  isLoading: boolean;
}

export const SubjectContext = createContext<SubjectContextValue | null>(null);

export function useSubject() {
  const ctx = useContext(SubjectContext);
  if (!ctx) throw new Error('useSubject must be used within SubjectProvider');
  return ctx;
}
