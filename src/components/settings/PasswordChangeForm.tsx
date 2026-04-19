'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';
import { getPasswordStrength, passwordsMatch } from '@/utils/validationUtils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useLanguage } from "@/contexts/LanguageContext";
export interface PasswordChangeFormProps {
  /** Handler for password change submission */
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

export default function PasswordChangeForm({
  onSubmit,
  locale = 'en',
  className = '',
}: PasswordChangeFormProps) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { t } = useLanguage();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const passwordStrength = getPasswordStrength(passwordData.newPassword, locale);

  const handleSubmit = async () => {
    setMessage(null);

    // Validation
    if (!passwordData.currentPassword) {
      setMessage({
        type: 'error',
        text: t('settings.pleaseEnterYourCurrentPassword'),
      });
      return;
    }

    if (!passwordStrength.isValid) {
      setMessage({
        type: 'error',
        text: t('settings.newPasswordMustBeAt'),
      });
      return;
    }

    const matchResult = passwordsMatch(passwordData.newPassword, passwordData.confirmPassword, locale);
    if (!matchResult.isValid) {
      setMessage({
        type: 'error',
        text: matchResult.error || '',
      });
      return;
    }

    setIsChanging(true);

    try {
      const result = await onSubmit(passwordData.currentPassword, passwordData.newPassword);

      if (result.success) {
        setMessage({
          type: 'success',
          text: t('settings.passwordChangedSuccessfully'),
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || (t('settings.failedToChangePassword')),
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      setMessage({
        type: 'error',
        text: err.message || t('settings.failedToChangePassword'),
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <p
          className="text-sm"
          style={{ color: 'var(--hm-fg-secondary)' }}
        >
          {t('settings.enterYourCurrentPasswordAnd')}
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type} size="sm">
          {message.text}
        </Alert>
      )}

      <div className="space-y-4">
        {/* Current Password */}
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            {t('settings.currentPassword')}
          </label>
          <div className="relative">
            <Input
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder={t('settings.enterCurrentPassword')}
              className="pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            {t('settings.newPassword')}
          </label>
          <div className="relative">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder={t('settings.enterNewPassword')}
              className="pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>

          {/* Password Strength Indicator */}
          {passwordData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--hm-bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--hm-fg-muted)' }}
              >
                {t('settings.useAtLeast6Characters')}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            {t('settings.confirmNewPassword')}
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder={t('settings.confirmNewPassword')}
              className="pr-12"
              error={!!(passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <p className="text-xs mt-1 text-[var(--hm-error-500)]">
              {t('settings.passwordsDoNotMatch')}
            </p>
          )}
          {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
            <p className="text-xs mt-1 text-[var(--hm-success-500)] flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t('settings.passwordsMatch')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isChanging || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
            loading={isChanging}
            leftIcon={!isChanging ? <Lock className="w-4 h-4" /> : undefined}
            className="w-full sm:w-auto"
          >
            {isChanging
              ? (t('settings.changing'))
              : (t('settings.changePassword'))}
          </Button>
        </div>
      </div>
    </div>
  );
}
