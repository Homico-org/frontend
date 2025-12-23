'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import AvatarCropper from '@/components/common/AvatarCropper';
import { useRef, useState } from 'react';

interface AboutStepProps {
  formData: {
    bio: string;
    yearsExperience: string;
    avatar: string;
  };
  avatarPreview: string | null;
  onFormChange: (updates: Partial<AboutStepProps['formData']>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarCropped?: (croppedDataUrl: string) => void;
  validation: {
    bio: boolean;
    experience: boolean;
  };
}

export default function AboutStep({
  formData,
  avatarPreview,
  onFormChange,
  onAvatarChange,
  onAvatarCropped,
  validation,
}: AboutStepProps) {
  const { locale } = useLanguage();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // State for cropper
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Handle file selection - show cropper instead of directly setting avatar
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Allow up to 5MB for cropping, final result will be smaller
        alert(locale === 'ka' ? 'სურათი უნდა იყოს 5MB-ზე ნაკლები' : 'Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImageToCrop(dataUrl);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  // Handle crop complete
  const handleCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const croppedDataUrl = reader.result as string;

      // Call the parent handler if provided
      if (onAvatarCropped) {
        onAvatarCropped(croppedDataUrl);
      } else {
        // Fallback: update form data directly
        onFormChange({ avatar: croppedDataUrl });
      }

      setShowCropper(false);
      setImageToCrop(null);
    };
    reader.readAsDataURL(croppedBlob);
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {locale === 'ka' ? 'პირადი ინფორმაცია' : 'Personal Information'}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            {locale === 'ka'
              ? 'ეს ინფორმაცია დაეხმარება კლიენტებს გაიცნონ შენ უკეთესად'
              : 'This information will help clients get to know you better'}
          </p>
        </div>

        {/* Avatar Upload Card */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <div className="flex items-center gap-5">
            {!avatarPreview ? (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-muted)] flex items-center justify-center group transition-all hover:scale-105 overflow-hidden"
              >
                <svg className="w-10 h-10 text-[var(--color-text-muted)] group-hover:text-[#E07B4F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#E07B4F] flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                {locale === 'ka' ? 'პროფილის ფოტო' : 'Profile Photo'}
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
                {locale === 'ka' ? 'PNG, JPG მაქს. 5MB' : 'PNG, JPG up to 5MB'}
              </p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] transition-colors"
              >
                {avatarPreview
                  ? (locale === 'ka' ? 'შეცვლა' : 'Change photo')
                  : (locale === 'ka' ? 'ატვირთვა' : 'Upload photo')
                }
              </button>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Years of Experience */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <label className="flex items-center justify-between mb-4">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}
            </span>
            {validation.experience && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {locale === 'ka' ? 'შევსებულია' : 'Completed'}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="50"
              value={formData.yearsExperience}
              onChange={(e) => onFormChange({ yearsExperience: e.target.value })}
              className={`
                w-full px-4 py-3.5 rounded-xl
                bg-[var(--color-bg-tertiary)] border-2
                text-[var(--color-text-primary)] text-lg font-medium
                placeholder-[var(--color-text-muted)]
                focus:outline-none transition-all duration-200
                ${validation.experience
                  ? 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10'
                  : 'border-transparent focus:border-[#E07B4F]/50 focus:ring-4 focus:ring-[#E07B4F]/10'
                }
              `}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'წელი' : 'years'}
            </span>
          </div>
        </div>

        {/* Bio / About */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <label className="flex items-center justify-between mb-4">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
            </span>
            {validation.bio && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {locale === 'ka' ? 'შევსებულია' : 'Completed'}
              </span>
            )}
          </label>
          <textarea
            rows={5}
            value={formData.bio}
            onChange={(e) => onFormChange({ bio: e.target.value })}
            className={`
              w-full px-4 py-3.5 rounded-xl
              bg-[var(--color-bg-tertiary)] border-2
              text-[var(--color-text-primary)]
              placeholder-[var(--color-text-muted)]
              focus:outline-none transition-all duration-200 resize-none
              ${validation.bio
                ? 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10'
                : 'border-transparent focus:border-[#E07B4F]/50 focus:ring-4 focus:ring-[#E07B4F]/10'
              }
            `}
            placeholder={locale === 'ka' ? 'მოკლედ აღწერე შენი გამოცდილება და უნარები...' : 'Briefly describe your experience and skills...'}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              {locale === 'ka' ? 'მინიმუმ 50 სიმბოლო რეკომენდებულია' : 'Minimum 50 characters recommended'}
            </p>
            <span className={`text-xs ${formData.bio.length >= 50 ? 'text-emerald-600' : 'text-[var(--color-text-muted)]'}`}>
              {formData.bio.length}/500
            </span>
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 rounded-2xl p-5 border border-[#E07B4F]/10">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E07B4F]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-[#E07B4F] mb-1">
                {locale === 'ka' ? 'პრო რჩევა' : 'Pro Tip'}
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'ka'
                  ? 'პროფილები დეტალური აღწერით იღებენ 40%-ით მეტ მოთხოვნას. გაუზიარე კლიენტებს რა გამოგარჩევს!'
                  : 'Profiles with detailed descriptions receive 40% more requests. Share what makes you unique!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && imageToCrop && (
        <AvatarCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          locale={locale}
        />
      )}
    </>
  );
}
