'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, Star, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { queryKeys } from '@/lib/api/queryKeys';
import { cAttendApi } from '@/lib/api/cAttend';
import { subjectsApi } from '@/lib/api/subjects';
import { useSubject } from '@/contexts/SubjectContext';
import { useT } from '@/hooks/use-t';
import { getCAttendStatus } from '@/components/features/sessions/SessionStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CAttend } from '@/types/domain';
import type { TopAbsentStudent } from '@/lib/api/subjects';

interface SubjectAvgReview {
  avgTeachingMethod: number;
  avgAtmosphere: number;
  avgDocument: number;
  avgUnderstand: number;
  avgUseful: number;
  thinkings: string[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 flex items-center gap-4">
      <div className={`rounded-full p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

export default function TeacherStatisticsPage() {
  const { subjectId } = useSubject();
  const { t } = useT();

  const { data: cAttends = [], isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 60_000,
  });

  const { data: topAbsentees = [], isLoading: loadingAbsent } = useQuery({
    queryKey: ['subjects', subjectId, 'topAbsentees'],
    queryFn: () => subjectsApi.getTopAbsentees(subjectId),
    staleTime: 60_000,
  });

  const { data: avgReview, isLoading: loadingReview } = useQuery({
    queryKey: ['subjectAvgReview', subjectId],
    queryFn: () => subjectsApi.getAvgReview(subjectId) as Promise<SubjectAvgReview>,
    staleTime: 60_000,
  });

  const { data: subject } = useQuery({
    queryKey: queryKeys.subjects.byId(subjectId),
    queryFn: () => subjectsApi.getById(subjectId),
    staleTime: 60_000,
  });
  const absenceLimit = subject?.subject?.maxAbsences ?? 3;

  const pastSessions = useMemo(
    () => cAttends.filter((s) => getCAttendStatus(s) === 'ended'),
    [cAttends]
  );

  // Attendance rate per session chart data
  const attendanceChartData = useMemo(
    () =>
      pastSessions.map((s: CAttend, i: number) => ({
        name: t('statistics.sessionPrefix', { n: String(i + 1) }),
        rate: s.acceptedNumber > 0 ? Math.round((s.numberOfAttend / s.acceptedNumber) * 100) : 0,
      })),
    [pastSessions, t]
  );

  // Overall attendance rate
  const overallAttendanceRate = useMemo(() => {
    if (pastSessions.length === 0) return 0;
    const total = pastSessions.reduce(
      (s: number, c: CAttend) =>
        s + (c.acceptedNumber > 0 ? (c.numberOfAttend / c.acceptedNumber) * 100 : 0),
      0
    );
    return Math.round(total / pastSessions.length);
  }, [pastSessions]);

  // At-risk students: those with absences >= absenceLimit
  const atRiskStudents = useMemo(
    () => (topAbsentees as TopAbsentStudent[]).filter((s) => s.totalAbsences >= absenceLimit),
    [topAbsentees, absenceLimit]
  );

  // Rating score (average of 3 category averages)
  const overallRating = avgReview
    ? ((avgReview.avgTeachingMethod + avgReview.avgAtmosphere + avgReview.avgDocument) / 3).toFixed(
        1
      )
    : '—';

  // Review category bar chart data
  const reviewBarData = avgReview
    ? [
        {
          name: t('statistics.reviewCategories.teachingMethod'),
          score: +avgReview.avgTeachingMethod.toFixed(1),
        },
        {
          name: t('statistics.reviewCategories.atmosphere'),
          score: +avgReview.avgAtmosphere.toFixed(1),
        },
        {
          name: t('statistics.reviewCategories.document'),
          score: +avgReview.avgDocument.toFixed(1),
        },
        {
          name: t('statistics.reviewCategories.understanding'),
          score: +avgReview.avgUnderstand.toFixed(0),
        },
        {
          name: t('statistics.reviewCategories.usefulness'),
          score: +avgReview.avgUseful.toFixed(0),
        },
      ]
    : [];

  const isLoading = loadingSessions || loadingAbsent;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t('statistics.overallAttendance')}
            value={`${overallAttendanceRate}%`}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            label={t('statistics.avgRating')}
            value={`⭐ ${overallRating}`}
            icon={Star}
            color="bg-yellow-500"
          />
          <StatCard
            label={t('statistics.atRisk')}
            value={atRiskStudents.length}
            icon={AlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            label={t('statistics.totalSessions')}
            value={cAttends.length}
            icon={BookOpen}
            color="bg-green-500"
          />
        </div>
      )}

      {/* Attendance Rate Chart */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
        <h3 className="text-sm font-semibold mb-4">{t('statistics.attendanceChartTitle')}</h3>
        {loadingSessions ? (
          <ChartSkeleton />
        ) : attendanceChartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('statistics.noSessionsEnded')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={attendanceChartData}
              margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, t('statistics.attendanceRateTooltip')]} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563EB' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Review Category Chart */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
        <h3 className="text-sm font-semibold mb-4">{t('statistics.reviewChartTitle')}</h3>
        {loadingReview ? (
          <ChartSkeleton />
        ) : !avgReview || reviewBarData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('statistics.noReviews')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reviewBarData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* At-risk Students */}
      {atRiskStudents.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold mb-3">
            {t('statistics.atRiskTitle', { count: String(atRiskStudents.length) })}
          </h3>
          <div className="space-y-2">
            {atRiskStudents.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between text-sm py-1 border-b last:border-0"
              >
                <span>{s.user.name}</span>
                <span className="text-red-600 font-medium">
                  {t('statistics.atRiskAbsences', {
                    absences: String(s.totalAbsences),
                    limit: String(absenceLimit),
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
