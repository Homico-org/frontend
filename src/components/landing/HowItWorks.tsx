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
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="max-w-xl mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
            {t("landing.conciergeFlowTitle")}
          </h2>
          <p className="mt-2 text-[14px] text-[var(--hm-fg-muted)]">
            {t("landing.conciergeFlowSubtitle")}
          </p>
        </AnimatedSection>

        <div className="relative grid sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Desktop-only dotted connector between step illustrations */}
          <div
            aria-hidden
            className="hidden sm:block absolute left-[16.67%] right-[16.67%] top-[52px] h-px"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--hm-border) 0, var(--hm-border) 6px, transparent 6px, transparent 12px)",
              backgroundSize: "12px 1px",
            }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.kicker} stagger index={i}>
                <GlassCard className="group relative rounded-2xl p-6 sm:p-7 h-full hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto sm:mx-0 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--hm-brand-500) 10%, transparent)",
                    }}
                  >
                    <Icon
                      className="w-9 h-9 text-[var(--hm-brand-500)]"
                      strokeWidth={1.5}
                    />
                    <span
                      className="absolute -bottom-1 -right-1 flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-bold tracking-wider"
                      style={{
                        backgroundColor: "var(--hm-bg-elevated)",
                        color: "var(--hm-brand-500)",
                        border: "1px solid var(--hm-border-subtle)",
                      }}
                    >
                      {step.kicker}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-medium text-[var(--hm-fg-primary)] mb-2 text-center sm:text-left">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[var(--hm-fg-secondary)] leading-relaxed text-center sm:text-left">
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
