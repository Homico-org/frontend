'use client';

import EmailChangeModal from '@/components/settings/EmailChangeModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

// Auto-opens once per browser session (not per navigation) so we keep asking
// email-less users across sessions without slamming a modal on every click.
const SEEN_KEY = 'homi.emailPrompt.seen.v1';

/**
 * Global, layout-independent nudge: for signed-in users with no email on file,
 * auto-opens the OTP-verified add-email modal once per session so we build a
 * real, deliverable marketing list (no bounces). Mounted once in ClientLayout;
 * renders nothing for users who already have an email.
 */
export default function EmailCapturePrompt() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);

  const needsEmail = isAuthenticated && !!user && !user.email;

  useEffect(() => {
    if (!needsEmail) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SEEN_KEY) === '1') return;
    // Small delay so the app paints first - a modal that appears mid-load
    // reads as a glitch rather than a deliberate ask.
    const id = setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, '1');
      setOpen(true);
    }, 1800);
    return () => clearTimeout(id);
  }, [needsEmail]);

  if (!needsEmail) return null;

  return (
    <EmailChangeModal
      isOpen={open}
      onClose={() => setOpen(false)}
      currentEmail=""
      locale={locale}
      onSuccess={(email) => {
        updateUser({ email });
        setOpen(false);
      }}
    />
  );
}
