"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import ConciergeIntakeModal from "@/components/landing/ConciergeIntakeModal";
import Header, { HeaderSpacer } from "@/components/common/Header";
import HomicoLogo from "@/components/common/HomicoLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Mail,
  MessageSquare,
  PhoneCall,
  Search,
  Sparkles,
  Shield,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Live activity names (Georgian names)
const ACTIVITY_NAMES = [
  "ნინო",
  "გიორგი",
  "მარიამი",
  "დათო",
  "ანა",
  "ლუკა",
  "თამარი",
  "ნიკა",
];

// ============ HOOKS ============

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);
  return offset;
}

function useMagneticButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.2, y: y * 0.2 });
  }, []);

  const handleMouseLeave = useCallback(() => setPosition({ x: 0, y: 0 }), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, position };
}

// ============ COMPONENTS ============

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  stagger = false,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  index?: number;
}) {
  const { ref, isInView } = useInView(0.1);
  const actualDelay = stagger ? delay + index * 80 : delay;
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${actualDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView(0.2);
  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <span
            className="inline-block transition-all duration-500 ease-out"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(100%)",
              transitionDelay: `${delay + i * 60}ms`,
            }}
          >
            {word}&nbsp;
          </span>
        </span>
      ))}
    </span>
  );
}

function LiveActivityFeed({ t }: { t: (key: string) => string }) {
  const [activity, setActivity] = useState({ name: "", action: "" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const actions = [
      `${t("landing.activityHired")} ${t("landing.activityDesigner")}`,
      t("landing.activityPosted"),
      t("landing.activityReceived"),
      t("landing.activityCompleted"),
      `${t("landing.activityHired")} ${t("landing.activityElectrician")}`,
      `${t("landing.activityHired")} ${t("landing.activityPlumber")}`,
    ];

    const showActivity = () => {
      const name =
        ACTIVITY_NAMES[Math.floor(Math.random() * ACTIVITY_NAMES.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setActivity({ name, action });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };
    showActivity();
    const interval = setInterval(showActivity, 8000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 left-4 z-40 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--hm-bg-elevated)]/90 backdrop-blur-xl rounded-full shadow-lg border border-[var(--hm-border-subtle)]/50">
        <div className="w-6 h-6 rounded-full bg-[var(--hm-success-500)] flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-[11px] text-[var(--hm-fg-secondary)]">
          <span className="font-semibold">{activity.name}</span>{" "}
          {activity.action}
        </p>
      </div>
    </div>
  );
}

function MobileStickyBar({
  t,
  onRequest,
}: {
  t: (key: string) => string;
  onRequest: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-all duration-300 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div
        className="backdrop-blur-xl border-t border-[var(--hm-border)] px-4 py-3 flex gap-2"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--hm-bg-elevated) 95%, transparent)",
        }}
      >
        <Button
          size="sm"
          onClick={onRequest}
          className="flex-1 h-10 text-[13px] bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white"
        >
          {t("concierge.requestQuote")}
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="flex-1 h-10 text-[13px]"
        >
          <Link href="/professionals">{t("landing.browsePros")}</Link>
        </Button>
      </div>
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Theme-aware glass: 70% elevated surface + subtle border so it works in
  // both light and dark. `color-mix` gives us per-token translucency without
  // Tailwind arbitrary-opacity gymnastics.
  return (
    <div
      className={`backdrop-blur-xl shadow-xl border border-[var(--hm-border-subtle)] ${className}`}
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--hm-bg-elevated) 70%, transparent)",
      }}
    >
      {children}
    </div>
  );
}

function MagneticButton({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const { ref, position } = useMagneticButton();
  return (
    <Link href={href}>
      <button
        ref={ref}
        className={`transition-transform duration-200 ease-out ${className}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {children}
      </button>
    </Link>
  );
}

// ============ MAIN COMPONENT ============

export default function HomePage() {
  const { isLoading } = useAuth();
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeCategory, setIntakeCategory] = useState<string | undefined>(
    undefined,
  );
  const openIntake = useCallback((): void => {
    setIntakeCategory(undefined);
    setIntakeOpen(true);
  }, []);
  const openIntakeWithCategory = useCallback((key: string): void => {
    setIntakeCategory(key);
    setIntakeOpen(true);
  }, []);
  const [mounted, setMounted] = useState(false);
  const parallaxOffset = useParallax(0.3);
  const parallaxOffsetSlow = useParallax(0.15);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Concierge-MVP: everyone sees the landing. Pros/admins can navigate
  // to their workspace via the header links — no auto-redirect off `/`.

  // Avoid flash while auth resolves.
  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-bg-page)] via-[var(--hm-bg-page)] to-[var(--hm-brand-50)]/50 animate-gradient" />
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(239,78,36,0.06),transparent_60%)] animate-pulse-slow"
          style={{ transform: `translateY(${parallaxOffsetSlow}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(251,191,36,0.04),transparent_60%)] animate-pulse-slow"
          style={{
            animationDelay: "2s",
            transform: `translateY(${-parallaxOffsetSlow}px)`,
          }}
        />
      </div>

      {/* Shared app header — consistent with the rest of the product. */}
      <Header />
      <HeaderSpacer />

      <main>
        {/* ========== HERO ========== */}
        <section className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left */}
              <div
                className="max-w-xl"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.8s ease-out",
                }}
              >
                {/* Headline with text reveal */}
                <h1 className="text-[28px] sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--hm-fg-primary)] leading-[1.15]">
                  <TextReveal text={t("landing.heroTitle")} delay={200} />
                  <span className="block text-[var(--hm-brand-500)] mt-0.5">
                    <TextReveal
                      text={t("landing.heroTitleAccent")}
                      delay={400}
                    />
                  </span>
                </h1>

                <p
                  className="mt-3 sm:mt-4 text-[13px] sm:text-[15px] text-[var(--hm-fg-secondary)] leading-relaxed max-w-md"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.8s ease-out 0.6s",
                  }}
                >
                  {t("landing.heroSubtitle")}
                </p>

                {/* CTAs */}
                <div
                  className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.6s ease-out 0.8s",
                  }}
                >
                  <Button
                    size="lg"
                    onClick={openIntake}
                    className="h-10 sm:h-11 px-5 text-[13px] sm:text-sm font-medium bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white shadow-lg shadow-[var(--hm-brand-500)]/25 hover:shadow-xl transition-all group"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("concierge.requestQuote")}
                    <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-10 sm:h-11 px-5 text-[13px] sm:text-sm border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 hover:bg-[var(--hm-brand-500)]/5 backdrop-blur-sm"
                  >
                    <Link
                      href="/professionals"
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {t("landing.browsePros")}
                    </Link>
                  </Button>
                </div>

                {/* Trust badges */}
                <div
                  className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: "opacity 0.6s ease-out 1s",
                  }}
                >
                  {[
                    { icon: CheckCircle2, text: t("landing.trustVerified") },
                    { icon: Shield, text: t("landing.trustSecure") },
                    { icon: Clock, text: t("landing.trustFast") },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-[11px] text-[var(--hm-fg-muted)]"
                    >
                      <item.icon className="w-3.5 h-3.5 text-[var(--hm-success-500)]" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Hero Visual with Parallax */}
              <div
                className="relative hidden lg:block"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted
                    ? `translateY(${parallaxOffset * 0.3}px)`
                    : "translateY(40px)",
                  transition: "opacity 1s ease-out 0.3s",
                }}
              >
                <div className="absolute -top-8 -right-8 w-56 h-56 bg-[var(--hm-brand-500)]/10 rounded-full blur-3xl animate-pulse-slow" />
                <div
                  className="absolute -bottom-8 -left-8 w-40 h-40 bg-[var(--hm-brand-300)]/15 rounded-full blur-2xl animate-pulse-slow"
                  style={{ animationDelay: "1s" }}
                />

                <GlassCard className="relative rounded-2xl p-4">
                  {/* Floating cards with parallax */}
                  <div
                    className="absolute -top-4 -left-4 z-10 animate-float"
                    style={{
                      transform: `translateY(${parallaxOffset * 0.5}px)`,
                    }}
                  >
                    <GlassCard className="px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--hm-success-500)]/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-[var(--hm-success-500)]" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[var(--hm-fg-primary)]">
                            100+
                          </p>
                          <p className="text-[10px] text-[var(--hm-fg-muted)] -mt-0.5">
                            {t("landing.statsPros")}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* PNG poster shows instantly (and as a graceful fallback
                        if the MP4 is missing); video autoplays muted on loop
                        per mobile-browser autoplay policies. */}
                    <video
                      src="/landing/6474138-uhd_2160_3840_25fps.mp4"
                      poster="/landing/video-artchitecture.png"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </GlassCard>
              </div>
            </div>

          </div>
        </section>

        {/* ========== HOW THE CONCIERGE WORKS ========== */}
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
              {/* Desktop-only connector line between the step illustrations. */}
              <div
                aria-hidden
                className="hidden sm:block absolute left-[16.67%] right-[16.67%] top-[52px] h-px"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--hm-border) 0, var(--hm-border) 6px, transparent 6px, transparent 12px)",
                  backgroundSize: "12px 1px",
                }}
              />

              {[
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
              ].map((step, i) => {
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

        {/* ========== CATEGORIES ========== */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="max-w-xl mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
                {t("landing.categoriesTitle")}
              </h2>
              <p className="mt-2 text-[14px] text-[var(--hm-fg-muted)]">
                {t("landing.categoriesTapHint")}
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {categories.slice(0, 4).map((cat, i) => (
                <AnimatedSection key={cat.key} stagger index={i}>
                  <button
                    type="button"
                    onClick={() => openIntakeWithCategory(cat.key)}
                    className="w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 rounded-2xl"
                  >
                    <GlassCard className="group relative h-full flex flex-col gap-3 p-5 rounded-2xl hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--hm-brand-500) 10%, transparent)",
                        }}
                      >
                        <CategoryIcon
                          type={cat.icon || cat.key}
                          className="w-6 h-6 text-[var(--hm-brand-500)]"
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                          {pick({ en: cat.name, ka: cat.nameKa })}
                        </span>
                        <ArrowRight
                          className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                          strokeWidth={1.75}
                        />
                      </div>
                    </GlassCard>
                  </button>
                </AnimatedSection>
              ))}

              {/* "All services" escape hatch for needs outside the top 4 */}
              <AnimatedSection stagger index={4}>
                <button
                  type="button"
                  onClick={openIntake}
                  className="w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 rounded-2xl"
                >
                  <div
                    className="group relative h-full flex flex-col gap-3 p-5 rounded-2xl border-2 border-dashed hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                    style={{ borderColor: "var(--hm-border)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--hm-brand-500) 6%, transparent)",
                      }}
                    >
                      <Sparkles
                        className="w-6 h-6 text-[var(--hm-brand-500)]"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                        {t("landing.categoriesAllServices")}
                      </span>
                      <ArrowRight
                        className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                </button>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ========== TRUST BAND ========== */}
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
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    value: "100+",
                    label: t("landing.statsActivePros"),
                    accent: false,
                  },
                  {
                    value: "14",
                    label: t("landing.statsCategories"),
                    accent: true,
                  },
                  {
                    value: "0 ₾",
                    label: t("landing.statsFree"),
                    accent: false,
                  },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p
                      className={`text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums ${
                        s.accent
                          ? "text-[var(--hm-brand-500)]"
                          : "text-white"
                      }`}
                    >
                      {s.value}
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs text-[var(--hm-fg-muted)]">
                      {s.label}
                    </p>
                  </div>
                ))}
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

        {/* ========== CLIENT CTA ========== */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <AnimatedSection>
              <GlassCard className="rounded-2xl p-6 sm:p-10 hover:border-[var(--hm-brand-500)]/30 transition-all duration-500 hover:shadow-xl">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--hm-brand-500) 10%, transparent)",
                  }}
                >
                  <Briefcase
                    className="w-6 h-6 text-[var(--hm-brand-500)]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
                  {t("landing.clientCtaTitle")}
                </h3>
                <p className="mt-2 text-[14px] sm:text-[15px] text-[var(--hm-fg-secondary)] leading-relaxed">
                  {t("landing.clientsDesc")}
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    t("landing.clientBenefitHigh1"),
                    t("landing.clientBenefitHigh2"),
                    t("landing.clientBenefitHigh3"),
                  ].map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[14px] text-[var(--hm-fg-primary)] leading-relaxed"
                    >
                      <span
                        className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full mt-0.5"
                        style={{
                          backgroundColor: "var(--hm-brand-500)",
                        }}
                      >
                        <Check
                          className="w-3 h-3 text-white"
                          strokeWidth={3}
                        />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex items-center gap-3">
                  <Button
                    size="lg"
                    onClick={openIntake}
                    className="h-11 px-6 text-[14px] font-semibold bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white inline-flex items-center gap-2 group/btn"
                  >
                    {t("concierge.requestQuote")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                  <span className="text-[12px] text-[var(--hm-fg-muted)]">
                    {t("landing.clientCtaTrailing")}
                  </span>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>
        </section>

        {/* ========== FOOTER CTA ========== */}
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
                  onClick={openIntake}
                  className="h-10 sm:h-11 px-6 text-[13px] font-semibold bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] shadow-lg flex items-center justify-center"
                >
                  {t("concierge.requestQuote")}
                </Button>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[var(--hm-n-900)] border-t border-[var(--hm-n-800)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
            {/* Brand + tagline */}
            <div className="md:col-span-5">
              <Link href="/" className="inline-flex items-center gap-2">
                <HomicoLogo variant="reverse" size={28} className="h-7 w-7" />
                <span className="font-serif text-lg font-medium text-white">
                  Homico
                </span>
              </Link>
              <p className="mt-3 text-[13px] text-[var(--hm-fg-muted)] leading-relaxed max-w-sm">
                {t("landing.footerTagline")}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a
                  href="mailto:info@homico.ge"
                  className="inline-flex items-center gap-2 text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={1.75} />
                  info@homico.ge
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
                {t("landing.footerProduct")}
              </p>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={openIntake}
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("concierge.requestQuote")}
                  </button>
                </li>
                <li>
                  <Link
                    href="/professionals"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("landing.browsePros")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("about.howItWorks")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
                {t("landing.footerCompany")}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("footer.aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("footer.helpCenter")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
                {t("landing.footerLegal")}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("footer.privacyPolicy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-[var(--hm-n-800)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-[var(--hm-fg-muted)]">
              © {new Date().getFullYear()} {t("landing.footerCopyright")}.{" "}
              {t("landing.footerAllRights")}
            </p>
            <p className="text-[11px] text-[var(--hm-fg-muted)]">
              {t("about.tbilisiGeorgia")}
            </p>
          </div>
        </div>
      </footer>

      {/* Live activity feed */}
      <LiveActivityFeed t={t} />

      {/* Mobile sticky CTA */}
      <MobileStickyBar t={t} onRequest={openIntake} />

      {/* Concierge intake */}
      <ConciergeIntakeModal
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        initialCategory={intakeCategory}
      />


      {/* Global animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
