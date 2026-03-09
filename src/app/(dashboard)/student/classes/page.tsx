'use client';

import { useState, useMemo } from 'react';
import { LogIn, BookOpen, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/api/queryKeys';
import { subjectsApi } from '@/lib/api/subjects';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import type { Subject } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SubjectCardSkeleton } from '@/components/features/subjects/SubjectCardSkeleton';
import { StudentSubjectCard } from '@/components/features/subjects/StudentSubjectCard';
import { JoinSubjectModal } from '@/components/features/subjects/JoinSubjectModal';

export default function StudentClassesPage() {
  const { user } = useAuth();
  const { t } = useT();
  const queryClient = useQueryClient();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<Subject | null>(null);
  const [search, setSearch] = useState('');

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: queryKeys.subjects.byUser(user?._id ?? ''),
    queryFn: () => subjectsApi.getByUserId(user!._id),
    enabled: !!user?._id,
  });

  const leaveMutation = useMutation({
    mutationFn: (subjectId: string) => subjectsApi.leave({ studentId: user!._id, subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.byUser(user!._id) });
      toast.success(t('student.classes.leave'));
      setLeaveTarget(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('auth.errors.generic'));
    },
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
      <div className="flex items-center justify-end">
        <Button onClick={() => setJoinModalOpen(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          {t('student.classes.join')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('student.classes.searchPlaceholder')}
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

      {/* Empty state */}
      {!isLoading && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed dark:border-slate-700 bg-white dark:bg-slate-900/50 py-16 gap-4 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="text-lg font-medium text-neutral-900 dark:text-slate-100">
              {t('student.classes.empty')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('student.classes.emptyDesc')}</p>
          </div>
          <Button onClick={() => setJoinModalOpen(true)}>
            <LogIn className="mr-2 h-4 w-4" />
            {t('student.classes.join')}
          </Button>
        </div>
      )}

      {/* No search results */}
      {!isLoading && subjects.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('common.noData')} &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Subject grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((subject) => (
            <StudentSubjectCard key={subject._id} subject={subject} onLeave={setLeaveTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      <JoinSubjectModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />

      <ConfirmDialog
        open={!!leaveTarget}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
        title={t('student.classes.confirmLeaveTitle')}
        description={t('student.classes.confirmLeaveDesc', { name: leaveTarget?.name ?? '' })}
        confirmLabel={t('student.classes.leave')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={leaveMutation.isPending}
        onConfirm={() => {
          if (leaveTarget) leaveMutation.mutate(leaveTarget._id);
        }}
      />
    </div>
  );
}
