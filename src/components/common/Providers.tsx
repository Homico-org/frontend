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
import { GooglePhoneGateProvider } from '@/contexts/GooglePhoneGateContext';
import GooglePhoneGate from '@/components/auth/GooglePhoneGate';
import PremiumAnnouncementModal from '@/components/premium/PremiumAnnouncementModal';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // The whole tree. The Google OAuth provider is only added when a
  // clientId is configured; otherwise we render the tree unchanged so a
  // missing env var never breaks the app (the Google buttons hide
  // themselves on their own).
  const tree = (
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
                            <GooglePhoneGateProvider>
                              <NavigationProvider>{children}</NavigationProvider>
                              {/* Blocking phone-verification screen for
                                  Google sign-ups. Renders nothing unless
                                  the gate is active. */}
                              <GooglePhoneGate />
                              {/* One-time "Premium is here" launch
                                  announcement for existing non-premium pros.
                                  Self-gates (flag + role + tier + localStorage);
                                  renders nothing for everyone else. */}
                              <PremiumAnnouncementModal />
                            </GooglePhoneGateProvider>
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

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}
