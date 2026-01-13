'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProProfileGuardProps {
  children: React.ReactNode;
}

// Pages that incomplete pro users are allowed to access
const ALLOWED_PATHS_FOR_INCOMPLETE_PRO = [
  '/pro/profile-setup',
  '/settings',
  '/logout',
  '/register', // Allow completion screen after registration
];

// Check if path starts with any allowed path
const isPathAllowed = (pathname: string): boolean => {
  return ALLOWED_PATHS_FOR_INCOMPLETE_PRO.some(
    allowed => pathname === allowed || pathname.startsWith(allowed + '/')
  );
};

export default function ProProfileGuard({ children }: ProProfileGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) {
      return;
    }

    // If not authenticated, let other guards handle it
    if (!isAuthenticated || !user) {
      setIsChecking(false);
      return;
    }

    // Only check for pro users
    if (user.role !== 'pro') {
      setIsChecking(false);
      return;
    }

    // If pro user has incomplete profile and is not on allowed page
    if (user.isProfileCompleted === false && !isPathAllowed(pathname)) {
      router.replace('/pro/profile-setup');
      return;
    }

    setIsChecking(false);
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Show loading while checking
  if (isLoading || isChecking) {
    // Only show loading indicator if it's a pro user that might need redirect
    if (user?.role === 'pro' && user?.isProfileCompleted === false) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
          <LoadingSpinner size="xl" color="#E07B4F" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
