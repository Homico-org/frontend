"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import CategoryGrid from "@/components/landing/CategoryGrid";
import ClientCta from "@/components/landing/ClientCta";
import ConciergeIntakeModal from "@/components/landing/ConciergeIntakeModal";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFooterCta from "@/components/landing/LandingFooterCta";
import LandingHero from "@/components/landing/LandingHero";
import MobileStickyBar from "@/components/landing/MobileStickyBar";
import TrustBand from "@/components/landing/TrustBand";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCallback, useEffect, useState } from "react";

// Schema.org LocalBusiness JSON-LD for SEO. Helps search engines understand
// Homico as a Tbilisi-based home services platform.
const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Homico",
  description:
    "Find vetted home renovation pros in Tbilisi — clear quotes, real reviews, no chasing.",
  url: "https://homico.ge",
  image: "https://homico.ge/og-image.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tbilisi",
    addressCountry: "GE",
  },
  areaServed: {
    "@type": "City",
    name: "Tbilisi",
  },
  priceRange: "Free",
} as const;

export default function HomePage() {
  const { isLoading } = useAuth();
  const { trackEvent } = useAnalytics();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const openIntake = useCallback(() => {
    trackEvent(AnalyticsEvent.LANDING_ASSISTANT_CLICK);
    setIntakeOpen(true);
  }, [trackEvent]);
  const closeIntake = useCallback(() => setIntakeOpen(false), []);

  // Concierge-MVP: everyone sees the landing. Pros/admins navigate to their
  // workspace via the header — no auto-redirect off `/`.
  useEffect(() => {
    if (!isLoading) trackEvent(AnalyticsEvent.LANDING_VIEW);
  }, [isLoading, trackEvent]);

  // Avoid flash while auth resolves.
  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] overflow-x-hidden">
      {/* Schema.org LocalBusiness — improves search-engine understanding */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(LOCAL_BUSINESS_JSONLD),
        }}
      />

      <Header />
      <HeaderSpacer />

      <main>
        <LandingHero onIntakeOpen={openIntake} />
        <HowItWorks />
        <CategoryGrid onIntakeOpen={openIntake} />
        <TrustBand />
        <ClientCta onIntakeOpen={openIntake} />
        <LandingFooterCta onIntakeOpen={openIntake} />
      </main>

      <LandingFooter onIntakeOpen={openIntake} />
      <MobileStickyBar onIntakeOpen={openIntake} />

      <ConciergeIntakeModal isOpen={intakeOpen} onClose={closeIntake} />
    </div>
  );
}
