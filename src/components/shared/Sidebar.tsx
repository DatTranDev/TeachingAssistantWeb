'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { teacherNavItems, studentNavItems } from '@/constants/navigation';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export function Sidebar({ collapsed, onToggle, unreadCount }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useT();
  const navItems = user?.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen border-r border-border dark:border-slate-700/60 bg-white dark:bg-slate-900 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border dark:border-slate-700/60 px-4 shrink-0">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-neutral-900 dark:text-slate-100 text-sm truncate">
              Teaching Assistant
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-400 dark:text-slate-500 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            labelKey={item.labelKey}
            icon={item.icon}
            collapsed={collapsed}
            badge={item.showBadge ? unreadCount : undefined}
          />
        ))}
      </nav>

      {/* User menu */}
      <div className="border-t border-border dark:border-slate-700/60 p-3 shrink-0">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
