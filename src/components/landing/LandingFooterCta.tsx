"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";

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
      <section
        className="relative py-14 sm:py-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)",
        }}
      >
        {/* Layered dot texture for depth */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Soft inner glow top */}
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[480px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, white 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-serif font-medium text-white tracking-[-0.01em] leading-[1.15]">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-white/85 max-w-xl mx-auto leading-relaxed">
            {t("landing.finalCtaSubtitleConcierge")}
          </p>
          <div className="mt-7 sm:mt-8 flex justify-center">
            {/* White pill on vermillion ground — pops, doesn't blend.
                Inline arrow + group-hover translate gives the button a
                sense of forward motion. */}
            <button
              type="button"
              onClick={onIntakeOpen}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] text-[14px] sm:text-[15px] font-semibold shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
            >
              {t("concierge.requestQuote")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
