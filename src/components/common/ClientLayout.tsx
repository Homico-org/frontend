'use client';

import dynamic from 'next/dynamic';
import AppBackground from './AppBackground';
import ProProfileGuard from './ProProfileGuard';

// Dynamically import LoginModal to reduce initial bundle size
const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), {
  ssr: false, // Modal doesn't need SSR
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <AppBackground />
      <ProProfileGuard>
        {children}
      </ProProfileGuard>
      <LoginModal />
    </>
  );
}
