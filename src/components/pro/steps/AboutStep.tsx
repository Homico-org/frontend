'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import AvatarCropper from '@/components/common/AvatarCropper';
import { useRef, useState } from 'react';
import { Camera, User, Clock, FileText, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

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
    avatar?: boolean;
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

  // Check if avatar is valid (has data)
  const hasAvatar = !!avatarPreview && avatarPreview.length > 0;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium mb-4">
            <User className="w-4 h-4" />
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

        {/* Required Fields Notice */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {locale === 'ka'
              ? 'ველები ვარსკვლავით (*) სავალდებულოა'
              : 'Fields marked with (*) are required'}
          </p>
        </div>

        {/* Avatar Upload Card - REQUIRED */}
        <div className={`
          bg-[var(--color-bg-elevated)] rounded-2xl p-6 shadow-sm transition-all
          ${hasAvatar
            ? 'border-2 border-emerald-500/30'
            : 'border-2 border-[#E07B4F]/50 ring-4 ring-[#E07B4F]/10'
          }
        `}>
          {/* Required Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#E07B4F]" />
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'პროფილის ფოტო' : 'Profile Photo'}
                <span className="text-[#E07B4F] ml-1">*</span>
              </h3>
            </div>
            {hasAvatar ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'ატვირთულია' : 'Uploaded'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#E07B4F] bg-[#E07B4F]/10 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'სავალდებულო' : 'Required'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-5">
            {!avatarPreview ? (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#E07B4F]/10 to-[#E07B4F]/5 border-2 border-dashed border-[#E07B4F]/40 flex items-center justify-center group transition-all hover:scale-105 hover:border-[#E07B4F] overflow-hidden"
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 text-[#E07B4F]/60 group-hover:text-[#E07B4F] transition-colors mx-auto mb-1" />
                  <span className="text-xs font-medium text-[#E07B4F]/60 group-hover:text-[#E07B4F]">
                    {locale === 'ka' ? 'ატვირთე' : 'Upload'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-2 ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#E07B4F] flex items-center justify-center shadow-lg hover:bg-[#D26B3F] transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {locale === 'ka'
                  ? 'კლიენტები უფრო ენდობიან პროფესიონალებს ფოტოთი. ატვირთე მაღალი ხარისხის ფოტო.'
                  : 'Clients trust professionals with photos more. Upload a high-quality photo.'}
              </p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E07B4F] text-white text-sm font-medium hover:bg-[#D26B3F] transition-colors"
              >
                <Camera className="w-4 h-4" />
                {avatarPreview
                  ? (locale === 'ka' ? 'შეცვალე ფოტო' : 'Change Photo')
                  : (locale === 'ka' ? 'ატვირთე ფოტო' : 'Upload Photo')
                }
              </button>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                PNG, JPG {locale === 'ka' ? 'მაქს.' : 'max'} 5MB
              </p>
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

        {/* Years of Experience - REQUIRED */}
        <div className={`
          bg-[var(--color-bg-elevated)] rounded-2xl p-6 shadow-sm transition-all
          ${validation.experience
            ? 'border-2 border-emerald-500/30'
            : 'border-2 border-[var(--color-border-subtle)]'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E07B4F]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}
                <span className="text-[#E07B4F] ml-1">*</span>
              </span>
            </div>
            {validation.experience ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'შევსებულია' : 'Completed'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-full">
                {locale === 'ka' ? 'სავალდებულო' : 'Required'}
              </span>
            )}
          </div>
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
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {locale === 'ka' ? 'რამდენი წელია მუშაობ ამ სფეროში?' : 'How many years have you been working in this field?'}
          </p>
        </div>

        {/* Bio / About - REQUIRED */}
        <div className={`
          bg-[var(--color-bg-elevated)] rounded-2xl p-6 shadow-sm transition-all
          ${validation.bio
            ? 'border-2 border-emerald-500/30'
            : 'border-2 border-[var(--color-border-subtle)]'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#E07B4F]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
                <span className="text-[#E07B4F] ml-1">*</span>
              </span>
            </div>
            {validation.bio ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'შევსებულია' : 'Completed'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-full">
                {locale === 'ka' ? 'სავალდებულო' : 'Required'}
              </span>
            )}
          </div>
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
            <span className={`text-xs font-medium ${formData.bio.length >= 50 ? 'text-emerald-600' : formData.bio.length > 0 ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
              {formData.bio.length}/500
            </span>
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 rounded-2xl p-5 border border-[#E07B4F]/10">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E07B4F]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#E07B4F]" />
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

        {/* Progress Summary */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#E07B4F]" />
            {locale === 'ka' ? 'ამ გვერდის პროგრესი' : 'This Page Progress'}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {hasAvatar ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)]" />
              )}
              <span className={`text-sm ${hasAvatar ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}`}>
                {locale === 'ka' ? 'პროფილის ფოტო' : 'Profile Photo'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {validation.experience ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)]" />
              )}
              <span className={`text-sm ${validation.experience ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}`}>
                {locale === 'ka' ? 'გამოცდილება' : 'Years of Experience'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {validation.bio ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)]" />
              )}
              <span className={`text-sm ${validation.bio ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}`}>
                {locale === 'ka' ? 'აღწერა' : 'About You'}
              </span>
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
