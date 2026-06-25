'use client';

import { usePathname } from 'next/navigation';
import Header, { HeaderSpacer } from './Header';
import MobileBottomNav from './MobileBottomNav';

/**
 * Strip a leading 2-letter country segment from the pathname so the
 * CUSTOM_LAYOUT_PATHS check below works the same whether the URL is
 * `/professionals` (legacy) or `/ge/professionals` (post 2026-05
 * marketplace routing). Unknown 2-letter codes (e.g. /li/...) also
 * get stripped because the route still resolves through the same
 * (shell) layout - this function is only used for layout decision,
 * not for validation.
 */
function withoutCountryPrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/i, '') || '/';
}

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
  '/bookings',
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
  // Editorial blog/journal - ships its own Header + LandingFooter.
  '/blog',
  '/jobs/',
  '/professionals/',
  '/companies/',
  '/users/',
  '/pro/premium',
  '/pro/profile-setup',
  // Editorial-style standalone explainer for the SLA accountability
  // system. Renders its own minimal chrome - no header/mobile-nav
  // wrapping or it would break the magazine-spread composition.
  '/pro/accountability',
  '/projects',
  // /shop and /orders live in the (shell) route group and ship the shell's
  // Header + sidebar; without this they get a second global Header on top.
  '/shop',
  '/orders',
  '/for-business',
  '/invite',
  // Post-job has its own action footer (Cancel / Continue) — global mobile
  // bottom nav would stack on top of it.
  '/post-job',
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Strip the country prefix before checking - `/ge/professionals`
  // and `/professionals` should both opt into the same custom layout
  // (the one that ships its own Header from the shell route group).
  const checkPath = withoutCountryPrefix(pathname);

  // Check if this page uses a custom layout
  const hasCustomLayout =
    checkPath === '/' ||
    pathname === '/' ||
    CUSTOM_LAYOUT_PATHS.some(path => checkPath.startsWith(path));

  // If page has custom layout, just render children (they handle their own nav)
  if (hasCustomLayout) {
    return <>{children}</>;
  }

  // For pages that use the global layout (my-jobs, my-work, post-job)
  return (
    <div className="min-h-screen flex flex-col bg-[var(--hm-bg-page)]">
      {/* Fixed Header */}
      <Header />
      <HeaderSpacer />

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Fixed Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
