'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Get landing URL from env or use current origin as fallback (works for localhost, dev, prod)
const getLandingUrl = () => {
  if (process.env.NEXT_PUBLIC_LANDING_URL) {
    return process.env.NEXT_PUBLIC_LANDING_URL;
  }
  // Fallback to current origin - works for any environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://homico.ge';
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Authenticated users go to browse page
      router.replace('/browse');
    } else {
      // Non-authenticated users go to landing page (separate project or login)
      const landingUrl = getLandingUrl();
      // If landing URL is same origin, use router for better UX
      if (typeof window !== 'undefined' && landingUrl === window.location.origin) {
        router.replace('/login');
      } else {
        window.location.href = landingUrl;
      }
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
