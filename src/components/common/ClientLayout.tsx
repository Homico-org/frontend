'use client';

import dynamic from 'next/dynamic';
import AppBackground from './AppBackground';
import AppLayout from './AppLayout';
import ProProfileGuard from './ProProfileGuard';
import { useLanguage } from "@/contexts/LanguageContext";

// Dynamically import LoginModal to reduce initial bundle size
const LoginModal = dynamic(() => impor"@/components/auth/LoginModal", {
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
        <AppLayout>
          {children}
        </AppLayout>
      </ProProfileGuard>
      <LoginModal />
    </>
  );
}
