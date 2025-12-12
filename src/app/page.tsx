'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    // Redirect based on user role
    if (user?.role === 'pro') {
      router.replace('/browse/jobs');
    } else {
      // Non-logged-in users and clients go to portfolio
      router.replace('/browse/portfolio');
    }
  }, [router, user, isLoading]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-dark-bg">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-neutral-200 dark:border-dark-border rounded-full animate-spin border-t-forest-800 dark:border-t-primary-400" />
      </div>
    </div>
  );
}
