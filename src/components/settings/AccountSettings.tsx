'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, AlertTriangle, BriefcaseBusiness, Check, Trash2, User } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
          {t('settings.accountManagement')}
        </h2>
        <p className="text-sm mt-1 text-neutral-500">
          {t('settings.manageYourAccountSettings')}
        </p>
      </div>

      {/* Pro Profile Deactivation */}
      {isPro && (
        <Card
          className={`overflow-hidden ${isProfileDeactivated ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10' : ''}`}
        >
          <div className={`px-5 py-4 border-b ${isProfileDeactivated ? 'border-yellow-500/15' : 'border-neutral-200 dark:border-neutral-800'}`}>
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className={`w-5 h-5 ${isProfileDeactivated ? 'text-yellow-600' : 'text-[#E07B4F]'}`} />
              <h3 className={`font-semibold ${isProfileDeactivated ? 'text-yellow-600 dark:text-yellow-500' : 'text-neutral-900 dark:text-white'}`}>
                {t('settings.professionalProfile')}
              </h3>
            </div>
          </div>

          <div className="p-5">
            {isProfileDeactivated ? (
              <div className="space-y-4">
                <Alert variant="warning" showIcon>
                  <div>
                    <p className="font-medium">
                      {t('settings.profileIsDeactivated')}
                    </p>
                    <p className="text-sm mt-1 opacity-80">
                      {t('settings.yourProfileIsHiddenFrom')}
                    </p>
                    {deactivatedUntil && (
                      <p className="text-sm mt-2 opacity-80">
                        {t('settings.returns')} {deactivatedUntil.toLocaleDateString(t('settings.enus8'), { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    {deactivationReason && (
                      <p className="text-sm mt-1 opacity-60">
                        {t('settings.reason')} {deactivationReason}
                      </p>
                    )}
                  </div>
                </Alert>
                <Button
                  onClick={handleReactivateProfile}
                  loading={isReactivating}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="w-full"
                >
                  {t('settings.reactivateProfile')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {t('settings.temporarilyPause')}
                  </h4>
                  <p className="text-sm mt-1 text-neutral-500">
                    {t('settings.temporarilyHideYourProfileFrom')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={onOpenDeactivateModal}
                  leftIcon={<BriefcaseBusiness className="w-4 h-4" />}
                  className="w-full sm:w-auto border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                >
                  {t('settings.pauseProfile')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10">
        <div className="px-5 py-4 border-b border-red-500/15">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-600 dark:text-red-400">
              {t('settings.dangerZone')}
            </h3>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">
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

