'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Allowed roles. If not specified, any authenticated user is allowed */
  allowedRoles?: ('client' | 'pro' | 'company' | 'admin')[];
  /** Where to redirect if not authenticated. Defaults to showing login modal */
  redirectTo?: string;
  /** Fallback component while checking auth */
  fallback?: React.ReactNode;
}

export default function AuthGuard({
  children,
  allowedRoles,
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        // Show login modal and redirect to home
        openLoginModal();
        router.replace('/');
      }
      return;
    }

    // Check role if specified
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // User is logged in but doesn't have the required role
      router.replace('/');
      return;
    }

    setIsAuthorized(true);
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router, openLoginModal]);

  // Show loading state
  if (isLoading) {
    return fallback || <AuthLoadingFallback />;
  }

  // Not authorized yet
  if (!isAuthorized) {
    return fallback || <AuthLoadingFallback />;
  }

  return <>{children}</>;
}

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
      <LoadingSpinner size="lg" color="#C4735B" />
    </div>
  );
}
