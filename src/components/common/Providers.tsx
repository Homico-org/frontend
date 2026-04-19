'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { CriticalNotificationProvider } from '@/contexts/CriticalNotificationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CategoriesProvider>
          <AuthProvider>
            <AuthModalProvider>
              <ViewModeProvider>
                <NotificationProvider>
                  <CriticalNotificationProvider>
                    <ToastProvider>
                      <ConfirmProvider>
                        {children}
                      </ConfirmProvider>
                    </ToastProvider>
                  </CriticalNotificationProvider>
                </NotificationProvider>
              </ViewModeProvider>
            </AuthModalProvider>
          </AuthProvider>
        </CategoriesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
