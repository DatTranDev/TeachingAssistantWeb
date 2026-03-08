'use client';

import { useState, useMemo } from 'react';
import { Plus, BookOpen, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubjectCard } from '@/components/features/subjects/SubjectCard';
import { SubjectCardSkeleton } from '@/components/features/subjects/SubjectCardSkeleton';
import { CreateSubjectModal } from '@/components/features/subjects/CreateSubjectModal';
import { useT } from '@/hooks/use-t';

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { t } = useT();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: queryKeys.subjects.byUser(user?._id ?? ''),
    queryFn: () => subjectsApi.getByUserId(user!._id),
    enabled: !!user?._id,
  });

  const filtered = useMemo(
    () =>
      subjects.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())
      ),
    [subjects, search]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('teacher.classes.title')}</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('teacher.classes.create')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('teacher.classes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state — no subjects at all */}
      {!isLoading && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white dark:bg-slate-900 py-16 gap-4 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="text-lg font-medium">{t('teacher.classes.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('teacher.classes.emptyDesc')}</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('teacher.classes.create')}
          </Button>
        </div>
      )}

      {/* No search results */}
      {!isLoading && subjects.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('teacher.classes.noResults', { query: search })}
        </p>
      )}

      {/* Subject grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((subject) => (
            <SubjectCard key={subject._id} subject={subject} />
          ))}
        </div>
      )}

      <CreateSubjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
