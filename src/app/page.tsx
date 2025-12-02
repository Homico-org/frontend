'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Configuration - Landing page URL for non-authenticated users
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'https://homico.ge';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Authenticated users go to browse page
      router.replace('/browse');
    } else {
      // Non-authenticated users go to landing page (separate project)
      window.location.href = LANDING_URL;
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-dark-bg">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-neutral-200 dark:border-dark-border rounded-full animate-spin border-t-forest-800 dark:border-t-primary-400" />
      </div>
    </div>
  );
}
