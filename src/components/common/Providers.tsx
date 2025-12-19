'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthModalProvider>
            <ViewModeProvider>
              <NotificationProvider>
                <MessagesProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </MessagesProvider>
              </NotificationProvider>
            </ViewModeProvider>
          </AuthModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
