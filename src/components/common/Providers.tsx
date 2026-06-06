'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import { LanguageProvider, type Locale } from '@/contexts/LanguageContext';
import type { CountryCode } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { CriticalNotificationProvider } from '@/contexts/CriticalNotificationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NavigationProvider from '@/components/common/NavigationProvider';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';
import { CartUIProvider } from '@/contexts/CartUIContext';

interface ProvidersProps {
  children: React.ReactNode;
  /** Locale read from the `homico-locale` cookie in the server layout. */
  initialLocale?: Locale;
  /** Phone-input country read from the `homico-country` cookie. */
  initialCountry?: CountryCode;
}

export default function Providers({
  children,
  initialLocale,
  initialCountry,
}: ProvidersProps) {
  return (
    <ThemeProvider>
      <LanguageProvider initialLocale={initialLocale} initialCountry={initialCountry}>
        <CategoriesProvider>
          <AuthProvider>
            <AuthModalProvider>
              <ViewModeProvider>
                <NotificationProvider>
                  <CriticalNotificationProvider>
                    <ToastProvider>
                      <ConfirmProvider>
                        <CommandPaletteProvider>
                          <CartUIProvider>
                            <NavigationProvider>{children}</NavigationProvider>
                          </CartUIProvider>
                        </CommandPaletteProvider>
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
