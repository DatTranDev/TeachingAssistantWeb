'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-t';
import { ROUTES } from '@/constants/routes';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t } = useT();

  if (!user) return null;

  const roleLabel = user.role === 'teacher' ? t('user.role.teacher') : t('user.role.student');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          aria-label={t('user.userOptions')}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-white text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-slate-400 truncate">{roleLabel}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-48 dark:bg-slate-800 dark:border-slate-700">
        <DropdownMenuItem
          className="cursor-pointer dark:text-slate-200 dark:focus:bg-slate-700"
          onClick={() =>
            router.push(user.role === 'teacher' ? ROUTES.TEACHER.PROFILE : ROUTES.STUDENT.PROFILE)
          }
        >
          <User className="mr-2 h-4 w-4" />
          {t('user.viewProfile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-slate-700" />
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="text-red-600 focus:text-red-600 cursor-pointer dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-slate-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

