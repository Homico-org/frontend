'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import AppBackground from './AppBackground';
import SupportChat from './SupportChat';
import ProProfileGuard from './ProProfileGuard';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AppBackground />
      <ProProfileGuard>
        {children}
      </ProProfileGuard>
      {isAuthenticated && <SupportChat />}
      <LoginModal />
    </>
  );
}
