'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserTypeSelector from '@/components/register/UserTypeSelector';
import LanguageSelector from '@/components/common/LanguageSelector';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/hooks/useTracker';
import { HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Logo component
function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span className="flex items-center gap-2">
        <Image src="/favicon.png" alt="Homico" width={28} height={28} className="h-7 w-7 rounded-[8px]" />
        <span className="text-[18px] font-semibold tracking-wide text-neutral-900 dark:text-white">
          Homico
        </span>
      </span>
    </Link>
  );
}

function RegisterContent() {
  const { t, locale } = useLanguage();
  const { openLoginModal } = useAuthModal();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'pro' && user.isProfileCompleted === true) {
        router.replace('/jobs');
      } else if (user.role === 'client') {
        router.replace('/portfolio');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9F7] via-[#FAF8F5] to-[#F5F0EC] flex flex-col">
      {/* Header - Mobile optimized */}
      <header className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="compact" />
          <Link
            href="/help"
            className="hidden sm:block text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            {t('common.help')}
          </Link>
          <Link
            href="/help"
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openLoginModal()}
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
          >
            {t('register.logIn')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        <div className="w-full max-w-3xl">
          {/* Title - Mobile optimized */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2">
              {t('register.joinHomico')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-500">
              {t('register.chooseHowYouWantTo')}
            </p>
          </div>

          <UserTypeSelector
            onSelect={(type) => {
              trackEvent('register_click', type);
              if (type === 'pro') {
                router.push('/register/professional');
              } else {
                router.push('/register/client');
              }
            }}
            locale={locale as 'en' | 'ka' | 'ru'}
          />
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <LoadingSpinner size="xl" variant="border" color="#C4735B" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
