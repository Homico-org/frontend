'use client';

import AvatarCropper from '@/components/common/AvatarCropper';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Camera, CheckCircle2, Clock, FileText, Globe, Instagram, Facebook, Linkedin, MessageCircle, Send, Sparkles, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface AboutStepProps {
  formData: {
    bio: string;
    yearsExperience: string;
    avatar: string;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
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
  hideExperience?: boolean; // Hide experience field (experience is now per-service)
  customServices?: string[];
  onCustomServicesChange?: (services: string[]) => void;
}

export default function AboutStep({
  formData,
  avatarPreview,
  onFormChange,
  onAvatarChange,
  onAvatarCropped,
  validation,
  hideExperience = false,
  customServices = [],
  onCustomServicesChange,
}: AboutStepProps) {
  const { t, locale } = useLanguage();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // State for cropper
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const addCustomSkill = () => {
    if (customSkillInput.trim() && onCustomServicesChange) {
      const newSkill = customSkillInput.trim();
      if (!customServices.includes(newSkill)) {
        onCustomServicesChange([...customServices, newSkill]);
      }
      setCustomSkillInput('');
    }
  };

  const removeCustomSkill = (skill: string) => {
    if (onCustomServicesChange) {
      onCustomServicesChange(customServices.filter(s => s !== skill));
    }
  };

  // Handle file selection - show cropper instead of directly setting avatar
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Allow up to 5MB for cropping, final result will be smaller
        alert(t('common.imageMustBeLessThan'));
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
          bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all
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
                {t('common.profilePhoto')}
                <span className="text-[#C4735B] ml-1">*</span>
              </h3>
            </div>
            {hasAvatar ? (
              <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                {t('common.uploaded')}
              </Badge>
            ) : (
              <Badge variant="premium" size="xs" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                {t('common.required')}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            {!avatarPreview ? (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 border-2 border-dashed border-[#C4735B]/40 flex items-center justify-center group transition-all hover:scale-105 hover:border-[#C4735B] overflow-hidden"
              >
                <div className="text-center">
                  <Camera className="w-8 h-8 text-[#C4735B]/60 group-hover:text-[#C4735B] transition-colors mx-auto mb-1" />
                  <span className="text-xs font-medium text-[#C4735B]/60 group-hover:text-[#C4735B]">
                    {t('common.upload')}
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
                {t('common.clientsTrustProfessionalsWithPhotos')}
              </p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4735B] text-white text-sm font-medium hover:bg-[#A85D47] transition-colors"
              >
                <Camera className="w-4 h-4" />
                {avatarPreview
                  ? (t('common.changePhoto'))
                  : (t('common.uploadPhoto'))
                }
              </button>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                PNG, JPG {t('common.max')} 5MB
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

        {/* Years of Experience - REQUIRED (hidden if experience is per-service) */}
        {!hideExperience && (
          <div className={`
            bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all
            ${validation.experience
              ? 'border-2 border-emerald-500/30'
              : 'border-2 border-[var(--color-border-subtle)]'
            }
          `}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C4735B]" />
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {t('common.yearsOfExperience')}
                  <span className="text-[#C4735B] ml-1">*</span>
                </span>
              </div>
              {validation.experience ? (
                <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  {t('common.completed')}
                </Badge>
              ) : (
                <Badge variant="secondary" size="xs">
                  {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                </Badge>
              )}
            </div>
            <Input
              type="number"
              min={0}
              max={50}
              value={formData.yearsExperience}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseInt(value);
                if (value === '' || (parsed >= 0 && parsed <= 50)) {
                  onFormChange({ yearsExperience: value });
                }
              }}
              variant="filled"
              inputSize="lg"
              success={validation.experience}
              placeholder="0"
              rightIcon={<span className="text-sm">{t('common.years')}</span>}
              className="text-lg font-medium"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              {t('common.howManyYearsHaveYou')}
            </p>
          </div>
        )}

        {/* Bio / About - REQUIRED */}
        <div className={`
          bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all
          ${validation.bio
            ? 'border-2 border-emerald-500/30'
            : 'border-2 border-[var(--color-border-subtle)]'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C4735B]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {t('common.aboutYou')}
                <span className="text-[#C4735B] ml-1">*</span>
              </span>
            </div>
            {validation.bio ? (
              <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                {locale === 'ka' ? 'შევსებულია' : 'Completed'}
              </Badge>
            ) : (
              <Badge variant="secondary" size="xs">
                {locale === 'ka' ? 'სავალდებულო' : 'Required'}
              </Badge>
            )}
          </div>
          <Textarea
            rows={5}
            value={formData.bio}
            onChange={(e) => onFormChange({ bio: e.target.value })}
            variant="filled"
            textareaSize="lg"
            success={validation.bio}
            placeholder={t('common.brieflyDescribeYourExperienceAnd')}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('common.minimum50CharactersRequired')}
            </p>
            <span className={`text-xs font-medium ${formData.bio.length >= 50 ? 'text-emerald-600' : formData.bio.length > 0 ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
              {formData.bio.length}/500
            </span>
          </div>
        </div>

        {/* Custom Skills - OPTIONAL */}
        {onCustomServicesChange && (
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C4735B]" />
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {t('common.customSkills')}
                </span>
              </div>
              <span className="text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-full">
                {t('common.optional')}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {t('register.customSkillHint')}
            </p>

            {/* Custom skills list */}
            {customServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customServices.map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeCustomSkill(skill)}
                      className="w-4 h-4 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add custom skill input */}
            <div className="flex gap-2">
              <Input
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                variant="filled"
                inputSize="default"
                placeholder={t('register.addCustomSkill')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                disabled={!customSkillInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 text-white transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{t('common.add')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Contact & Social Media - OPTIONAL */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#C4735B]" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {t('common.contactSocialMedia')}
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-full">
              {t('common.optional')}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {t('common.addContactInfoSoClients')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                WhatsApp
              </label>
              <Input
                type="tel"
                value={formData.whatsapp || ''}
                onChange={(e) => onFormChange({ whatsapp: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="+995 5XX XXX XXX"
                leftIcon={
                  <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                }
              />
            </div>

            {/* Telegram */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Telegram
              </label>
              <Input
                type="text"
                value={formData.telegram || ''}
                onChange={(e) => onFormChange({ telegram: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="@username"
                leftIcon={<Send className="w-4 h-4 text-[#0088cc]" />}
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Instagram
              </label>
              <Input
                type="text"
                value={formData.instagram || ''}
                onChange={(e) => onFormChange({ instagram: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="@username"
                leftIcon={<Instagram className="w-4 h-4 text-[#E4405F]" />}
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Facebook
              </label>
              <Input
                type="text"
                value={formData.facebook || ''}
                onChange={(e) => onFormChange({ facebook: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="facebook.com/username"
                leftIcon={<Facebook className="w-4 h-4 text-[#1877F2]" />}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                LinkedIn
              </label>
              <Input
                type="text"
                value={formData.linkedin || ''}
                onChange={(e) => onFormChange({ linkedin: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="linkedin.com/in/username"
                leftIcon={<Linkedin className="w-4 h-4 text-[#0A66C2]" />}
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                {t('common.website')}
              </label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => onFormChange({ website: e.target.value })}
                variant="filled"
                inputSize="default"
                placeholder="https://example.com"
                leftIcon={<Globe className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
              />
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
