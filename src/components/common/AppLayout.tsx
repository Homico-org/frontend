'use client';

import { usePathname } from 'next/navigation';
import Header, { HeaderSpacer } from './Header';
import MobileBottomNav from './MobileBottomNav';

// Pages that have their own custom layout (include their own Header/MobileBottomNav)
// These pages should NOT get the global nav wrapper
const CUSTOM_LAYOUT_PATHS = [
  '/jobs',
  '/professionals',
  '/portfolio',
  '/tools',
  '/my-jobs',
  '/my-work',
  '/my-space',
  '/admin',
  '/login',
  '/register',
  '/onboarding',
  '/auth',
  // Pages that still have their own Header/MobileBottomNav (to be migrated later)
  '/notifications',
  '/settings',
  '/become-pro',
  '/about',
  '/privacy',
  '/terms',
  '/how-it-works',
  '/help',
  '/jobs/',
  '/professionals/',
  '/companies/',
  '/users/',
  '/pro/premium',
  '/pro/profile-setup',
  '/projects/new',
  '/for-business',
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Check if this page uses a custom layout
  const hasCustomLayout = pathname === '/' || CUSTOM_LAYOUT_PATHS.some(path => pathname.startsWith(path));

  // If page has custom layout, just render children (they handle their own nav)
  if (hasCustomLayout) {
    return <>{children}</>;
  }

  // For pages that use the global layout (my-jobs, my-work, post-job)
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Fixed Header */}
      <Header />
      <HeaderSpacer />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Fixed Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
