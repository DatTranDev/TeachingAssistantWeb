'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/hooks/use-t';

interface NavItemProps {
  href: string;
  labelKey: TKey;
  icon: LucideIcon;
  collapsed?: boolean;
  badge?: number;
}

export function NavItem({ href, labelKey, icon: Icon, collapsed, badge }: NavItemProps) {
  const pathname = usePathname();
  const { t } = useT();
  const label = t(labelKey);
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
        collapsed ? 'w-10 h-10 justify-center px-0' : '',
        isActive
          ? 'bg-primary/10 text-primary dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100'
      )}
    >
      <div className="relative shrink-0">
        <Icon className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
