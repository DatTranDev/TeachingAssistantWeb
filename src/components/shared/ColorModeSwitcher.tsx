'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useColorMode, type ColorMode } from '@/contexts/ColorModeContext';
import { useT } from '@/hooks/use-t';

const CYCLE: ColorMode[] = ['system', 'light', 'dark'];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

export function ColorModeSwitcher() {
  const { colorMode, setColorMode } = useColorMode();
  const { t } = useT();

  const cycle = () => {
    const next: ColorMode = CYCLE[(CYCLE.indexOf(colorMode) + 1) % CYCLE.length] ?? 'system';
    setColorMode(next);
  };

  const Icon = ICONS[colorMode];

  return (
    <button
      onClick={cycle}
      title={t('colorMode.select')}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-transparent hover:border-border dark:hover:border-slate-700"
      aria-label={t('colorMode.select')}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
