'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { defaultBackFallback } from '@/utils/navigationUtils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Allowed roles. If not specified, any authenticated user is allowed */
  allowedRoles?: ('client' | 'pro' | 'admin')[];
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
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  // Guard against the toast firing twice in React Strict Mode (effect
  // runs, cleans up, runs again) when bouncing on a role mismatch.
  const wrongRoleToastFiredRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        // Show login modal. The modal context now captures the
        // current URL by default, so the user returns to this
        // protected page after signing in.
        openLoginModal();
        router.replace('/');
      }
      return;
    }

    // Logged in but the wrong role for this route. Tell the user why
    // they're being moved (silent bounces to `/` are confusing) and
    // route them to a role-appropriate home so they don't land on a
    // page they also can't use.
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      if (!wrongRoleToastFiredRef.current) {
        wrongRoleToastFiredRef.current = true;
        toast.info(t('auth.wrongRoleRedirect'));
      }
      router.replace(defaultBackFallback(user));
      return;
    }

    setIsAuthorized(true);
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router, openLoginModal, toast, t]);

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
    <div className="min-h-screen bg-[var(--hm-bg-page)] flex items-center justify-center">
      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
    </div>
  );
}
