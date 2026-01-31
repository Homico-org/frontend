'use client';

import dynamic from 'next/dynamic';
import AppBackground from './AppBackground';
import AppLayout from './AppLayout';
import ProProfileGuard from './ProProfileGuard';

// Dynamically import modals to reduce initial bundle size
const LoginModal = dynamic(() => import("@/components/auth/LoginModal"), {
  ssr: false,
});

const PWAInstallPrompt = dynamic(() => import("./PWAInstallPrompt"), {
  ssr: false,
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <AppBackground />
      <ProProfileGuard>
        <AppLayout>
          {children}
        </AppLayout>
      </ProProfileGuard>
      <LoginModal />
      <PWAInstallPrompt />
    </>
  );
}
