"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AnimatedSection } from "./_internal";

interface WhyHomicoProps {
  onIntakeOpen: () => void;
}

/**
 * "How Homico works" - Checkatrade-pattern two-row composition (v4):
 *   Top row    - 3 trust pillars (check + title + 1-line description).
 *   Bottom row - 3 action cards with photo + title + body + button:
 *     1. Request a quote (opens intake)
 *     2. Browse pros    (/professionals)
 *     3. Become a pro   (/become-pro)
 *
 * Reuses existing landing.trustPillar* keys plus 6 new action.* keys.
 * Replaces FinalCta - the third action card carries the "ready to
 * start" energy without a separate closing section.
 */
const ACTION_IMAGES = {
  quote: "/landing/kitchen.jpg",
  browse: "/landing/hero-worker.jpg",
  join: "/landing/became-pro.jpg",
};

export default function WhyHomico({ onIntakeOpen }: WhyHomicoProps) {
  const { t } = useLanguage();
  const cl = useCountryLink();

  const pillars = [
    {
      title: t("landing.trustPillar1Title"),
      body: t("landing.trustPillar1Desc"),
    },
    {
      title: t("landing.trustPillar2Title"),
      body: t("landing.trustPillar2Desc"),
    },
    {
      title: t("landing.trustPillar3Title"),
      body: t("landing.trustPillar3Desc"),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[var(--hm-bg-page)] border-t border-[var(--hm-border-subtle)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.025em] leading-[1.1]">
            {t("landing.conciergeFlowTitle")}
          </h2>
        </AnimatedSection>

        {/* Trust pillar row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 mb-14 sm:mb-20">
          {pillars.map((pillar, i) => (
            <AnimatedSection key={pillar.title} stagger index={i}>
              <div className="flex flex-col items-center text-center gap-3">
                <Check
                  className="w-6 h-6 text-[var(--hm-brand-500)]"
                  strokeWidth={3}
                />
                <h3 className="text-[17px] sm:text-[18px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.01em]">
                  {pillar.title}
                </h3>
                <p className="text-[14px] sm:text-[14.5px] text-[var(--hm-fg-secondary)] leading-relaxed max-w-[36ch]">
                  {pillar.body}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Action card row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1 - Request a quote (opens intake modal) */}
          <AnimatedSection stagger index={0}>
            <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/10] bg-[var(--hm-bg-tertiary)]">
                <Image
                  src={ACTION_IMAGES.quote}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.01em]">
                  {t("concierge.requestQuote")}
                </h3>
                <p className="text-[14px] text-[var(--hm-fg-secondary)] leading-relaxed flex-1">
                  {t("landing.actionQuoteBody")}
                </p>
                <Button
                  type="button"
                  onClick={onIntakeOpen}
                  className="mt-2 w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {t("concierge.requestQuote")}
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Card 2 - Browse professionals */}
          <AnimatedSection stagger index={1}>
            <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/10] bg-[var(--hm-bg-tertiary)]">
                <Image
                  src={ACTION_IMAGES.browse}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.01em]">
                  {t("landing.actionBrowseTitle")}
                </h3>
                <p className="text-[14px] text-[var(--hm-fg-secondary)] leading-relaxed flex-1">
                  {t("landing.actionBrowseBody")}
                </p>
                <Button
                  asChild
                  className="mt-2 w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  <Link href={cl("/professionals")}>
                    {t("landing.stickyBrowse")}
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Card 3 - Become a pro */}
          <AnimatedSection stagger index={2}>
            <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/10] bg-[var(--hm-bg-tertiary)]">
                <Image
                  src={ACTION_IMAGES.join}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--hm-fg-primary)] tracking-[-0.01em]">
                  {t("landing.actionJoinTitle")}
                </h3>
                <p className="text-[14px] text-[var(--hm-fg-secondary)] leading-relaxed flex-1">
                  {t("landing.actionJoinBody")}
                </p>
                <Button
                  asChild
                  className="mt-2 w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  <Link href={cl("/become-pro")}>
                    {t("landing.actionJoinButton")}
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
