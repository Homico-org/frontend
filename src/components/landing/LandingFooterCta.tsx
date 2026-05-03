"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import { AnimatedSection } from "./_internal";

interface LandingFooterCtaProps {
  onIntakeOpen: () => void;
}

export default function LandingFooterCta({
  onIntakeOpen,
}: LandingFooterCtaProps) {
  const { t } = useLanguage();

  return (
    <AnimatedSection>
      <section className="py-10 sm:py-12 bg-gradient-to-r from-[var(--hm-brand-500)] to-[var(--hm-brand-600)] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="mt-2 text-[13px] text-white/80 max-w-lg mx-auto">
            {t("landing.finalCtaSubtitleConcierge")}
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              onClick={onIntakeOpen}
              className="h-10 sm:h-11 px-6 text-[13px] font-semibold bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] shadow-lg flex items-center justify-center"
            >
              {t("concierge.requestQuote")}
            </Button>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
