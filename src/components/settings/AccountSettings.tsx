'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, AlertTriangle, BriefcaseBusiness, Check, EyeOff, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AccountSettingsProps {
  onOpenDeleteModal: () => void;
  onOpenDeactivateModal: () => void;
}

export default function AccountSettings({ onOpenDeleteModal, onOpenDeactivateModal }: AccountSettingsProps) {
  const { user, logout } = useAuth();
  const { t, locale } = useLanguage();

  // Profile deactivation state
  const [isProfileDeactivated, setIsProfileDeactivated] = useState(false);
  const [deactivatedUntil, setDeactivatedUntil] = useState<Date | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);

  // Fetch deactivation status
  const fetchDeactivationStatus = useCallback(async () => {
    if (user?.role !== 'pro' && user?.role !== 'admin') return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/deactivation-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsProfileDeactivated(data.isDeactivated);
        setDeactivatedUntil(data.deactivatedUntil ? new Date(data.deactivatedUntil) : null);
        setDeactivationReason(data.deactivationReason || '');
      }
    } catch (error) {
      console.error('Error fetching deactivation status:', error);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDeactivationStatus();
  }, [fetchDeactivationStatus]);

  const handleReactivateProfile = async () => {
    setIsReactivating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/reactivate-profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsProfileDeactivated(false);
        setDeactivatedUntil(null);
        setDeactivationReason('');
      }
    } catch (error) {
      console.error('Error reactivating profile:', error);
    } finally {
      setIsReactivating(false);
    }
  };

  const isPro = user?.role === 'pro' || user?.role === 'admin';

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        {t('settings.manageYourAccountSettings')}
      </p>

      {/* Pro Profile Visibility */}
      {isPro && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: isProfileDeactivated ? 'rgba(234, 179, 8, 0.06)' : 'var(--color-bg-tertiary)',
            border: `1px solid ${isProfileDeactivated ? 'rgba(234, 179, 8, 0.2)' : 'var(--color-border-subtle)'}`,
          }}
        >
          {isProfileDeactivated ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-500">
                    {t('settings.profileIsDeactivated')}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {t('settings.yourProfileIsHiddenFrom')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleReactivateProfile}
                loading={isReactivating}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="w-full"
              >
                {t('settings.reactivateProfile')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.temporarilyPause')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.temporarilyHideYourProfileFrom')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenDeactivateModal}
                className="w-full text-yellow-600 border-yellow-400 hover:bg-yellow-50"
              >
                {t('settings.pauseProfile')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10">
        <div className="px-4 py-3 border-b border-red-500/15">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              {t('settings.dangerZone')}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                {t('settings.deleteAccount')}
              </h4>
              <p className="text-sm mt-1 text-neutral-500">
                {t('settings.permanentlyDeleteYourAccountAnd')}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={onOpenDeleteModal}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {t('settings.deleteAccount')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <IconBadge icon={User} variant="neutral" size="md" />
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {user?.name}
            </p>
            <p className="text-xs mt-0.5 text-neutral-500">
              {user?.email || user?.phone}
            </p>
            <p className="text-xs mt-1 text-neutral-400">
              {t('settings.accountId')} #{user?.uid || 'N/A'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

