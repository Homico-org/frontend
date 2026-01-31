'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { api } from '@/lib/api';
import {
  Search,
  FileText,
  MessageSquare,
  UserCheck,
  Star,
  Shield,
  Clock,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Paintbrush,
  Wrench,
  Zap,
  Home,
  Hammer,
  Thermometer,
  Play,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MousePointer,
} from 'lucide-react';

// Categories - matching actual database structure
const TOP_CATEGORIES = [
  { slug: 'design', label: 'landing.catDesign', icon: Paintbrush },
  { slug: 'renovation', label: 'landing.catRenovation', icon: Hammer },
  { slug: 'architecture', label: 'landing.catArchitecture', icon: Home },
  { slug: 'services', label: 'landing.catServices', icon: Sparkles },
];

// Features
const FEATURE_FLOWS = [
  { id: 'post-job', icon: FileText, titleKey: 'landing.featurePostJob', descKey: 'landing.featurePostJobDesc', gifUrl: '/features/post-job.png', color: 'from-blue-500/10 to-indigo-500/10', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
  { id: 'browse-pros', icon: Search, titleKey: 'landing.featureBrowsePros', descKey: 'landing.featureBrowseProsDesc', gifUrl: '/features/browse-pros.png', color: 'from-emerald-500/10 to-teal-500/10', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
  { id: 'get-proposals', icon: MessageSquare, titleKey: 'landing.featureGetProposals', descKey: 'landing.featureGetProposalsDesc', gifUrl: '/features/get-proposals.png', color: 'from-amber-500/10 to-orange-500/10', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
  { id: 'hire-review', icon: UserCheck, titleKey: 'landing.featureHireReview', descKey: 'landing.featureHireReviewDesc', gifUrl: '/features/hire-review.png', color: 'from-purple-500/10 to-pink-500/10', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600' },
];

// Live activity names (Georgian names)
const ACTIVITY_NAMES = ['ნინო', 'გიორგი', 'მარიამი', 'დათო', 'ანა', 'ლუკა', 'თამარი', 'ნიკა'];

// ============ HOOKS ============

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView(0.3);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnView || !isInView || hasStarted.current) return;
    hasStarted.current = true;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration, startOnView]);

  return { count, ref };
}

function useParallax(speed = 0.5) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, position };
}

// ============ COMPONENTS ============

function AnimatedSection({ children, className = '', delay = 0, stagger = false, index = 0 }: { children: React.ReactNode; className?: string; delay?: number; stagger?: boolean; index?: number }) {
  const { ref, isInView } = useInView(0.1);
  const actualDelay = stagger ? delay + index * 80 : delay;
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: isInView ? 1 : 0, transform: isInView ? 'translateY(0)' : 'translateY(30px)', transitionDelay: `${actualDelay}ms` }}>
      {children}
    </div>
  );
}

function TextReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const { ref, isInView } = useInView(0.2);
  const words = text.split(' ');
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <span
            className="inline-block transition-all duration-500 ease-out"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(100%)',
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
  const [activity, setActivity] = useState({ name: '', action: '' });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const actions = [
      `${t('landing.activityHired')} ${t('landing.activityDesigner')}`,
      t('landing.activityPosted'),
      t('landing.activityReceived'),
      t('landing.activityCompleted'),
      `${t('landing.activityHired')} ${t('landing.activityElectrician')}`,
      `${t('landing.activityHired')} ${t('landing.activityPlumber')}`,
    ];

    const showActivity = () => {
      const name = ACTIVITY_NAMES[Math.floor(Math.random() * ACTIVITY_NAMES.length)];
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
    <div className={`fixed bottom-20 sm:bottom-6 left-4 z-40 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-full shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold">{activity.name}</span> {activity.action}
        </p>
      </div>
    </div>
  );
}

function MobileStickyBar({ t }: { t: (key: string) => string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-all duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 flex gap-2">
        <Button asChild size="sm" className="flex-1 h-10 text-[13px] bg-[#C4735B] hover:bg-[#a85d47] text-white">
          <Link href="/post-job">{t('header.postAJob')}</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1 h-10 text-[13px]">
          <Link href="/browse/portfolio">{t('landing.browsePros')}</Link>
        </Button>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function MagneticButton({ children, className = '', href }: { children: React.ReactNode; className?: string; href: string }) {
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

function StatCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-[11px] sm:text-xs text-neutral-400">{label}</p>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t } = useLanguage();
  const { getSubcategoriesForCategory } = useCategories();
  const [activeFeature, setActiveFeature] = useState(0);
  const [gifErrors, setGifErrors] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ activePros: 0, projectsCompleted: 0, avgRating: 4.8, avgResponseTime: '<1' });
  const [featureSliderPaused, setFeatureSliderPaused] = useState(false);
  const parallaxOffset = useParallax(0.3);
  const parallaxOffsetSlow = useParallax(0.15);

  useEffect(() => { setMounted(true); }, []);

  // Fetch landing page stats from backend
  useEffect(() => {
    api.get('/public/stats')
      .then((res) => setStats(res.data))
      .catch(() => {
        // Fallback to defaults if API fails
        setStats({ activePros: 2500, projectsCompleted: 10000, avgRating: 4.8, avgResponseTime: '<1' });
      });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === 'pro') { router.replace('/browse/jobs'); return; }
    if (user) router.replace('/browse/portfolio');
  }, [router, user, isLoading]);

  // Auto-slide features - restarts fresh when pause state changes
  useEffect(() => {
    if (featureSliderPaused) return;
    const interval = setInterval(() => {
      setActiveFeature((p) => (p + 1) % FEATURE_FLOWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featureSliderPaused]);

  const handleGifError = (id: string) => setGifErrors((p) => ({ ...p, [id]: true }));

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-neutral-950 overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF8] via-[#FAFAF8] to-amber-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 animate-gradient" />
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(196,115,91,0.06),transparent_60%)] animate-pulse-slow"
          style={{ transform: `translateY(${parallaxOffsetSlow}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(251,191,36,0.04),transparent_60%)] animate-pulse-slow"
          style={{ animationDelay: '2s', transform: `translateY(${-parallaxOffsetSlow}px)` }}
        />
      </div>

      {/* ========== HEADER - Glassmorphism ========== */}
      <header className="sticky top-0 z-50">
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border-b border-white/20 dark:border-neutral-800/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <Image src="/favicon.png" alt="Homico" width={28} height={28}
                  className="h-7 w-7 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" priority />
                <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">Homico</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {[{ href: '/browse/portfolio', label: t('header.browse') }, { href: '/browse/jobs', label: t('browse.jobs') }].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="px-3 py-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openLoginModal()} className="hidden sm:inline-flex h-8 text-[13px]">
                  {t('auth.login')}
                </Button>
                <MagneticButton href="/register"
                  className="h-8 px-4 text-[13px] font-medium bg-[#C4735B] hover:bg-[#a85d47] text-white rounded-lg shadow-md shadow-[#C4735B]/20 hover:shadow-lg transition-shadow">
                  {t('header.signUp')}
                </MagneticButton>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* ========== HERO ========== */}
        <section className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left */}
              <div className="max-w-xl" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out' }}>
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C4735B]/10 border border-[#C4735B]/20 mb-4 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C4735B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C4735B]" />
                  </span>
                  <span className="text-[10px] font-semibold text-[#C4735B] uppercase tracking-wider">{t('landing.heroTag')}</span>
                </div>

                {/* Headline with text reveal */}
                <h1 className="text-[28px] sm:text-4xl lg:text-[44px] font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15]">
                  <TextReveal text={t('landing.heroTitle')} delay={200} />
                  <span className="block text-[#C4735B] mt-0.5">
                    <TextReveal text={t('landing.heroTitleAccent')} delay={400} />
                  </span>
                </h1>

                <p className="mt-3 sm:mt-4 text-[13px] sm:text-[15px] text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md"
                  style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease-out 0.6s' }}>
                  {t('landing.heroSubtitle')}
                </p>

                {/* CTAs */}
                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5"
                  style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease-out 0.8s' }}>
                  <MagneticButton href="/post-job"
                    className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 text-[13px] sm:text-sm font-medium bg-[#C4735B] hover:bg-[#a85d47] text-white rounded-xl shadow-lg shadow-[#C4735B]/25 hover:shadow-xl transition-all group">
                    <FileText className="w-4 h-4" />
                    {t('header.postAJob')}
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </MagneticButton>
                  <Button size="lg" variant="outline" asChild
                    className="h-10 sm:h-11 px-5 text-[13px] sm:text-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-[#C4735B]/40 hover:bg-[#C4735B]/5 backdrop-blur-sm">
                    <Link href="/browse/portfolio" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      {t('landing.browsePros')}
                    </Link>
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4"
                  style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease-out 1s' }}>
                  {[{ icon: CheckCircle2, text: t('landing.trustVerified') }, { icon: Shield, text: t('landing.trustSecure') }, { icon: Clock, text: t('landing.trustFast') }].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Hero Visual with Parallax */}
              <div className="relative hidden lg:block"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? `translateY(${parallaxOffset * 0.3}px)` : 'translateY(40px)', transition: 'opacity 1s ease-out 0.3s' }}>
                <div className="absolute -top-8 -right-8 w-56 h-56 bg-[#C4735B]/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-amber-300/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

                <GlassCard className="relative rounded-2xl p-4">
                  {/* Floating cards with parallax */}
                  <div className="absolute -top-4 -left-4 z-10 animate-float" style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}>
                    <GlassCard className="rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">2,500+</p>
                          <p className="text-[10px] text-neutral-500 -mt-0.5">{t('landing.statsPros')}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="absolute -bottom-4 -right-4 z-10 animate-float" style={{ animationDelay: '0.5s', transform: `translateY(${parallaxOffset * 0.3}px)` }}>
                    <GlassCard className="rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                          <Star className="w-4 h-4 text-[#C4735B]" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">4.8</p>
                          <p className="text-[10px] text-neutral-500 -mt-0.5">{t('landing.statsRating')}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <Image src="https://res.cloudinary.com/dakcvkodo/image/upload/w_800,h_600,c_fill,q_auto,f_auto/homico/avatars/pro-plumber.png"
                      alt="" fill className="object-cover transition-transform duration-700 hover:scale-105" priority sizes="50vw" />
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Scroll indicator */}
            <button onClick={scrollToContent}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-neutral-400 hover:text-[#C4735B] transition-colors cursor-pointer animate-bounce-slow">
              <MousePointer className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="py-10 sm:py-14 lg:py-16 relative">
          <div
            className="mx-4 sm:mx-6 lg:mx-auto max-w-6xl"
            onMouseEnter={() => setFeatureSliderPaused(true)}
            onMouseLeave={() => setFeatureSliderPaused(false)}
          >
            <GlassCard className="rounded-2xl sm:rounded-3xl border-neutral-200/30 dark:border-neutral-700/30">
            <div className="p-5 sm:p-8 lg:p-10">
              <AnimatedSection className="text-center max-w-lg mx-auto mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 dark:text-white">
                  {t('landing.featuresTitle')}
                </h2>
                <p className="mt-2 text-[13px] text-neutral-500">{t('landing.featuresSubtitle')}</p>
              </AnimatedSection>

              {/* Feature tabs */}
              <AnimatedSection delay={100} className="mb-6 sm:mb-8">
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {FEATURE_FLOWS.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <button key={feature.id} onClick={() => setActiveFeature(idx)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${activeFeature === idx
                          ? 'bg-[#C4735B] text-white shadow-md shadow-[#C4735B]/25 scale-105'
                          : 'bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/80'}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t(feature.titleKey)}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {FEATURE_FLOWS.map((_, idx) => (
                    <div key={idx} className="h-1 rounded-full transition-all duration-500 bg-neutral-200 dark:bg-neutral-700 overflow-hidden"
                      style={{ width: idx === activeFeature ? 24 : 6 }}>
                      {idx === activeFeature && <div className="h-full bg-[#C4735B] animate-progress" />}
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              {/* Feature content */}
              <AnimatedSection delay={200}>
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                  <div className="order-2 lg:order-1">
                    <div className={`relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br ${FEATURE_FLOWS[activeFeature].color} border border-neutral-200/30 transition-all duration-500`}>
                      {!gifErrors[FEATURE_FLOWS[activeFeature].id] ? (
                        <Image src={FEATURE_FLOWS[activeFeature].gifUrl} alt="" fill className="object-cover"
                          onError={() => handleGifError(FEATURE_FLOWS[activeFeature].id)} unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                          <div className={`w-14 h-14 rounded-xl ${FEATURE_FLOWS[activeFeature].iconBg} flex items-center justify-center mb-3`}>
                            <Play className={`w-7 h-7 ${FEATURE_FLOWS[activeFeature].iconColor}`} />
                          </div>
                          <p className="text-xs font-medium">{t('landing.gifPlaceholder')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="order-1 lg:order-2">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${FEATURE_FLOWS[activeFeature].iconBg} flex items-center justify-center transition-all`}>
                        {(() => { const Icon = FEATURE_FLOWS[activeFeature].icon; return <Icon className={`w-5 h-5 ${FEATURE_FLOWS[activeFeature].iconColor}`} />; })()}
                      </div>
                      <span className="text-[11px] font-semibold text-[#C4735B] uppercase tracking-wider">{t('landing.featureStep')} {activeFeature + 1}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t(FEATURE_FLOWS[activeFeature].titleKey)}</h3>
                    <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">{t(FEATURE_FLOWS[activeFeature].descKey)}</p>
                    <MagneticButton href={
                        activeFeature === 0 ? '/post-job' :
                        activeFeature === 1 ? '/browse/professionals' :
                        activeFeature === 2 ? '/browse/portfolio' :
                        '/register'
                      }
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium bg-[#C4735B] hover:bg-[#a85d47] text-white rounded-lg group">
                      {t('landing.tryItNow')}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </MagneticButton>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </GlassCard>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="max-w-lg mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 dark:text-white">{t('howItWorks.title')}</h2>
              <p className="mt-1.5 text-[13px] text-neutral-500">{t('howItWorks.subtitle')}</p>
            </AnimatedSection>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { num: 1, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
                { num: 2, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
                { num: 3, title: t('landing.step3Title'), desc: t('landing.step3Desc') },
              ].map((step, i) => (
                <AnimatedSection key={i} stagger index={i}>
                  <GlassCard className="group relative rounded-xl p-4 sm:p-5 hover:border-[#C4735B]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="w-9 h-9 rounded-lg bg-[#C4735B]/10 flex items-center justify-center mb-3 group-hover:bg-[#C4735B] group-hover:scale-110 transition-all">
                      <span className="text-sm font-bold text-[#C4735B] group-hover:text-white">{step.num}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white mb-1.5">{step.title}</h3>
                    <p className="text-[12px] text-neutral-500 leading-relaxed">{step.desc}</p>
                  </GlassCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CATEGORIES ========== */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <AnimatedSection className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 dark:text-white">{t('landing.categoriesTitle')}</h2>
                <p className="mt-1 text-[13px] text-neutral-500">{t('landing.categoriesSubtitle')}</p>
              </div>
              <Link href="/browse/portfolio" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#C4735B] hover:text-[#a85d47] group">
                {t('common.viewAll')}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </AnimatedSection>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TOP_CATEGORIES.map((cat, i) => {
                const Icon = cat.icon;
                const subcats = getSubcategoriesForCategory(cat.slug);
                const subcatKeys = subcats.map(s => s.key).join(',');
                const href = subcatKeys
                  ? `/browse/portfolio?category=${cat.slug}&subcategories=${subcatKeys}`
                  : `/browse/portfolio?category=${cat.slug}`;
                return (
                  <AnimatedSection key={cat.slug} stagger index={i}>
                    <Link href={href}>
                      <GlassCard className="group flex items-center gap-3 rounded-xl p-3 hover:border-[#C4735B]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-neutral-100/80 dark:bg-neutral-700/50 flex items-center justify-center group-hover:bg-[#C4735B]/10 transition-colors">
                          <Icon className="w-4 h-4 text-neutral-500 group-hover:text-[#C4735B] transition-colors" />
                        </div>
                        <span className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-[#C4735B] transition-colors">{t(cat.label)}</span>
                      </GlassCard>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========== STATS with Animated Counters ========== */}
        <section className="py-10 sm:py-12 lg:py-14 bg-neutral-900 dark:bg-neutral-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <AnimatedSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <StatCounter value={stats.activePros || 2500} suffix="+" label={t('landing.statsActivePros')} />
                <StatCounter value={stats.projectsCompleted || 10000} suffix="+" label={t('landing.statsProjectsCompleted')} />
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#C4735B]">{stats.avgRating || 4.8}</p>
                  <p className="mt-1 text-[11px] sm:text-xs text-neutral-400">{t('landing.statsAvgRating')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{stats.avgResponseTime || '<1'}h</p>
                  <p className="mt-1 text-[11px] sm:text-xs text-neutral-400">{t('landing.statsAvgResponse')}</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200} className="mt-10 sm:mt-12 max-w-2xl mx-auto text-center">
              <blockquote className="text-sm sm:text-base lg:text-lg text-white/90 font-medium leading-relaxed">
                &ldquo;{t('landing.testimonialQuote')}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center justify-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#C4735B]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#C4735B]">N</span>
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-white">{t('landing.testimonialName')}</p>
                  <p className="text-[11px] text-neutral-400">{t('landing.testimonialRole')}</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ========== DUAL CTA ========== */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatedSection>
                <GlassCard className="group rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:border-[#C4735B]/30 transition-all duration-500 hover:shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 flex items-center justify-center mb-4">
                    <Briefcase className="w-5 h-5 text-[#C4735B]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">{t('howItWorks.forClients')}</h3>
                  <p className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed">{t('landing.clientsDesc')}</p>
                  <ul className="mt-4 space-y-2">
                    {[t('landing.clientBenefit1'), t('landing.clientBenefit2'), t('landing.clientBenefit3')].map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                  <MagneticButton href="/post-job" className="mt-5 w-full h-9 text-[12px] font-medium bg-[#C4735B] hover:bg-[#a85d47] text-white rounded-lg flex items-center justify-center gap-1.5 group/btn">
                    {t('header.postAJob')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </MagneticButton>
                </GlassCard>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <div className="group rounded-xl sm:rounded-2xl p-5 sm:p-6 bg-neutral-900 dark:bg-neutral-800 border border-neutral-800 dark:border-neutral-700 hover:border-[#C4735B]/30 transition-all duration-500 hover:shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-[#C4735B]/20 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-[#C4735B]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{t('howItWorks.forProfessionals')}</h3>
                  <p className="mt-1.5 text-[12px] text-neutral-400 leading-relaxed">{t('landing.prosDesc')}</p>
                  <ul className="mt-4 space-y-2">
                    {[t('landing.proBenefit1'), t('landing.proBenefit2'), t('landing.proBenefit3')].map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C4735B] flex-shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                  <MagneticButton href="/register?type=pro"
                    className="mt-5 w-full h-9 text-[12px] font-medium border border-[#C4735B] text-[#C4735B] hover:bg-[#C4735B] hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors group/btn">
                    {t('howItWorks.registerAsPro')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </MagneticButton>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ========== FOOTER CTA ========== */}
        <AnimatedSection>
          <section className="py-10 sm:py-12 bg-gradient-to-r from-[#C4735B] to-[#a85d47] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{t('landing.finalCtaTitle')}</h2>
              <p className="mt-2 text-[13px] text-white/80 max-w-lg mx-auto">{t('landing.finalCtaSubtitle')}</p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2.5 justify-center">
                <MagneticButton href="/register" className="h-10 sm:h-11 px-6 text-[13px] font-semibold bg-white text-[#C4735B] hover:bg-neutral-100 rounded-xl shadow-lg flex items-center justify-center">
                  {t('register.joinHomico')}
                </MagneticButton>
                <Button size="lg" variant="outline" asChild className="h-10 sm:h-11 px-6 text-[13px] border-white/30 text-white hover:bg-white/10">
                  <Link href="/browse/portfolio">{t('header.browse')}</Link>
                </Button>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-neutral-900 dark:bg-neutral-950 py-6 sm:py-8 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/favicon.png" alt="Homico" width={24} height={24} className="h-6 w-6 rounded-md" />
              <span className="text-sm font-bold text-white">Homico</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
              <Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link>
              <Link href="/help" className="hover:text-white transition-colors">{t('footer.helpCenter')}</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
            </div>
            <p className="text-[11px] text-neutral-500">© {new Date().getFullYear()} {t('landing.footerCopyright')}. {t('landing.footerAllRights')}</p>
          </div>
        </div>
      </footer>

      {/* Live activity feed */}
      <LiveActivityFeed t={t} />

      {/* Mobile sticky CTA */}
      <MobileStickyBar t={t} />

      {/* Global animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-6px) translateX(-50%); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress { animation: progress 5s linear forwards; }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
