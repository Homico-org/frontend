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
    <section className="py-10 sm:py-12 lg:py-14 bg-[var(--hm-n-900)] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="flex sm:flex-col items-start gap-3 sm:gap-2 text-left"
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--hm-brand-500) 18%, transparent)",
                    }}
                  >
                    <Icon
                      className="w-4 h-4 text-[var(--hm-brand-300)]"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-[14px] sm:text-[15px] font-semibold text-white leading-snug">
                      {p.title}
                    </p>
                    <p className="mt-1 text-[12px] sm:text-[13px] text-[var(--hm-fg-muted)] leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection
          delay={200}
          className="mt-10 sm:mt-12 max-w-2xl mx-auto text-center"
        >
          <p className="text-sm sm:text-base lg:text-lg text-white/90 font-serif font-medium leading-relaxed">
            &ldquo;{t("landing.conciergePromise")}&rdquo;
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-wider text-[var(--hm-fg-muted)]">
            {t("landing.conciergePromiseAttribution")}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
