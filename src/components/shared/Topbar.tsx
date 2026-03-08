'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { UserMenu } from './UserMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ColorModeSwitcher } from './ColorModeSwitcher';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
  unreadCount: number;
}

function getRouteLabel(pathname: string, t: (key: Parameters<ReturnType<typeof useT>['t']>[0]) => string): string {
  if (pathname.includes('/timetable')) return t('nav.timetable');
  if (pathname.includes('/classes') && pathname.split('/').length > 3) return t('nav.classDetail');
  if (pathname.includes('/classes')) return t('nav.classes');
  if (pathname.includes('/notifications')) return t('nav.notifications');
  if (pathname.includes('/profile')) return t('nav.profile');
  return t('nav.dashboard');
}

export function Topbar({ onMobileMenuToggle, unreadCount }: TopbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useT();
  const pageTitle = getRouteLabel(pathname, t);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border dark:border-slate-700/60 bg-white dark:bg-slate-900 px-4 transition-colors">
      {/* Mobile menu button */}
      <button
        className="lg:hidden text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
        onClick={onMobileMenuToggle}
        aria-label={t('sidebar.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title / breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-neutral-900 dark:text-slate-100 truncate">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Color mode switcher */}
        <ColorModeSwitcher />

        {/* Notification bell */}
        <Link
          href={user?.role === 'teacher' ? '/teacher/notifications' : '/student/notifications'}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-100 transition-colors"
          aria-label={`${t('nav.notifications')}${unreadCount > 0 ? ` (${unreadCount} ${t('notifications.unread').replace('{{count}}', String(unreadCount))})` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar (mobile/tablet — shown when sidebar hidden) */}
        <div className="lg:hidden">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

