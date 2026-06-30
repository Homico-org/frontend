'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
  exchangeGoogleToken,
  useGooglePhoneGate,
} from '@/contexts/GooglePhoneGateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

interface GoogleSignInButtonProps {
  /** Role applied to a brand-new Google account. */
  role: 'client' | 'pro';
  /** Called after a successful exchange that did NOT need a phone. */
  onSignedIn?: () => void;
}

/**
 * "Continue with Google" button. Renders nothing when
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is absent so a missing config never
 * shows a broken button. On success it exchanges the id_token for a
 * Homico session; if the account still needs a phone it raises the
 * blocking gate via GooglePhoneGateContext.
 */
export default function GoogleSignInButton({
  role,
  onSignedIn,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const { login } = useAuth();
  const { beginGate } = useGooglePhoneGate();
  const { t } = useLanguage();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const [busy, setBusy] = useState(false);

  // Hide entirely if Google OAuth isn't configured.
  if (!clientId) return null;

  const handleCredential = async (credential?: string) => {
    if (!credential || busy) return;
    setBusy(true);
    try {
      const data = await exchangeGoogleToken(credential, role);
      // Pose the session exactly like a normal login.
      login(data.access_token, data.user, data.refresh_token);
      trackEvent(
        data.user?.role === 'pro'
          ? AnalyticsEvent.REGISTER_PRO
          : AnalyticsEvent.LOGIN,
        { userRole: data.user?.role, authMethod: 'google' },
      );
      if (data.needsPhone) {
        // Raise the mandatory phone gate. The layout-level guard takes
        // over from here; we deliberately do NOT redirect.
        beginGate();
      } else {
        onSignedIn?.();
      }
    } catch (err: any) {
      toast.error(err?.message || t('auth.googleSignInFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <GoogleLogin
        onSuccess={(resp) => {
          void handleCredential(resp.credential);
        }}
        onError={() => toast.error(t('auth.googleSignInFailed'))}
        text="continue_with"
        width="320"
      />
    </div>
  );
}
