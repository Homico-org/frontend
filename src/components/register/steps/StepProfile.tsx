'use client';

import Select from '@/components/common/Select';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { Camera, Lock, MapPin, User, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';

interface StepProfileProps {
  fullName: string;
  onNameChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  phoneCountry: CountryCode;
  avatarPreview: string | null;
  avatarUploading: boolean;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
  onNext: () => void;
  canProceed: boolean;
  isLoading: boolean;
}

export default function StepProfile({
  fullName,
  onNameChange,
  city,
  onCityChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  phoneCountry,
  avatarPreview,
  avatarUploading,
  onAvatarSelect,
  onAvatarRemove,
  onNext,
  canProceed,
  isLoading,
}: StepProfileProps) {
  const { t, locale } = useLanguage();

  // Build city options from country data
  const cityOptions = useMemo(() => {
    const countryData = countries[phoneCountry];
    if (!countryData) return [];

    const useLocal = locale === 'ka' && phoneCountry === 'GE';
    const cityList = useLocal ? countryData.citiesLocal : countryData.cities;

    return cityList.map((cityName, index) => ({
      value: countryData.cities[index], // Always use English value for storage
      label: cityName,
    }));
  }, [phoneCountry, locale]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
          {t('register.yourProfile')}
        </h1>
        <p className="text-xs sm:text-base text-neutral-500">
          {t('register.uploadARealPhotoOf')}
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="flex justify-center mb-4 sm:mb-8">
        <div className="relative">
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onAvatarSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={avatarUploading}
          />

          <div
            className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] sm:border-4 border-dashed transition-colors ${
              avatarUploading ? 'border-neutral-200' : 'border-neutral-200 hover:border-[#C4735B] active:border-[#C4735B]'
            }`}
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 group-hover:text-[#C4735B] transition-colors cursor-pointer">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 mb-0.5 sm:mb-1" />
                <span className="text-[10px] sm:text-xs font-medium">{t('common.upload')}</span>
              </div>
            )}

            {avatarUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#C4735B] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {avatarPreview && !avatarUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAvatarRemove();
              }}
              className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95 transition-all z-30"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Required badge */}
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        <span className="text-[10px] sm:text-xs font-medium text-[#C4735B] bg-[#C4735B]/10 px-2 py-0.5 sm:py-1 rounded-full">
          {t('common.required')}
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8">
        {/* Full Name */}
        <div>
          <Label className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-xs sm:text-sm">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
            {t('register.fullName')}
          </Label>
          <Input
            value={fullName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('register.enterYourName')}
            autoComplete="off"
            data-form-type="other"
            className="bg-white dark:bg-neutral-900 h-10 sm:h-11 text-sm"
          />
        </div>

        {/* City */}
        <div>
          <Label className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-xs sm:text-sm">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
            {t('register.city')}
          </Label>
          <Select
            options={cityOptions}
            value={city}
            onChange={onCityChange}
            placeholder={t('register.selectCity')}
            searchable
            size="md"
          />
        </div>

        {/* Password */}
        <div>
          <Label className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-xs sm:text-sm">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
            {t('common.password')}
          </Label>
          <PasswordInput
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t('register.min6Chars')}
            className="h-10 sm:h-11"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <Label className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-xs sm:text-sm">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
            {t('register.repeatPassword')}
          </Label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder={t('register.repeat')}
            className="h-10 sm:h-11"
            error={confirmPassword && password !== confirmPassword ? t('validation.passwordsNotMatch') : undefined}
          />
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={onNext}
        disabled={!canProceed || isLoading}
        loading={isLoading}
        className="w-full h-10 sm:h-11 text-sm sm:text-base"
        size="lg"
      >
        {t('common.continue')}
      </Button>
    </div>
  );
}
