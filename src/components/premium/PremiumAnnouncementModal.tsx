'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';
import { features } from '@/config/features';
import { isPaidTier } from '@/utils/premium';
import { Crown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * One-time "Premium is here" launch announcement for EXISTING pros.
 *
 * Mounted globally in Providers (next to GooglePhoneGate). It renders
 * nothing unless ALL of these hold:
 *   - the `premium` feature flag is ON (single source of truth);
 *   - someone is logged in AND their role is "pro";
 *   - the pro is NOT already on a paid tier (isPaidTier + isPremium,
 *     same expiry-checked pair the Header uses);
 *   - the announcement hasn't been dismissed before
 *     (localStorage `premiumAnnouncementSeen`).
 *
 * Clients, admins, anonymous visitors and already-premium pros never
 * see it. Dismissing (CTA or close/"later") writes the localStorage
 * marker so it shows at most once per browser.
 *
 * SSR/hydration: the localStorage read happens in an effect (never
 * during render) so the server and first client paint agree (modal
 * hidden), avoiding a hydration mismatch. `mounted` gates the portal
 * until after that effect runs.
 */
const STORAGE_KEY = 'premiumAnnouncementSeen';

export default function PremiumAnnouncementModal() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const cl = useCountryLink();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Eligibility, recomputed when auth state settles. The localStorage
  // read lives here (effect, client-only) to keep SSR output stable.
  useEffect(() => {
    if (!features.premium) return;
    if (!isAuthenticated || !user) return;
    if (user.role !== 'pro') return;
    // Already a paying pro -> nothing to upsell.
    if (isPaidTier(user.premiumTier) && user.isPremium) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    } catch {
      // localStorage unavailable (private mode / SSR) -> just don't show.
      return;
    }
    setOpen(true);
  }, [isAuthenticated, user]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Best-effort; if it fails the modal still closes for this session.
    }
    setOpen(false);
  };

  const handleViewPremium = () => {
    dismiss();
    router.push(cl('/pro/premium'));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 overflow-y-auto bg-black/50"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm mx-auto py-8 px-5 rounded-2xl shadow-xl"
        style={{ backgroundColor: 'var(--hm-bg-elevated)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('premium.announce.later')}
          className="absolute top-3 right-3 p-2 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--hm-brand-500)]" strokeWidth={2} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-[var(--hm-fg-primary)] mb-1 sm:mb-2">
            {t('premium.announce.title')}
          </h1>
          <p className="text-xs sm:text-base text-[var(--hm-fg-muted)] leading-relaxed">
            {t('premium.announce.message')}
          </p>
        </div>

        <Button
          onClick={handleViewPremium}
          className="w-full h-10 sm:h-11 text-sm sm:text-base"
          size="lg"
        >
          {t('premium.announce.cta')}
        </Button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={dismiss}
            className="text-xs sm:text-sm text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] transition-colors p-1"
          >
            {t('premium.announce.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
