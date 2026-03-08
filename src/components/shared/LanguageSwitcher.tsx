'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/hooks/use-t';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const { t } = useT();

  const toggle = () => {
    const next: Locale = locale === 'vi' ? 'en' : 'vi';
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      title={t('language.select')}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-transparent hover:border-border dark:hover:border-slate-700 select-none"
      aria-label={t('language.select')}
    >
      {locale === 'vi' ? 'VI' : 'EN'}
    </button>
  );
}
