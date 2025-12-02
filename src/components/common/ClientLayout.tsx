'use client';

import { useAuth } from '@/contexts/AuthContext';
import SupportChat from './SupportChat';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {children}
      {isAuthenticated && <SupportChat />}
    </>
  );
}
