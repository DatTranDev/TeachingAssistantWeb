import { use } from 'react';
import { redirect } from 'next/navigation';

export default function StudentSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  redirect(`/student/classes/${subjectId}/sessions`);
}
