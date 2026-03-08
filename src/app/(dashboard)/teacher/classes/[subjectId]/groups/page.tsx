'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Shuffle, Pencil, X, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { groupsApi } from '@/lib/api/groups';
import { subjectsApi } from '@/lib/api/subjects';
import { cAttendApi } from '@/lib/api/cAttend';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useT } from '@/hooks/use-t';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Group, User } from '@/types/domain';

function getUser(u: string | User): User | null {
  return typeof u === 'object' ? u : null;
}

function UserAvatar({ user }: { user: User }) {
  const initials = user.name?.split(' ').pop()?.charAt(0).toUpperCase() ?? '?';
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}

// ─── Default group card ───────────────────────────────────────────────────────

function DefaultGroupCard({
  group,
  allStudents,
  subjectId,
}: {
  group: Group;
  allStudents: User[];
  subjectId: string;
}) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(group.name);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedNew, setSelectedNew] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const memberIds = new Set(group.members.map((m) => (typeof m === 'object' ? m._id : m)));
  const inGroupStudents = group.members.map(getUser).filter(Boolean) as User[];
  const filtered = allStudents
    .filter((s) => !memberIds.has(s._id))
    .filter((s) => !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.defaultBySubject(subjectId) });

  const setGroup = (updated: Group) =>
    queryClient.setQueryData(
      queryKeys.groups.defaultBySubject(subjectId),
      (old: Group[] | undefined) => old?.map((g) => (g._id === group._id ? updated : g)) ?? []
    );

  const renameMutation = useMutation({
    mutationFn: (name: string) => groupsApi.update(group._id, { name }),
    onSuccess: (updated) => {
      setGroup(updated);
      setEditingName(false);
      toast.success(t('groups.renameSuccess'));
    },
    onError: () => toast.error(t('groups.renameError')),
  });

  const addMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.addMember(group._id, userId, group.members),
    onSuccess: (updated) => setGroup(updated),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const newIds = group.members
        .map((m) => (typeof m === 'object' ? m._id : m))
        .filter((id) => id !== userId);
      return groupsApi.update(group._id, { members: newIds } as Parameters<
        typeof groupsApi.update
      >[1]);
    },
    onSuccess: (updated) => setGroup(updated),
    onError: () => toast.error(t('groups.removeMemberError')),
  });

  const handleAddMembers = async () => {
    for (const uid of selectedNew) await addMutation.mutateAsync(uid);
    setSelectedNew([]);
    toast.success(t('groups.addMembersSuccess'));
    setAddMemberOpen(false);
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1">
        {editingName ? (
          <>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-7 text-sm font-semibold flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameMutation.mutate(nameInput);
                if (e.key === 'Escape') {
                  setEditingName(false);
                  setNameInput(group.name);
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => renameMutation.mutate(nameInput)}
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                setEditingName(false);
                setNameInput(group.name);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-semibold text-sm flex-1">{group.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setEditingName(true);
                setNameInput(group.name);
              }}
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
          </>
        )}
      </div>

      {/* Member list */}
      <div className="divide-y text-sm">
        {inGroupStudents.map((member) => (
          <div key={member._id} className="flex items-center gap-2 py-1.5">
            <UserAvatar user={member} />
            <span className="flex-1 truncate">{member.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
              onClick={() => removeMutation.mutate(member._id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {inGroupStudents.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{t('groups.noMembers')}</p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-1 border-t flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t('groups.membersCount', { count: String(inGroupStudents.length) })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-primary"
          onClick={() => {
            setSearch('');
            setSelectedNew([]);
            setAddMemberOpen(true);
          }}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('groups.addMemberBtn')}
        </Button>
      </div>

      {/* Add member dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('groups.addMemberTitle', { name: group.name })}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('groups.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                {t('groups.noStudentsFound')}
              </p>
            ) : (
              filtered.map((s) => (
                <label
                  key={s._id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedNew.includes(s._id)}
                    onChange={(e) =>
                      setSelectedNew((prev) =>
                        e.target.checked ? [...prev, s._id] : prev.filter((id) => id !== s._id)
                      )
                    }
                  />
                  <UserAvatar user={s} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              {t('groups.cancelBtn')}
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedNew.length === 0 || addMutation.isPending}
            >
              {t('groups.addBtn', { count: String(selectedNew.length) })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Default groups tab ───────────────────────────────────────────────────────

function DefaultGroupsTab({ subjectId }: { subjectId: string }) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: queryKeys.groups.defaultBySubject(subjectId),
    queryFn: () => groupsApi.getDefaultBySubject(subjectId),
    staleTime: 60_000,
  });

  const { data: students = [] } = useQuery({
    queryKey: queryKeys.subjects.students(subjectId),
    queryFn: () => subjectsApi.getStudents(subjectId),
    staleTime: 120_000,
  });

  const groupedIds = new Set(
    groups.flatMap((g) => g.members.map((m) => (typeof m === 'object' ? m._id : m)))
  );
  const ungroupedStudents = students.filter((s) => !groupedIds.has(s._id));

  const createMutation = useMutation({
    mutationFn: (name: string) => groupsApi.createDefault({ name, subjectId }),
    onSuccess: (grp) => {
      queryClient.setQueryData(
        queryKeys.groups.defaultBySubject(subjectId),
        (old: Group[] | undefined) => [...(old ?? []), grp]
      );
      setCreateOpen(false);
      setNewName('');
      toast.success(t('groups.createGroupSuccess'));
    },
    onError: () => toast.error(t('groups.createGroupError')),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('groups.groupsCount', { count: String(groups.length) })} &mdash;{' '}
          {t('groups.studentsCount', { count: String(students.length) })}
        </p>
        <Button size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('groups.createGroupBtn')}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-2 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">{t('groups.noGroups')}</p>
          <p className="text-sm text-muted-foreground">{t('groups.noGroupsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <DefaultGroupCard key={g._id} group={g} allStudents={students} subjectId={subjectId} />
          ))}
        </div>
      )}

      {ungroupedStudents.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t('groups.ungroupedTitle', { count: String(ungroupedStudents.length) })}
          </p>
          <div className="flex flex-wrap gap-2">
            {ungroupedStudents.map((s) => (
              <div
                key={s._id}
                className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
              >
                <UserAvatar user={s} />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('groups.createGroupTitle')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('groups.createGroupNamePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim());
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('groups.cancelBtn')}
            </Button>
            <Button
              onClick={() => createMutation.mutate(newName.trim())}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {t('groups.createGroupBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Random groups tab ────────────────────────────────────────────────────────

function RandomGroupsTab({ subjectId }: { subjectId: string }) {
  const queryClient = useQueryClient();
  const { t } = useT();
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [mode, setMode] = useState<'groupCount' | 'memberCount'>('groupCount');
  const [groupCount, setGroupCount] = useState(5);
  const [memberCount, setMemberCount] = useState(6);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 60_000,
  });

  const activeCAttendId = selectedSession || sessions[0]?._id || '';

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: queryKeys.groups.randomByCAttend(activeCAttendId),
    queryFn: () => groupsApi.getRandomByCAttend(activeCAttendId),
    enabled: !!activeCAttendId,
    staleTime: 30_000,
  });

  const totalStudents = groups.flatMap((g) => g.members).length;

  const generateMutation = useMutation({
    mutationFn: (numberOfGroup: number) =>
      groupsApi.createRandom({ cAttendId: activeCAttendId, numberOfGroup }),
    onSuccess: (newGroups) => {
      queryClient.setQueryData(queryKeys.groups.randomByCAttend(activeCAttendId), newGroups);
      setRegenerateOpen(false);
      toast.success(t('groups.generateSuccess', { count: String(newGroups.length) }));
    },
    onError: () => toast.error(t('groups.generateError')),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => groupsApi.deleteRandomByCAttend(activeCAttendId),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.groups.randomByCAttend(activeCAttendId), []);
    },
  });

  const getNumberToGenerate = () => (mode === 'groupCount' ? groupCount : memberCount);

  const handleGenerate = () => {
    const n = getNumberToGenerate();
    if (n < 2) {
      toast.error('Số lượng tối thiểu là 2');
      return;
    }
    generateMutation.mutate(n);
  };

  const handleRegenerate = async () => {
    await deleteAllMutation.mutateAsync();
    const n = getNumberToGenerate();
    generateMutation.mutate(n);
    setRegenerateOpen(false);
  };

  const previewText = () => {
    if (mode === 'groupCount') {
      const avg = totalStudents > 0 ? String(Math.ceil(totalStudents / groupCount)) : '?';
      return t('groups.previewGroupCount', { groups: String(groupCount), avg });
    }
    const gc = totalStudents > 0 ? String(Math.ceil(totalStudents / memberCount)) : '?';
    return t('groups.previewGroupCount', { groups: gc, avg: String(memberCount) });
  };

  if (sessionsLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-2 text-center">
        <Shuffle className="h-8 w-8 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">{t('groups.noSessions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('groups.sessionLabel')}</span>
        <Select value={activeCAttendId} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-60 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {t('groups.sessionItem', {
                  n: String(s.sessionNumber),
                  date: new Date(s.date).toLocaleDateString('vi-VN'),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('groups.randomSummary', {
                groups: String(groups.length),
                students: String(totalStudents),
                avg: String(Math.ceil(totalStudents / groups.length)),
              })}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setRegenerateOpen(true)}
            >
              <Shuffle className="h-3.5 w-3.5" />
              {t('groups.regenerateBtn')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => {
              const members = g.members.map(getUser).filter(Boolean) as User[];
              return (
                <div
                  key={g._id}
                  className="rounded-xl border bg-white dark:bg-slate-900 p-4 space-y-2"
                >
                  <p className="font-semibold text-sm">{g.name}</p>
                  <div className="divide-y text-sm">
                    {members.map((m) => (
                      <div key={m._id} className="flex items-center gap-2 py-1.5">
                        <UserAvatar user={m} />
                        <span className="truncate">{m.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    {t('groups.memberCount', { count: String(members.length) })}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-6 space-y-4 max-w-md">
          <div className="text-center space-y-1">
            <Shuffle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="font-medium">{t('groups.noGroupsForSession')}</p>
            <p className="text-sm text-muted-foreground">{t('groups.noGroupsForSessionDesc')}</p>
          </div>
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'groupCount'}
                  onChange={() => setMode('groupCount')}
                />
                {t('groups.groupCountMode')}
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={mode === 'memberCount'}
                  onChange={() => setMode('memberCount')}
                />
                {t('groups.memberCountMode')}
              </label>
            </div>
            {mode === 'groupCount' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">{t('groups.groupCountLabel')}</span>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-24 h-8 text-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm w-28">{t('groups.memberCountLabel')}</span>
                <Input
                  type="number"
                  min={2}
                  max={30}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-24 h-8 text-sm"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('groups.previewLabel', { text: previewText() })}
            </p>
            <Button
              className="w-full gap-1"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              <Shuffle className="h-4 w-4" />
              {generateMutation.isPending ? t('groups.generating') : t('groups.generateBtn')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title={t('groups.regenerateDialog.title')}
        description={t('groups.regenerateDialog.description')}
        confirmLabel={t('groups.regenerateDialog.confirmBtn')}
        cancelLabel={t('groups.regenerateDialog.cancelBtn')}
        isLoading={generateMutation.isPending || deleteAllMutation.isPending}
        onConfirm={handleRegenerate}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherGroupsPage() {
  const { subjectId } = useSubject();
  const { t } = useT();
  const [tab, setTab] = useState<'default' | 'random'>('default');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {(['default', 'random'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === tabKey
                ? 'bg-white dark:bg-slate-800 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabKey === 'default' ? t('groups.defaultTab') : t('groups.randomTab')}
          </button>
        ))}
      </div>

      {tab === 'default' ? (
        <DefaultGroupsTab subjectId={subjectId} />
      ) : (
        <RandomGroupsTab subjectId={subjectId} />
      )}
    </div>
  );
}
