'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { teacherNavItems, studentNavItems } from '@/constants/navigation';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  className?: string;
  unreadCount: number;
}

export function MobileNav({ className, unreadCount }: MobileNavProps) {
  const { user } = useAuth();
  const { t } = useT();
  const pathname = usePathname();
  const navItems = user?.role === 'teacher' ? teacherNavItems : studentNavItems;
  const profileHref = user?.role === 'teacher' ? ROUTES.TEACHER.PROFILE : ROUTES.STUDENT.PROFILE;

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border dark:border-slate-700/60 bg-white dark:bg-slate-900 px-2 transition-colors',
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const badge = item.showBadge ? unreadCount : 0;
        const label = t(item.labelKey);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary dark:text-blue-400' : 'text-neutral-500 dark:text-slate-500'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="truncate max-w-full px-1">{label}</span>
          </Link>
        );
      })}

      {/* Profile tab */}
      <Link
        href={profileHref}
        className={cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
          pathname === profileHref
            ? 'text-primary dark:text-blue-400'
            : 'text-neutral-500 dark:text-slate-500'
        )}
      >
        <User className="h-5 w-5" />
        <span>{t('nav.profile')}</span>
      </Link>
    </nav>
  );
}

