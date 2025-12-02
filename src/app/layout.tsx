import ClientLayout from '@/components/common/ClientLayout';
import ToastContainer from '@/components/common/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import '@/styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Homico - Find Your Perfect Home Professional',
  description: 'Marketplace for craftsmen, interior designers, architects, and renovation professionals',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Helvetica Neue - system font stack */}
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ViewModeProvider>
                <ToastProvider>
                  <ClientLayout>{children}</ClientLayout>
                  <ToastContainer />
                </ToastProvider>
              </ViewModeProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
