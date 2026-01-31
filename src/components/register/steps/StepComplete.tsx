'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { SelectedService } from './StepSelectServices';

interface StepCompleteProps {
  fullName: string;
  avatarPreview: string | null;
  city: string;
  selectedServices: SelectedService[];
  onGoToProfile: () => void;
  onGoToDashboard: () => void;
}

export default function StepComplete({
  fullName,
  avatarPreview,
  city,
  selectedServices,
  onGoToProfile,
  onGoToDashboard,
}: StepCompleteProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="w-full max-w-md mx-auto text-center px-1">
      {/* Success Animation */}
      <div className="relative mb-5 sm:mb-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-bounce-slow">
          <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 sm:-translate-y-2">
          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-[#C4735B] animate-pulse" />
        </div>
      </div>

      {/* Header */}
      <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
        {t('register.congratulations')}
      </h1>
      <p className="text-xs sm:text-base text-neutral-500 mb-5 sm:mb-8">
        {t('register.youAreNowAPro')}
      </p>

      {/* Profile Preview Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-4 sm:p-6 mb-5 sm:mb-8 text-left">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-lg sm:text-xl font-bold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
              {fullName}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500">
              {city}
            </p>
          </div>

          {/* Pro Badge */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-[10px] sm:text-xs font-bold">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              PRO
            </span>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {selectedServices.slice(0, 4).map(service => (
            <span
              key={service.key}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-neutral-100 text-neutral-700 text-[10px] sm:text-xs font-medium"
            >
              {locale === 'ka' ? service.nameKa : service.name}
            </span>
          ))}
          {selectedServices.length > 4 && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-neutral-100 text-neutral-500 text-[10px] sm:text-xs">
              +{selectedServices.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-[#C4735B]/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 sm:mb-8">
        <h4 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1.5 sm:mb-2">
          {t('register.whatsNext')}
        </h4>
        <ul className="text-xs sm:text-sm text-neutral-600 space-y-1 sm:space-y-1.5 text-left">
          <li className="flex items-start sm:items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>{t('register.completeProfileLater')}</span>
          </li>
          <li className="flex items-start sm:items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>{t('register.addPortfolioLater')}</span>
          </li>
          <li className="flex items-start sm:items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>{t('register.startReceivingJobs')}</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-2 sm:space-y-3">
        <Button
          onClick={onGoToProfile}
          className="w-full h-10 sm:h-11 text-sm sm:text-base"
          size="lg"
        >
          {t('becomePro.completeProfile')}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
        </Button>
        <Button
          onClick={onGoToDashboard}
          variant="outline"
          className="w-full h-10 sm:h-11 text-sm sm:text-base"
          size="lg"
        >
          {t('register.goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
