'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

/**
 * AuthGuard — wraps pages that require authentication.
 * Shows a spinner while the session is being hydrated from the cookie.
 * Middleware handles the actual redirect; this is a client-side safety fallback.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isHydrated, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        suppressHydrationWarning
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
