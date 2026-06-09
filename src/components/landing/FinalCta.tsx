"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";

import { AnimatedSection } from "./_internal";

interface FinalCtaProps {
  onIntakeOpen: () => void;
}

/**
 * Closing CTA - modern product-landing treatment (v3).
 *
 * Sans-serif heading, single primary button, light brand tint. Mirrors
 * the v3 hero aesthetic so the page reads as one coherent design.
 *
 * Reuses landing.finalCtaTitle / finalCtaSubtitleConcierge /
 * concierge.requestQuote - zero new i18n.
 */
export default function FinalCta({ onIntakeOpen }: FinalCtaProps) {
  const { t } = useLanguage();

  return (
    <section
      className="py-20 sm:py-28"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--hm-brand-500) 4%, var(--hm-bg-page))",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <AnimatedSection>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.025em] leading-[1.1]">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-[var(--hm-fg-secondary)] leading-relaxed">
            {t("landing.finalCtaSubtitleConcierge")}
          </p>
          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              onClick={onIntakeOpen}
              className="px-7 inline-flex items-center gap-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t("concierge.requestQuote")}
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
