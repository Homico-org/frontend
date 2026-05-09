"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, Briefcase, Check } from "lucide-react";

import { AnimatedSection, GlassCard } from "./_internal";

interface ClientCtaProps {
  onIntakeOpen: () => void;
}

export default function ClientCta({ onIntakeOpen }: ClientCtaProps) {
  const { t } = useLanguage();

  const benefits = [
    t("landing.clientBenefitHigh1"),
    t("landing.clientBenefitHigh2"),
    t("landing.clientBenefitHigh3"),
  ];

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimatedSection>
          <GlassCard
            className="relative rounded-3xl p-6 sm:p-10 hover:-translate-y-0.5 transition-all duration-500 overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in srgb, var(--hm-brand-500) 6%, var(--hm-bg-elevated)) 0%, var(--hm-bg-elevated) 60%)",
              borderColor: "color-mix(in srgb, var(--hm-brand-500) 20%, transparent)",
            }}
          >
            {/* Decorative vermillion glow top-right */}
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-[280px] h-[280px] rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, var(--hm-brand-500) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                backgroundColor: "var(--hm-brand-500)",
              }}
            >
              <Briefcase
                className="w-6 h-6 text-white"
                strokeWidth={2}
              />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-[-0.01em] leading-[1.15]">
              {t("landing.clientCtaTitle")}
            </h3>
            <p className="mt-2 text-[14px] sm:text-[15px] text-[var(--hm-fg-secondary)] leading-relaxed">
              {t("landing.clientsDesc")}
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[14px] text-[var(--hm-fg-primary)] leading-relaxed"
                >
                  <span
                    className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full mt-0.5"
                    style={{ backgroundColor: "var(--hm-brand-500)" }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex items-center gap-3">
              <Button
                size="lg"
                onClick={onIntakeOpen}
                className="inline-flex items-center gap-2 group/btn"
              >
                {t("concierge.requestQuote")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
              <span className="text-[12px] text-[var(--hm-fg-muted)]">
                {t("landing.clientCtaTrailing")}
              </span>
            </div>
            </div>
          </GlassCard>
        </AnimatedSection>
      </div>
    </section>
  );
}
