'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, File, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { cAttendApi } from '@/lib/api/cAttend';
import { documentsApi } from '@/lib/api/documents';
import { queryKeys } from '@/lib/api/queryKeys';
import { useSubject } from '@/contexts/SubjectContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';
import type { CAttend, Document as Doc } from '@/types/domain';

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  const wd = d.getDay();
  const dayNames = locale === 'vi' ? DAY_NAMES_VI : DAY_NAMES_EN;
  const day = dayNames[wd] ?? '';
  return `${day}, ${d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}`;
}

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

function SessionDocSection({ session }: { session: CAttend }) {
  const { t, locale } = useT();
  const [expanded, setExpanded] = useState(true);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.byCAttend(session._id),
    queryFn: () => documentsApi.getByCAttend(session._id),
    staleTime: 60_000,
  });

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium text-sm">
          {t('documents.sessionLabel', { n: String(session.sessionNumber) })}
        </span>
        <span className="text-sm text-muted-foreground">— {formatDate(session.date, locale)}</span>
        {docs.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
            {docs.length}
          </span>
        )}
      </button>

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
                        <div className="flex justify-end">
                          <a href={doc.dowloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
                              <Download className="h-3.5 w-3.5" />
                              {t('documents.downloadBtn')}
                            </Button>
                          </a>
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
    </div>
  );
}

export default function StudentDocumentsPage() {
  const { subjectId } = useSubject();
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
        <p className="font-medium text-muted-foreground">{t('documents.noSessions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedSessions.map((session) => (
        <SessionDocSection key={session._id} session={session} />
      ))}
    </div>
  );
}
