'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HomicoLogo from '@/components/common/HomicoLogo';
import LanguageSelector from '@/components/common/LanguageSelector';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/hooks/useTracker';
import { ArrowRight, Briefcase, CheckCircle2, Search, Shield, Star, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

function RegisterContent() {
  const { t, locale } = useLanguage();
  const { openLoginModal } = useAuthModal();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  const isKa = locale === 'ka';
  const pick = (en: string, ka: string) => isKa ? ka : en;

  useEffect(() => { setIsVisible(true); }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'pro') router.replace('/my-space');
      else if (user.role === 'client') router.replace('/professionals');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
        <LoadingSpinner size="xl" variant="border" color="var(--hm-brand-500)" />
      </div>
    );
  }

  const features = [
    { icon: <Shield className="w-4 h-4" />, text: pick('Verified professionals', 'ვერიფიცირებული სპეციალისტები') },
    { icon: <Star className="w-4 h-4" />, text: pick('Real reviews', 'რეალური შეფასებები') },
    { icon: <Users className="w-4 h-4" />, text: pick('200+ professionals', '200+ სპეციალისტი') },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <HomicoLogo size={28} className="h-7 w-7" />
          <span className="text-[18px] font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>Homico</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <Button variant="outline" size="sm" onClick={() => openLoginModal()}>
            {pick('Log In', 'შესვლა')}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <div
            className={`text-center mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="mx-auto mb-4 flex items-center justify-center">
              <HomicoLogo size={56} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--hm-fg-primary)' }}>
              {pick('Welcome to Homico', 'კეთილი იყოს შენი მობრძანება')}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--hm-fg-secondary)' }}>
              {pick('How do you want to use Homico?', 'როგორ გსურს Homico-ს გამოყენება?')}
            </p>
          </div>

          {/* Cards */}
          <div
            className={`space-y-3 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {/* Client card */}
            <button
              onClick={() => { trackEvent('register_click', 'client'); router.push('/register/client'); }}
              className="w-full group flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all hover:shadow-md active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--hm-bg-elevated)',
                border: '1px solid var(--hm-border-subtle)',
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--hm-info-50)]/20 flex items-center justify-center shrink-0">
                <Search className="w-6 h-6 text-[var(--hm-info-500)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold mb-0.5" style={{ color: 'var(--hm-fg-primary)' }}>
                  {pick('I need a professional', 'მჭირდება სპეციალისტი')}
                </h3>
                <p className="text-xs" style={{ color: 'var(--hm-fg-secondary)' }}>
                  {pick('Find and hire verified home service pros', 'იპოვე და დაიქირავე ვერიფიცირებული სპეციალისტი')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Pro card */}
            <button
              onClick={() => { trackEvent('register_click', 'pro'); router.push('/register/professional'); }}
              className="w-full group flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all hover:shadow-md active:scale-[0.99]"
              style={{
                backgroundColor: 'rgba(239,78,36,0.06)',
                border: '1px solid rgba(239,78,36,0.2)',
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--hm-brand-500)]/15 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-[var(--hm-brand-500)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold mb-0.5" style={{ color: 'var(--hm-fg-primary)' }}>
                  {pick('I am a professional', 'ვარ სპეციალისტი')}
                </h3>
                <p className="text-xs" style={{ color: 'var(--hm-fg-secondary)' }}>
                  {pick('Join our network, find clients, grow your business', 'შემოგვიერთდი, იპოვე კლიენტები, გაზარდე შემოსავალი')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Trust signals */}
          <div
            className={`flex items-center justify-center gap-4 sm:gap-6 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs" style={{ color: 'var(--hm-fg-muted)' }}>
                <span className="text-[var(--hm-success-500)]">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-6 px-4">
        <p className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
          {pick('Already have an account?', 'უკვე გაქვს ანგარიში?')}{' '}
          <button onClick={() => openLoginModal()} className="font-medium text-[var(--hm-brand-500)] hover:underline">
            {pick('Log in', 'შესვლა')}
          </button>
        </p>
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
          <LoadingSpinner size="xl" variant="border" color="var(--hm-brand-500)" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
