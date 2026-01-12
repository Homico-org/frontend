'use client';

import Avatar from '@/components/common/Avatar';
import AvatarCropper from '@/components/common/AvatarCropper';
import Select from '@/components/common/Select';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { countries, useLanguage } from '@/contexts/LanguageContext';
import { Camera, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ProfileSettingsProps {
  onOpenEmailModal: () => void;
  onOpenPhoneModal: () => void;
  isMobile?: boolean;
}

export default function ProfileSettings({ onOpenEmailModal, onOpenPhoneModal, isMobile = false }: ProfileSettingsProps) {
  const { user, updateUser } = useAuth();
  const { t, locale } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar states
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Cities
  const georgianCities = countries.GE.citiesLocal;
  const englishCities = countries.GE.cities;
  const cityOptions = georgianCities.map((cityKa, index) => ({
    value: locale === 'ka' ? cityKa : englishCities[index],
    label: locale === 'ka' ? cityKa : englishCities[index],
  }));

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('settings.onlyImageFilesAreAllowed') });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('settings.fileIsTooLargeMax') });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setRawAvatarImage(imageUrl);
    setShowAvatarCropper(true);
  };

  const handleCroppedAvatar = async (croppedBlob: Blob) => {
    setShowAvatarCropper(false);

    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }

    const previewUrl = URL.createObjectURL(croppedBlob);
    setFormData(prev => ({ ...prev, avatar: previewUrl }));

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, 'avatar.jpg');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, avatar: data.url }));
      updateUser({ avatar: data.url });
      setMessage({ type: 'success', text: t('settings.imageUploadedSuccessfully') });
    } catch {
      setMessage({ type: 'error', text: t('settings.failedToUploadImage') });
      setFormData(prev => ({ ...prev, avatar: user?.avatar || '' }));
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setShowAvatarCropper(false);
    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          avatar: formData.avatar,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setMessage({ type: 'success', text: t('settings.profile.successMessage') });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch {
      setMessage({ type: 'error', text: t('settings.profile.errorMessage') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Avatar Cropper Modal */}
      {showAvatarCropper && rawAvatarImage && (
        <AvatarCropper
          image={rawAvatarImage}
          onCropComplete={handleCroppedAvatar}
          onCancel={handleCropCancel}
          locale={locale}
        />
      )}

      <div className="space-y-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
          {t('common.title')}
        </h2>

        {message && (
          <Alert 
            variant={message.type === 'success' ? 'success' : 'error'} 
            dismissible 
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Avatar Upload - Only for clients */}
        {user?.role === 'client' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar
                src={formData.avatar}
                name={formData.name}
                size="2xl"
                className="ring-4 ring-neutral-200 dark:ring-neutral-700"
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <LoadingSpinner size="lg" color="white" />
                </div>
              )}
              {!isUploadingAvatar && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                >
                  <Camera className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                </label>
              )}
              <input
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                {t('settings.profile.profilePhoto')}
              </h3>
              <p className="text-sm mt-1 text-neutral-500">
                {t('settings.profile.photoHint')}
              </p>
              <Button
                variant="link"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="mt-2 p-0 h-auto"
              >
                {isUploadingAvatar
                  ? (t('common.uploading'))
                  : t('settings.profile.uploadPhoto')}
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5 sm:pt-6">
          <div className="grid gap-3 sm:gap-4">
            <FormGroup>
              <Label locale={locale}>{t('common.fullName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <Label locale={locale === 'ka' ? 'ka' : 'en'}>{t('common.email')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    placeholder={t('settings.noEmailAdded')}
                    rightIcon={formData.email ? (
                      <Badge variant="success" size="xs" icon={<Check className="w-3 h-3" />}>
                        {t('common.verified')}
                      </Badge>
                    ) : undefined}
                  />
                </div>
                <Button variant="outline" onClick={onOpenEmailModal}>
                  {formData.email
                    ? (t('settings.change'))
                    : (t('common.add'))}
                </Button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {t('settings.changingYourEmailRequiresVerification')}
              </p>
            </FormGroup>

            <FormGroup>
              <Label locale={locale === 'ka' ? 'ka' : 'en'}>{t('common.phone')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="tel"
                    value={formData.phone}
                    disabled
                    placeholder={t('settings.profile.phonePlaceholder')}
                    rightIcon={formData.phone ? (
                      <Badge variant="success" size="xs" icon={<Check className="w-3 h-3" />}>
                        {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                      </Badge>
                    ) : undefined}
                  />
                </div>
                <Button variant="outline" onClick={onOpenPhoneModal}>
                  {formData.phone
                    ? (locale === 'ka' ? 'შეცვლა' : 'Change')
                    : (locale === 'ka' ? 'დამატება' : 'Add')}
                </Button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {t('settings.changingYourNumberRequiresVerification')}
              </p>
            </FormGroup>

            <FormGroup>
              <Label locale={locale === 'ka' ? 'ka' : 'en'}>{t('settings.profile.city')}</Label>
              <Select
                value={formData.city}
                onChange={(value: string) => setFormData(prev => ({ ...prev, city: value }))}
                options={[
                  { value: '', label: t('settings.notSpecified') },
                  ...cityOptions,
                ]}
                placeholder={t('settings.profile.cityPlaceholder')}
              />
            </FormGroup>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveProfile} loading={isSaving} className="w-full sm:w-auto">
            {t('settings.profile.saveChanges')}
          </Button>
        </div>
      </div>
    </>
  );
}

