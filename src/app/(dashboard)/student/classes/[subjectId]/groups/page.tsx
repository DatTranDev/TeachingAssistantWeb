'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { groupsApi } from '@/lib/api/groups';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Group, User } from '@/types/domain';

function getUser(u: string | User): User | null {
  return typeof u === 'object' ? u : null;
}

function UserAvatar({ user, highlight }: { user: User; highlight?: boolean }) {
  const initials = user.name?.split(' ').pop()?.charAt(0).toUpperCase() ?? '?';
  return (
    <Avatar className={`h-8 w-8 ${highlight ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}

export default function StudentGroupsPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const userId = user?._id ?? '';

  const { data: myGroup, isLoading: myGroupLoading } = useQuery({
    queryKey: queryKeys.groups.myDefault(subjectId),
    queryFn: () => groupsApi.getMyDefaultGroup(subjectId),
    staleTime: 60_000,
  });

  const { data: allGroups = [], isLoading: allLoading } = useQuery({
    queryKey: queryKeys.groups.defaultBySubject(subjectId),
    queryFn: () => groupsApi.getDefaultBySubject(subjectId),
    staleTime: 60_000,
  });

  if (myGroupLoading || allLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My group */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Nhóm của bạn</h3>
        {myGroup ? (
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{myGroup.name}</span>
              <Link href={`/student/classes/${subjectId}/groups/${myGroup._id}/chat`}>
                <Button size="sm" className="gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  Vào nhóm chat
                </Button>
              </Link>
            </div>
            <div className="divide-y text-sm">
              {(myGroup.members.map(getUser).filter(Boolean) as User[]).map((m) => (
                <div key={m._id} className="flex items-center gap-2 py-2">
                  <UserAvatar user={m} highlight={m._id === userId} />
                  <span className="flex-1">{m.name}</span>
                  {m._id === userId && (
                    <span className="text-xs text-primary font-medium">Bạn</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{myGroup.members.length} thành viên</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 py-8 gap-2 text-center">
            <Users className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Bạn chưa được xếp vào nhóm nào</p>
          </div>
        )}
      </div>

      {/* All groups */}
      {allGroups.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Tất cả nhóm ({allGroups.length})
          </h3>
          <div className="space-y-2">
            {allGroups.map((g) => {
              const members = g.members.map(getUser).filter(Boolean) as User[];
              const isMyGroup = myGroup?._id === g._id;
              return (
                <div
                  key={g._id}
                  className={`rounded-xl border bg-white p-3 space-y-2 ${isMyGroup ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isMyGroup ? 'text-primary' : ''}`}>
                      {g.name}
                      {isMyGroup && <span className="ml-2 text-xs">— nhóm của bạn</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {members.length} thành viên
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {members.map((m) => (
                      <div key={m._id} className="flex items-center gap-1 text-xs">
                        <UserAvatar user={m} highlight={m._id === userId} />
                        <span>{m.name?.split(' ').pop()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
