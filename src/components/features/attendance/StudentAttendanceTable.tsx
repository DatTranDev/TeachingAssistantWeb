'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Download, Loader2, Search, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { subjectsApi } from '@/lib/api/subjects';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { queryKeys } from '@/lib/api/queryKeys';
import type { User, AttendRecord } from '@/types/domain';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';

interface StudentAttendanceSummary {
  user: User;
  cm: number;
  kp: number;
  cp: number;
}

type SortBy = 'name' | 'absent';

interface StudentAttendanceTableProps {
  students: User[];
  subjectId: string;
  maxAbsences: number;
  subjectCode: string;
  subjectName: string;
}

export function StudentAttendanceTable({
  students,
  subjectId,
  maxAbsences,
  subjectCode,
  subjectName,
}: StudentAttendanceTableProps) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [exporting, setExporting] = useState(false);

  // Fetch attendance records for all students in parallel
  const attendanceQueries = useQueries({
    queries: students.map((student) => ({
      queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, student._id),
      queryFn: () => attendRecordsApi.getByUserAndSubject(subjectId, student._id),
      staleTime: 60_000,
    })),
  });

  const isLoading = attendanceQueries.some((q) => q.isLoading);

  const summaries: StudentAttendanceSummary[] = useMemo(() => {
    return students.map((user, idx) => {
      const records: AttendRecord[] = attendanceQueries[idx]?.data ?? [];
      const cm = records.filter((r) => r.status === 'CM').length;
      const kp = records.filter((r) => r.status === 'KP').length;
      const cp = records.filter((r) => r.status === 'CP').length;
      return { user, cm, kp, cp };
    });
  }, [students, attendanceQueries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = summaries.filter(
      (s) => s.user.name.toLowerCase().includes(q) || s.user.userCode.toLowerCase().includes(q)
    );
    if (sortBy === 'name') {
      list.sort((a, b) => a.user.name.localeCompare(b.user.name));
    } else {
      list.sort((a, b) => b.kp - a.kp);
    }
    return list;
  }, [summaries, search, sortBy]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await subjectsApi.exportStudentList(subjectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subjectCode}_${subjectName}_DiemDanh.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('attendance.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('attendance.searchPlaceholder')}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="name">{t('attendance.sortName')}</option>
            <option value="absent">{t('attendance.sortAbsent')}</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t('attendance.exportBtn')}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('attendance.studentsCount', { count: filtered.length })}
      </p>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-slate-800 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('attendance.studentNameCol')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('attendance.studentCodeCol')}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">CM</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">KP</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">CP</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row, idx) => {
                  const warned = row.kp >= maxAbsences;
                  return (
                    <tr
                      key={row.user._id}
                      className={cn(
                        'hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors',
                        warned && 'bg-red-50/40'
                      )}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={row.user.avatar} alt={row.user.name} />
                            <AvatarFallback>{row.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{row.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.user.userCode}</td>
                      <td className="px-4 py-3 text-center text-green-700 font-medium">{row.cm}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-medium">{row.kp}</td>
                      <td className="px-4 py-3 text-center text-yellow-700 font-medium">
                        {row.cp}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {warned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <TriangleAlert className="h-3 w-3" />
                            {t('attendance.absenceWarningLabel')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-2">
            {filtered.map((row) => {
              const warned = row.kp >= maxAbsences;
              return (
                <div
                  key={row.user._id}
                  className={cn(
                    'rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-2',
                    warned && 'border-red-200 bg-red-50/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={row.user.avatar} alt={row.user.name} />
                        <AvatarFallback>{row.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{row.user.name}</p>
                        <p className="text-xs text-muted-foreground">{row.user.userCode}</p>
                      </div>
                    </div>
                    {warned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <TriangleAlert className="h-3 w-3" />
                        {t('attendance.warningLabel')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">CM: </span>
                      <span className="font-medium text-green-700">{row.cm}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">KP: </span>
                      <span className="font-medium text-red-600">{row.kp}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">CP: </span>
                      <span className="font-medium text-yellow-700">{row.cp}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">
              {t('attendance.notFoundMsg')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
