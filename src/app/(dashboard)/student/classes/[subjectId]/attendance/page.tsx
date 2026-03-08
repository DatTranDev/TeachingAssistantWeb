'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, Loader2, MapPin, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cAttendApi } from '@/lib/api/cAttend';
import { attendRecordsApi } from '@/lib/api/attendRecords';
import { absenceRequestsApi } from '@/lib/api/absenceRequests';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useSubjectRoom } from '@/hooks/use-room';
import { useSocketEvent } from '@/hooks/use-socket-event';
import type { CAttend, AttendRecord, AbsenceRequest } from '@/types/domain';
import type { AttendanceMessage } from '@/types/socket';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  SessionStatusBadge,
  getCAttendStatus,
} from '@/components/features/sessions/SessionStatusBadge';
import { AbsenceRequestModal } from '@/components/features/absence/AbsenceRequestModal';
import { cn } from '@/lib/utils';

type CheckInState = 'idle' | 'locating' | 'submitting' | 'done';

const DAY_NAMES = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = DAY_NAMES[d.getDay() === 0 ? 7 : d.getDay()] ?? '';
  return `${day}, ${d.toLocaleDateString('vi-VN')}`;
}
function isSameDay(d1: string, d2: string) {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}

const ATTEND_STATUS_CONFIG = {
  CM: { label: 'Có mặt', className: 'bg-green-100 text-green-700' },
  KP: { label: 'Vắng', className: 'bg-red-100 text-red-700' },
  CP: { label: 'Có phép', className: 'bg-yellow-100 text-yellow-700' },
} as const;

const REQUEST_STATUS_CONFIG = {
  pending: { label: 'Đang chờ', className: 'bg-neutral-100 text-neutral-600' },
  approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
} as const;

export default function StudentAttendancePage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [locationDenied, setLocationDenied] = useState(false);
  const [activeCAttend, setActiveCAttend] = useState<CAttend | null>(null);
  const [absenceTarget, setAbsenceTarget] = useState<CAttend | null>(null);

  useSubjectRoom(user?._id, subjectId);

  const { data: cAttends = [], isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 30_000,
  });

  const { data: myRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, user?._id ?? ''),
    queryFn: () => attendRecordsApi.getByUserAndSubject(subjectId, user!._id),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  const { data: myRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: queryKeys.absenceRequests.byStudent(subjectId),
    queryFn: () => absenceRequestsApi.getByStudent(subjectId),
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  // Find active cAttend
  useEffect(() => {
    const active = cAttends.find((c) => c.isActive && !c.isClosed) ?? null;
    setActiveCAttend(active);
  }, [cAttends]);

  const myActiveRecord = activeCAttend
    ? myRecords.find((r: AttendRecord) => {
        const id = typeof r.cAttendId === 'string' ? r.cAttendId : (r.cAttendId as CAttend)._id;
        return id === activeCAttend._id;
      })
    : null;

  const handleReceiveAttendance = useCallback(
    (_data: AttendanceMessage) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cAttend.bySubject(subjectId) });
    },
    [queryClient, subjectId]
  );
  useSocketEvent('receiveAttendance', handleReceiveAttendance);

  const checkInMutation = useMutation({
    mutationFn: (position: GeolocationPosition) =>
      attendRecordsApi.checkIn({
        cAttendId: activeCAttend!._id,
        studentId: user!._id,
        studentLatitude: position.coords.latitude,
        studentLongitude: position.coords.longitude,
        index: 0,
      }),
    onSuccess: () => {
      toast.success('Điểm danh thành công!');
      setCheckInState('done');
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendRecords.byUserAndSubject(subjectId, user!._id),
      });
    },
    onError: (error: { message?: string; statusCode?: number }) => {
      const msg = error.message ?? '';
      if (msg.includes('expired') || error.statusCode === 403) {
        toast.error('Vòng điểm danh đã kết thúc');
      } else if (error.statusCode === 409) {
        toast.info('Bạn đã điểm danh cho vòng này');
      } else {
        toast.error(msg || 'Bạn đang ở ngoài khu vực điểm danh');
      }
      setCheckInState('idle');
    },
  });

  const handleCheckIn = () => {
    if (!activeCAttend || !user) return;
    setLocationDenied(false);
    setCheckInState('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCheckInState('submitting');
        checkInMutation.mutate(position);
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setLocationDenied(true);
        } else {
          toast.error('Không thể lấy vị trí. Thử lại sau.');
        }
        setCheckInState('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isLoading = loadingSessions || loadingRecords || loadingRequests;

  const sortedHistory = useMemo(
    () => [...cAttends].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [cAttends]
  );

  const getMyStatus = (cAttend: CAttend) => {
    const record = myRecords.find((r: AttendRecord) => {
      const id = typeof r.cAttendId === 'string' ? r.cAttendId : (r.cAttendId as CAttend)._id;
      return id === cAttend._id;
    });
    return record?.status ?? null;
  };

  const getRequestForSession = (cAttend: CAttend): AbsenceRequest | undefined =>
    myRequests.find((req) => isSameDay(req.date, cAttend.date));

  return (
    <div className="space-y-6">
      {/* Active round card */}
      {isLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : activeCAttend ? (
        myActiveRecord?.status === 'CM' || checkInState === 'done' ? (
          <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700">Đã điểm danh thành công</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Buổi #{activeCAttend.sessionNumber} — {formatDate(activeCAttend.date)}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-green-400 bg-green-50/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-green-800">Điểm danh đang mở</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Buổi #{activeCAttend.sessionNumber} — {formatDate(activeCAttend.date)}
            </p>
            {locationDenied && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Trình duyệt bị chặn truy cập vị trí. Vào cài đặt trình duyệt để cho phép.
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckIn}
              disabled={checkInState !== 'idle'}
            >
              {checkInState === 'locating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lấy vị trí...
                </>
              ) : checkInState === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Điểm danh ngay
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Vị trí của bạn sẽ được sử dụng để xác nhận có mặt tại lớp.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center space-y-2">
          <PauseCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Không có điểm danh đang mở</p>
          <p className="text-sm text-muted-foreground">Chờ giảng viên mở vòng điểm danh.</p>
        </div>
      )}

      {/* Attendance history */}
      {!isLoading && cAttends.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Lịch sử điểm danh</h3>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Buổi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedHistory.map((ca, idx) => {
                  const myStatus = getMyStatus(ca);
                  const sessionStatus = getCAttendStatus(ca);
                  const config = myStatus ? ATTEND_STATUS_CONFIG[myStatus] : null;
                  const existingRequest = getRequestForSession(ca);
                  const canRequest = myStatus === 'KP' && !existingRequest && ca.isClosed;
                  return (
                    <tr key={ca._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">{formatDate(ca.date)}</td>
                      <td className="px-4 py-3">
                        <SessionStatusBadge status={sessionStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {config ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              config.className
                            )}
                          >
                            {config.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500">
                            Chưa ghi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {existingRequest ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              REQUEST_STATUS_CONFIG[existingRequest.status].className
                            )}
                          >
                            {REQUEST_STATUS_CONFIG[existingRequest.status].label}
                          </span>
                        ) : canRequest ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAbsenceTarget(ca)}
                          >
                            Xin phép
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absence requests list */}
      {!isLoading && myRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Đơn xin phép</h3>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Buổi học
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lý do</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Tài liệu
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {myRequests.map((req) => {
                  const statusConf = REQUEST_STATUS_CONFIG[req.status];
                  const proofUrl = req.proof?.[0];
                  return (
                    <tr key={req._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(req.date)}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{req.reason}</td>
                      <td className="px-4 py-3">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            Xem file <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            statusConf.className
                          )}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absence request modal */}
      {absenceTarget && user && (
        <AbsenceRequestModal
          open={!!absenceTarget}
          onOpenChange={(open) => {
            if (!open) setAbsenceTarget(null);
          }}
          studentId={user._id}
          subjectId={subjectId}
          cAttend={absenceTarget}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.absenceRequests.byStudent(subjectId),
            });
          }}
        />
      )}
    </div>
  );
}
