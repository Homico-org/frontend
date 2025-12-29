'use client';

import AvatarCropper from '@/components/common/AvatarCropper';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Camera, CheckCircle2, Clock, FileText } from 'lucide-react';
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

        {/* Avatar Upload Card - REQUIRED */}
        <div className={`
          bg-[var(--color-bg-elevated)] rounded-2xl p-6 shadow-sm transition-all
          ${hasAvatar
            ? 'border-2 border-emerald-500/30'
            : 'border-2 border-[#C4735B]/50 ring-4 ring-[#C4735B]/10'
          }
        `}>
          {/* Required Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#C4735B]" />
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'პროფილის ფოტო' : 'Profile Photo'}
                <span className="text-[#C4735B] ml-1">*</span>
              </h3>
            </div>
            {hasAvatar ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'ატვირთულია' : 'Uploaded'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#C4735B] bg-[#C4735B]/10 px-2.5 py-1 rounded-full">
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
                className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 border-2 border-dashed border-[#C4735B]/40 flex items-center justify-center group transition-all hover:scale-105 hover:border-[#C4735B] overflow-hidden"
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 text-[#C4735B]/60 group-hover:text-[#C4735B] transition-colors mx-auto mb-1" />
                  <span className="text-xs font-medium text-[#C4735B]/60 group-hover:text-[#C4735B]">
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
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#C4735B] flex items-center justify-center shadow-lg hover:bg-[#A85D47] transition-colors"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4735B] text-white text-sm font-medium hover:bg-[#A85D47] transition-colors"
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
              <Clock className="w-5 h-5 text-[#C4735B]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}
                <span className="text-[#C4735B] ml-1">*</span>
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
                  : 'border-transparent focus:border-[#C4735B]/50 focus:ring-4 focus:ring-[#C4735B]/10'
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
              <FileText className="w-5 h-5 text-[#C4735B]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
                <span className="text-[#C4735B] ml-1">*</span>
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
                : 'border-transparent focus:border-[#C4735B]/50 focus:ring-4 focus:ring-[#C4735B]/10'
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
