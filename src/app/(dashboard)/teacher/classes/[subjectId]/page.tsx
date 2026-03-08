import { use } from 'react';
import { redirect } from 'next/navigation';

export default function TeacherSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  redirect(`/teacher/classes/${subjectId}/sessions`);
}
