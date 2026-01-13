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
    <div className="w-full max-w-md mx-auto text-center">
      {/* Success Animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-bounce-slow">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <Sparkles className="w-6 h-6 text-[#C4735B] animate-pulse" />
        </div>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        {t('register.congratulations')}
      </h1>
      <p className="text-neutral-500 mb-8">
        {t('register.youAreNowAPro')}
      </p>

      {/* Profile Preview Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8 text-left">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xl font-bold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-neutral-900 truncate">
              {fullName}
            </h3>
            <p className="text-sm text-neutral-500">
              {city}
            </p>
          </div>

          {/* Pro Badge */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              PRO
            </span>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2">
          {selectedServices.slice(0, 5).map(service => (
            <span
              key={service.key}
              className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-medium"
            >
              {locale === 'ka' ? service.nameKa : service.name}
            </span>
          ))}
          {selectedServices.length > 5 && (
            <span className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-500 text-xs">
              +{selectedServices.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-[#C4735B]/5 rounded-2xl p-4 mb-8">
        <h4 className="font-semibold text-neutral-900 mb-2">
          {t('register.whatsNext')}
        </h4>
        <ul className="text-sm text-neutral-600 space-y-1 text-left">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {t('register.completeProfileLater')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {t('register.addPortfolioLater')}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {t('register.startReceivingJobs')}
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onGoToProfile}
          className="w-full"
          size="lg"
        >
          {t('register.viewMyProfile')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={onGoToDashboard}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {t('register.goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
