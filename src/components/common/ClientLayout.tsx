'use client';

import LoginModal from '@/components/auth/LoginModal';
import AppBackground from './AppBackground';
import ProProfileGuard from './ProProfileGuard';

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
