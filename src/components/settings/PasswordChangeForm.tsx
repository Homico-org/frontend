'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';
import { getPasswordStrength, passwordsMatch } from '@/utils/validationUtils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface PasswordChangeFormProps {
  /** Handler for password change submission */
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  /** Locale for translations */
  locale?: 'en' | 'ka';
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
        text: locale === 'ka' ? 'შეიყვანეთ მიმდინარე პაროლი' : 'Please enter your current password',
      });
      return;
    }

    if (!passwordStrength.isValid) {
      setMessage({
        type: 'error',
        text: locale === 'ka' ? 'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' : 'New password must be at least 6 characters',
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
          text: locale === 'ka' ? 'პაროლი წარმატებით შეიცვალა' : 'Password changed successfully',
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || (locale === 'ka' ? 'პაროლის შეცვლა ვერ მოხერხდა' : 'Failed to change password'),
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      setMessage({
        type: 'error',
        text: err.message || (locale === 'ka' ? 'პაროლის შეცვლა ვერ მოხერხდა' : 'Failed to change password'),
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2
          className="text-base sm:text-lg font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {locale === 'ka' ? 'პაროლის შეცვლა' : 'Change Password'}
        </h2>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {locale === 'ka'
            ? 'შეიყვანეთ მიმდინარე პაროლი და აირჩიეთ ახალი'
            : 'Enter your current password and choose a new one'}
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
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {locale === 'ka' ? 'მიმდინარე პაროლი' : 'Current Password'}
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder={locale === 'ka' ? 'შეიყვანეთ მიმდინარე პაროლი' : 'Enter current password'}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
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
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {locale === 'ka' ? 'ახალი პაროლი' : 'New Password'}
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder={locale === 'ka' ? 'შეიყვანეთ ახალი პაროლი' : 'Enter new password'}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
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
                <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
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
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {locale === 'ka'
                  ? 'გამოიყენეთ მინიმუმ 6 სიმბოლო, დიდი ასოები, ციფრები და სპეციალური სიმბოლოები'
                  : 'Use at least 6 characters, uppercase letters, numbers and special characters'}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {locale === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Confirm New Password'}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder={locale === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Confirm new password'}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                  ? '1px solid #ef4444'
                  : '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
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
            <p className="text-xs mt-1 text-red-500">
              {locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match'}
            </p>
          )}
          {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
            <p className="text-xs mt-1 text-green-500 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {locale === 'ka' ? 'პაროლები ემთხვევა' : 'Passwords match'}
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
              ? (locale === 'ka' ? 'იცვლება...' : 'Changing...')
              : (locale === 'ka' ? 'პაროლის შეცვლა' : 'Change Password')}
          </Button>
        </div>
      </div>
    </div>
  );
}
