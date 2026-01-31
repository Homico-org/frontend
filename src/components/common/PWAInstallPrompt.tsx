'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Download, Share, Plus, MoreVertical, X, Smartphone, CheckCircle2, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_DURATION_HOURS = 24; // Show again after 24 hours if dismissed
const STORAGE_KEY = 'pwa_install_dismissed';

const translations = {
  en: {
    title: 'Install Homico App',
    subtitle: 'Get the best experience with our app',
    benefit1: 'Faster loading & offline access',
    benefit2: 'Push notifications for new jobs',
    benefit3: 'Full-screen experience',
    installButton: 'Install App',
    iosTitle: 'Add to Home Screen',
    iosStep1: 'Tap the Share button below',
    iosStep2: 'Scroll and tap "Add to Home Screen"',
    iosStep3: 'Tap "Add" to install',
    iosTapHere: 'Tap here',
    iosLookForThis: 'Look for this icon',
    androidTitle: 'Install from browser',
    androidStep1: 'Tap the menu button',
    androidStep2: 'Select "Add to Home Screen"',
    androidStep3: 'Tap "Add" to confirm',
    continueAnyway: 'Continue in browser',
    alreadyInstalled: 'Already installed? Open the app',
  },
  ka: {
    title: 'დააინსტალირე Homico აპი',
    subtitle: 'მიიღე საუკეთესო გამოცდილება ჩვენი აპით',
    benefit1: 'სწრაფი ჩატვირთვა და ოფლაინ წვდომა',
    benefit2: 'შეტყობინებები ახალი სამუშაოების შესახებ',
    benefit3: 'სრულეკრანიანი გამოცდილება',
    installButton: 'დააინსტალირე',
    iosTitle: 'დაამატე მთავარ ეკრანზე',
    iosStep1: 'დააჭირე გაზიარების ღილაკს ქვემოთ',
    iosStep2: 'აირჩიე "Add to Home Screen"',
    iosStep3: 'დააჭირე "Add" დასამატებლად',
    iosTapHere: 'დააჭირე აქ',
    iosLookForThis: 'მოძებნე ეს აიქონი',
    androidTitle: 'დააინსტალირე ბრაუზერიდან',
    androidStep1: 'დააჭირე მენიუს ღილაკს',
    androidStep2: 'აირჩიე "Add to Home Screen"',
    androidStep3: 'დააჭირე "Add" დასადასტურებლად',
    continueAnyway: 'გაგრძელება ბრაუზერში',
    alreadyInstalled: 'უკვე დაინსტალირებული? გახსენი აპი',
  },
  ru: {
    title: 'Установите приложение Homico',
    subtitle: 'Получите лучший опыт с нашим приложением',
    benefit1: 'Быстрая загрузка и офлайн доступ',
    benefit2: 'Уведомления о новых заказах',
    benefit3: 'Полноэкранный режим',
    installButton: 'Установить',
    iosTitle: 'Добавить на главный экран',
    iosStep1: 'Нажмите кнопку "Поделиться" внизу',
    iosStep2: 'Выберите "На экран Домой"',
    iosStep3: 'Нажмите "Добавить"',
    iosTapHere: 'Нажмите здесь',
    iosLookForThis: 'Найдите этот значок',
    androidTitle: 'Установить из браузера',
    androidStep1: 'Нажмите кнопку меню',
    androidStep2: 'Выберите "Добавить на главный экран"',
    androidStep3: 'Нажмите "Добавить" для подтверждения',
    continueAnyway: 'Продолжить в браузере',
    alreadyInstalled: 'Уже установлено? Откройте приложение',
  },
};

// iOS Share button SVG icon (the square with arrow)
const IOSShareIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M20 21H4a1 1 0 01-1-1v-9a1 1 0 011-1h4" />
    <path d="M16 10h4a1 1 0 011 1v9a1 1 0 01-1 1" />
  </svg>
);

// iOS Add to Home Screen icon (plus in square)
const IOSAddIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export default function PWAInstallPrompt() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canShowContinue, setCanShowContinue] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if should show prompt
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // Check if on mobile
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent);

    if (!isMobile) {
      setShowPrompt(false);
      return;
    }

    // Check dismissal
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismiss < DISMISS_DURATION_HOURS) {
        setShowPrompt(false);
        return;
      }
    }

    // Detect platform
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isAndroidDevice = /android/i.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setShowPrompt(true);

    // Show "continue anyway" after 5 seconds
    const timer = setTimeout(() => {
      setCanShowContinue(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Listen for beforeinstallprompt event (Android/Chrome)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowPrompt(false);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay content */}
      <div className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up max-h-[95vh] flex flex-col">
        {/* Header with app icon - Compact for iOS */}
        <div className={`relative bg-gradient-to-br from-[#C4735B] to-[#A85D47] px-6 text-center flex-shrink-0 ${isIOS ? 'pt-5 pb-8' : 'pt-8 pb-12'}`}>
          {/* Close button - only after delay */}
          {canShowContinue && (
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* App Icon */}
          <div className={`mx-auto mb-3 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden ${isIOS ? 'w-14 h-14' : 'w-20 h-20'}`}>
            <Image
              src="/favicon.png"
              alt="Homico"
              width={64}
              height={64}
              className={isIOS ? 'w-10 h-10' : 'w-16 h-16'}
            />
          </div>

          <h2 className={`font-bold text-white mb-0.5 ${isIOS ? 'text-lg' : 'text-xl'}`}>
            {t.title}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm">
            {t.subtitle}
          </p>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Benefits - Compact horizontal pills for iOS, full for others */}
          {isIOS ? (
            <div className="px-4 -mt-4 pb-2">
              <div className="flex flex-wrap gap-1.5 justify-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[10px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> {t.benefit1}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[10px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> {t.benefit3}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-6 -mt-6">
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t.benefit1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t.benefit2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t.benefit3}</span>
                </div>
              </div>
            </div>
          )}

        {/* Install Instructions */}
        <div className="px-6 py-5">
          {/* Native install button for Android/Chrome */}
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#C4735B] hover:bg-[#A85D47] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isInstalling ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {t.installButton}
                </>
              )}
            </button>
          )}

          {/* iOS Instructions - Visual Animated Guide */}
          {isIOS && !deferredPrompt && (
            <div className="space-y-4">
              {/* Step 1: Animated arrow pointing to Safari share button */}
              <div className="relative">
                <div className="bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                  <div className="text-center mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold mb-2">1</span>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.iosStep1}</p>
                  </div>

                  {/* Visual representation of Safari bottom bar */}
                  <div className="relative bg-neutral-200 dark:bg-neutral-700 rounded-xl p-2 mx-auto max-w-[280px]">
                    {/* Mock Safari toolbar */}
                    <div className="flex items-center justify-around py-2">
                      <div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-600" />
                      <div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-600" />

                      {/* Highlighted Share button */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center animate-pulse-scale shadow-lg shadow-blue-500/50">
                          <IOSShareIcon className="w-6 h-6 text-white" />
                        </div>
                        {/* Pulsing ring */}
                        <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-ping-slow" />
                      </div>

                      <div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-600" />
                      <div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-600" />
                    </div>

                    {/* Arrow pointing down to actual share button */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-arrow">
                      <ChevronDown className="w-6 h-6 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-500 whitespace-nowrap">{t.iosTapHere}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Add to Home Screen option */}
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="text-center mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-500 text-white text-xs font-bold mb-2">2</span>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.iosStep2}</p>
                </div>

                {/* Mock iOS share sheet option */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden max-w-[240px] mx-auto shadow-sm">
                  {/* Fake other options */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-sm text-neutral-400">Copy</span>
                  </div>

                  {/* Highlighted Add to Home Screen */}
                  <div className="px-4 py-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 relative">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <IOSAddIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">Add to Home Screen</span>
                    {/* Highlight indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Fake other option */}
                  <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-sm text-neutral-400">Add Bookmark</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 text-center mt-3">{t.iosLookForThis}: <IOSAddIcon className="w-4 h-4 inline-block align-middle" /></p>
              </div>

              {/* Step 3: Confirm */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-700">
                <div className="text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold mb-2">3</span>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">{t.iosStep3}</p>

                  {/* Mock Add button */}
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm animate-pulse-subtle">
                    Add
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Instructions (fallback if no beforeinstallprompt) */}
          {isAndroid && !deferredPrompt && (
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-center">
                {t.androidTitle}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center flex-shrink-0">
                    <MoreVertical className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">1. {t.androidStep1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">2. {t.androidStep2}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">3. {t.androidStep3}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        </div>

        {/* Continue anyway button - Fixed at bottom */}
        <div className="px-6 pb-6 pt-2 flex-shrink-0 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          {canShowContinue ? (
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors active:scale-95"
            >
              {t.continueAnyway}
            </button>
          ) : (
            <div className="h-12 flex items-center justify-center">
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-[#C4735B] rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        :global(.animate-pulse-scale) {
          animation: pulse-scale 1.5s ease-in-out infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        :global(.animate-ping-slow) {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes bounce-arrow {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-8px);
          }
        }
        :global(.animate-bounce-arrow) {
          animation: bounce-arrow 1s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        :global(.animate-pulse-subtle) {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
