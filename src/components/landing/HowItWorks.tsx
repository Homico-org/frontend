"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, ClipboardList, PhoneCall } from "lucide-react";

import { AnimatedSection, GlassCard } from "./_internal";

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: ClipboardList,
      kicker: "01",
      title: t("landing.conciergeStep1Title"),
      desc: t("landing.conciergeStep1Desc"),
    },
    {
      icon: PhoneCall,
      kicker: "02",
      title: t("landing.conciergeStep2Title"),
      desc: t("landing.conciergeStep2Desc"),
    },
    {
      icon: CheckCircle2,
      kicker: "03",
      title: t("landing.conciergeStep3Title"),
      desc: t("landing.conciergeStep3Desc"),
    },
  ];

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="max-w-xl mb-10 sm:mb-14">
          {/* Eyebrow — small uppercase tracking-wider label gives the heading
              a confident, editorial start. */}
          <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.18em] uppercase text-[var(--hm-brand-500)] mb-3">
            {t("landing.howItWorksEyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-[-0.01em] leading-[1.1]">
            {t("landing.conciergeFlowTitle")}
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-[var(--hm-fg-muted)] leading-relaxed">
            {t("landing.conciergeFlowSubtitle")}
          </p>
        </AnimatedSection>

        <div className="relative grid sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Desktop-only connector — dotted line behind the step cards
              telegraphs sequence without an explicit arrow. */}
          <div
            aria-hidden
            className="hidden sm:block absolute left-[16.67%] right-[16.67%] top-[44px] h-px"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--hm-border) 0, var(--hm-border) 6px, transparent 6px, transparent 14px)",
              backgroundSize: "14px 1px",
            }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.kicker} stagger index={i}>
                <GlassCard className="group relative rounded-2xl p-6 sm:p-7 h-full hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Step number — display-type Fraunces serif anchored top-left,
                      vermillion. Reads as a deliberate ordinal, not a badge. */}
                  <span
                    className="block font-serif text-[34px] sm:text-[40px] font-semibold leading-none tracking-tight text-[var(--hm-brand-500)] mb-3"
                    aria-hidden="true"
                  >
                    {step.kicker}
                  </span>

                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      className="w-5 h-5 text-[var(--hm-brand-500)] shrink-0"
                      strokeWidth={1.75}
                    />
                    <h3 className="text-[16px] sm:text-[17px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-[13px] sm:text-[14px] text-[var(--hm-fg-secondary)] leading-relaxed">
                    {step.desc}
                  </p>
                </GlassCard>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
