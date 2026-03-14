'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/use-auth';
import { SocketProvider } from '@/providers/socket-provider';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
      setCollapsed(true);
    }
  }, []);

  const { data: notifications } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.getAll(),
    enabled: !!user?._id,
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  return (
    <SocketProvider userId={user?._id}>
      <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-slate-950 transition-colors">
        {/* Desktop Sidebar */}
        <Sidebar collapsed={collapsed} onToggle={toggleCollapse} unreadCount={unreadCount} />

        {/* Main content column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar unreadCount={unreadCount} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
          {/* Mobile bottom nav */}
          <MobileNav className="lg:hidden" unreadCount={unreadCount} />
        </div>
      </div>
    </SocketProvider>
  );
}
