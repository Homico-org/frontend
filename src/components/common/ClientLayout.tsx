'use client';

import dynamic from 'next/dynamic';
import AmplitudeProvider from './AmplitudeProvider';
import AppBackground from './AppBackground';
import AppLayout from './AppLayout';
import DevServiceWorkerKiller from './DevServiceWorkerKiller';
import ProProfileGuard from './ProProfileGuard';

// Dynamically import modals to reduce initial bundle size
const LoginModal = dynamic(() => import("@/components/auth/LoginModal"), {
  ssr: false,
});

const CriticalNotificationOverlay = dynamic(
  () => import("@/components/critical-notification/CriticalNotificationOverlay"),
  { ssr: false }
);

const CriticalNotificationBanner = dynamic(
  () => import("@/components/critical-notification/CriticalNotificationBanner"),
  { ssr: false }
);

const PWAInstallPrompt = dynamic(() => import("./PWAInstallPrompt"), {
  ssr: false,
});

const EmailCapturePrompt = dynamic(() => import("./EmailCapturePrompt"), {
  ssr: false,
});

const ReleaseNotesModal = dynamic(() => import("./ReleaseNotesModal"), {
  ssr: false,
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <DevServiceWorkerKiller />
      <AmplitudeProvider />
      <AppBackground />
      <ProProfileGuard>
        <AppLayout>
          {children}
        </AppLayout>
      </ProProfileGuard>
      <LoginModal />
      <CriticalNotificationBanner />
      <CriticalNotificationOverlay />
      <EmailCapturePrompt />
      <ReleaseNotesModal />
      {/* <PWAInstallPrompt /> */}
    </>
  );
}
