import { useLanguage } from '@/contexts/LanguageContext';
import { locales } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/en';

/**
 * Deeply resolve a dot-notation key path in the translations object.
 * Supports simple interpolation via {{key}} placeholders.
 */
function resolvePath(obj: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  if (typeof value === 'string') return value;
  return path; // fallback to key if not found
}

type StringLeaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
    ? StringLeaves<T[K], `${Prefix}${K}.`>
    : never;
}[keyof T & string];

export type TKey = StringLeaves<Translations>;

/**
 * useT — Returns a translation function `t(key, vars?)`.
 *
 * @example
 * const { t } = useT();
 * t('nav.classes')                        // "Classes"
 * t('student.classes.subtitle', { count: 3 })  // "3 classes"
 */
export function useT() {
  const { locale } = useLanguage();
  const dict = locales[locale];

  function t(key: TKey, vars?: Record<string, string | number>): string {
    let value = resolvePath(dict, key as string);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      });
    }
    return value;
  }

  return { t, locale };
}
