'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  File,
  Download,
  Trash2,
  Upload,
  Pencil,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cAttendApi } from '@/lib/api/cAttend';
import { documentsApi } from '@/lib/api/documents';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CAttend, Document as Doc } from '@/types/domain';

type FileExt = 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | string;

const FILE_CONFIGS: Record<string, { color: string; bg: string }> = {
  pdf: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  doc: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  docx: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  ppt: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  pptx: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  xls: { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  xlsx: { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
};

function getFileConfig(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_CONFIGS[ext] ?? { color: 'text-neutral-500', bg: 'bg-neutral-100 dark:bg-slate-700' };
}

function SessionDocSection({ session, userId }: { session: CAttend; userId: string }) {
  const queryClient = useQueryClient();
  const { t, locale } = useT();
  const localeTag = locale === 'vi' ? 'vi-VN' : 'en-US';
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const wd = d.getDay();
    const idx = wd === 0 ? 7 : wd;
    const day = idx >= 1 && idx <= 7 ? t(`days.short.d${idx}` as TKey) : '';
    return `${day}, ${d.toLocaleDateString(localeTag)}`;
  };
  const [expanded, setExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [renameTarget, setRenameTarget] = useState<Doc | null>(null);
  const [renameName, setRenameName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.byCAttend(session._id),
    queryFn: () => documentsApi.getByCAttend(session._id),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.documents.byCAttend(session._id) });
      const snapshot = queryClient.getQueryData(queryKeys.documents.byCAttend(session._id));
      queryClient.setQueryData(
        queryKeys.documents.byCAttend(session._id),
        (old: Doc[] | undefined) => old?.filter((d) => d._id !== id) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(queryKeys.documents.byCAttend(session._id), ctx.snapshot);
      toast.error(t('documents.deleteFailed'));
    },
    onSuccess: () => {
      toast.success(t('documents.deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => documentsApi.update(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.documents.byCAttend(session._id) });
      const snapshot = queryClient.getQueryData(queryKeys.documents.byCAttend(session._id));
      queryClient.setQueryData(
        queryKeys.documents.byCAttend(session._id),
        (old: Doc[] | undefined) => old?.map((d) => (d._id === id ? { ...d, name } : d)) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot)
        queryClient.setQueryData(queryKeys.documents.byCAttend(session._id), ctx.snapshot);
      toast.error(t('documents.renameFailed'));
    },
    onSuccess: () => {
      toast.success(t('documents.renameSuccess'));
      setRenameTarget(null);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';
    setUploading(true);
    setUploadPct(0);
    try {
      const doc = await documentsApi.upload(
        file,
        { name: file.name, type: ext, cAttendId: session._id },
        setUploadPct
      );
      queryClient.setQueryData(
        queryKeys.documents.byCAttend(session._id),
        (old: Doc[] | undefined) => [...(old ?? []), doc]
      );
      toast.success(t('documents.uploadSuccess'));
    } catch {
      toast.error(t('documents.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadPct(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v);
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">
            {t('documents.sessionLabel', { n: String(session.sessionNumber) })}
          </span>
          <span className="text-sm text-muted-foreground">— {formatDate(session.date)}</span>
          {docs.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
              {docs.length}
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? `${uploadPct}%` : t('documents.uploadBtn')}
          </Button>
        </div>
      </div>

      {expanded && (
        <div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : docs.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('documents.noDocuments')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {docs.map((doc) => {
                  const cfg = getFileConfig(doc.name);
                  return (
                    <tr key={doc._id} className="hover:bg-neutral-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 w-8">
                        <div
                          className={cn('h-7 w-7 rounded flex items-center justify-center', cfg.bg)}
                        >
                          <FileText className={cn('h-4 w-4', cfg.color)} />
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium max-w-xs truncate">{doc.name}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">
                        {doc.name.split('.').pop()?.toUpperCase() ?? doc.type?.toUpperCase()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a href={doc.dowloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => {
                              setRenameTarget(doc);
                              setRenameName(doc.name);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('documents.deleteConfirmTitle')}
        description={t('documents.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('documents.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder={t('documents.renameLabel')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameName.trim()) {
                  renameMutation.mutate({ id: renameTarget!._id, name: renameName.trim() });
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={renameMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() =>
                renameName.trim() &&
                renameMutation.mutate({ id: renameTarget!._id, name: renameName.trim() })
              }
              disabled={renameMutation.isPending || !renameName.trim()}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeacherDocumentsPage() {
  const { subjectId } = useSubject();
  const { user } = useAuth();
  const { t } = useT();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.cAttend.bySubject(subjectId),
    queryFn: () => cAttendApi.getBySubject(subjectId),
    staleTime: 60_000,
  });

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-neutral-50 dark:bg-slate-800 py-12 gap-3 text-center">
        <File className="h-8 w-8 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">{t('sessions.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedSessions.map((session) => (
        <SessionDocSection key={session._id} session={session} userId={user?._id ?? ''} />
      ))}
    </div>
  );
}
