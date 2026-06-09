"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import CategoryGrid from "@/components/landing/CategoryGrid";
import ConciergeIntakeModal from "@/components/landing/ConciergeIntakeModal";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import MobileStickyBar from "@/components/landing/MobileStickyBar";
import RecommendedJobs from "@/components/landing/RecommendedJobs";
import WhyHomico from "@/components/landing/WhyHomico";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountry } from "@/hooks/useCountry";
import { useCallback, useEffect, useMemo, useState } from "react";

// Per-marketplace LocalBusiness data for the Schema.org JSON-LD. Each
// marketplace gets its own city, country code, and tagline so a /us
// SERP snippet doesn't claim to operate in Tbilisi.
const MARKETPLACE_SCHEMA: Record<
  string,
  { city: string; country: string; tagline: string }
> = {
  GE: { city: "Tbilisi",   country: "GE", tagline: "Find vetted home renovation pros in Tbilisi - clear quotes, real reviews, no chasing." },
  IL: { city: "Tel Aviv",  country: "IL", tagline: "Find vetted home renovation pros in Tel Aviv - clear quotes, real reviews, no chasing." },
  FR: { city: "Paris",     country: "FR", tagline: "Find vetted home renovation pros in Paris - clear quotes, real reviews, no chasing." },
  US: { city: "New York",  country: "US", tagline: "Find vetted home renovation pros in New York - clear quotes, real reviews, no chasing." },
  DE: { city: "Berlin",    country: "DE", tagline: "Find vetted home renovation pros in Berlin - clear quotes, real reviews, no chasing." },
  UK: { city: "London",    country: "GB", tagline: "Find vetted home renovation pros in London - clear quotes, real reviews, no chasing." },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://homico.co";

export default function HomePage() {
  const { isLoading } = useAuth();
  const { trackEvent } = useAnalytics();
  const country = useCountry();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const openIntake = useCallback(() => {
    trackEvent(AnalyticsEvent.LANDING_ASSISTANT_CLICK);
    setIntakeOpen(true);
  }, [trackEvent]);
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  // Build the LocalBusiness JSON-LD per marketplace so /us, /il, /fr
  // SERP snippets describe the right city and ISO country.
  const localBusinessJsonLd = useMemo(() => {
    const m = MARKETPLACE_SCHEMA[country] ?? MARKETPLACE_SCHEMA.GE;
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Homico",
      description: m.tagline,
      url: `${APP_URL}/${country.toLowerCase()}`,
      image: `${APP_URL}/api/og`,
      address: {
        "@type": "PostalAddress",
        addressLocality: m.city,
        addressCountry: m.country,
      },
      areaServed: { "@type": "City", name: m.city },
      priceRange: "Free",
    };
  }, [country]);

  // Concierge-MVP: everyone sees the landing. Pros/admins navigate to their
  // workspace via the header - no auto-redirect off `/`.
  useEffect(() => {
    if (!isLoading) trackEvent(AnalyticsEvent.LANDING_VIEW);
  }, [isLoading, trackEvent]);

  // Avoid flash while auth resolves.
  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] overflow-x-hidden">
      {/* Schema.org LocalBusiness - improves search-engine understanding */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />

      <Header />
      <HeaderSpacer />

      <main>
        <LandingHero onIntakeOpen={openIntake} />
        <CategoryGrid onIntakeOpen={openIntake} />
        <RecommendedJobs />
        <WhyHomico onIntakeOpen={openIntake} />
      </main>

      <LandingFooter onIntakeOpen={openIntake} />
      <MobileStickyBar onIntakeOpen={openIntake} />

      <ConciergeIntakeModal isOpen={intakeOpen} onClose={closeIntake} />
    </div>
  );
}
