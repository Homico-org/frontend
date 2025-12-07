'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Temporarily redirect all users (authenticated or not) to /browse
    // Landing page is closed for now
    router.replace('/browse');
  }, [router]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-dark-bg">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-neutral-200 dark:border-dark-border rounded-full animate-spin border-t-forest-800 dark:border-t-primary-400" />
      </div>
    </div>
  );
}
