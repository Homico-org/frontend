'use client';

import { useAuth } from '@/contexts/AuthContext';
import AppBackground from './AppBackground';
import SupportChat from './SupportChat';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AppBackground />
      {children}
      {isAuthenticated && <SupportChat />}
    </>
  );
}
