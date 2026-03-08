'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ChevronRight } from 'lucide-react';
import type { Subject } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subject.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available (non-HTTPS env)
    }
  };

  return (
    <div className="flex flex-col rounded-xl border bg-white dark:bg-slate-900 p-5 gap-3 hover:shadow-md transition-shadow">
      {/* Name */}
      <h3 className="text-base font-semibold leading-snug line-clamp-2">{subject.name}</h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground uppercase">{subject.code}</span>
        <span>·</span>
        <span>{t('subjects.card.maxAbsences', { count: String(subject.maxAbsences) })}</span>
      </div>

      <div className="border-t" />

      {/* Join code */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-muted-foreground">{t('subjects.card.joinCode')}</span>
          <span className="font-mono font-semibold tracking-wider">{subject.joinCode}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={copied ? 'text-green-600 border-green-300' : ''}
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {t('subjects.card.copied')}
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              {t('subjects.card.copy')}
            </>
          )}
        </Button>
      </div>

      {/* Detail link */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/teacher/classes/${subject._id}`}>
            {t('subjects.card.viewDetail')} <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
