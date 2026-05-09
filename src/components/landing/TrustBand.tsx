"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Shield, Star } from "lucide-react";

import { AnimatedSection } from "./_internal";

export default function TrustBand() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Shield,
      title: t("landing.trustPillar1Title"),
      desc: t("landing.trustPillar1Desc"),
    },
    {
      icon: Star,
      title: t("landing.trustPillar2Title"),
      desc: t("landing.trustPillar2Desc"),
    },
    {
      icon: Check,
      title: t("landing.trustPillar3Title"),
      desc: t("landing.trustPillar3Desc"),
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 lg:py-28 bg-[var(--hm-n-900)] overflow-hidden">
      {/* Subtle dotted texture for depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Vermillion glow top-right for warmth on the dark band */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full opacity-[0.18] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--hm-brand-500) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Pull quote — vermillion big quote mark + serif italic copy.
            Reads as a brand promise, not a generic testimonial. */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.18em] uppercase text-[var(--hm-brand-300)] mb-4">
            {t("landing.trustBandEyebrow")}
          </span>
          <span
            aria-hidden
            className="block font-serif text-[64px] sm:text-[80px] leading-none text-[var(--hm-brand-500)] mb-2"
          >
            &ldquo;
          </span>
          <p className="text-[20px] sm:text-[26px] lg:text-[30px] font-serif font-medium text-white leading-[1.25] tracking-[-0.01em] -mt-6 sm:-mt-8">
            {t("landing.conciergePromise")}
          </p>
          <p className="mt-5 text-[11px] sm:text-[12px] font-mono uppercase tracking-[0.2em] text-[var(--hm-fg-muted)]">
            — {t("landing.conciergePromiseAttribution")}
          </p>
        </AnimatedSection>

        {/* Three pillars — supporting evidence under the promise */}
        <AnimatedSection delay={150}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 max-w-4xl mx-auto">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="flex sm:flex-col items-start gap-3 sm:gap-3 text-left"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--hm-brand-500) 20%, transparent)",
                    }}
                  >
                    <Icon
                      className="w-[18px] h-[18px] text-[var(--hm-brand-300)]"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] sm:text-[15px] font-semibold text-white leading-snug">
                      {p.title}
                    </p>
                    <p className="mt-1 text-[12px] sm:text-[13px] text-white/65 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
