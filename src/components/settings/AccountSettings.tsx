'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toggle } from '@/components/ui/Toggle';
import { features } from '@/config/features';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import { AlertCircle, AlertTriangle, BriefcaseBusiness, Check, EyeOff, Moon, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AccountSettingsProps {
  onOpenDeleteModal: () => void;
  onOpenDeactivateModal: () => void;
}

export default function AccountSettings({ onOpenDeleteModal, onOpenDeactivateModal }: AccountSettingsProps) {
  const { user, logout, updateUser } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();

  // Pro availability status. Drives the Away toggle. Profile stays
  // visible in browse but is marked Away + exempt from SLA timers.
  // Different from full deactivation (below) which hides the profile.
  const [proStatus, setProStatus] = useState<'active' | 'busy' | 'away'>(
    (user?.status as 'active' | 'busy' | 'away') ?? 'active',
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // Toggle Away mode. ON => status='away' (SLA exempt, Away pill in
  // browse). OFF => status='active'. Optimistic local state with
  // rollback on failure - the API call is fast and a 4xx is rare,
  // but matters if we ever ship offline support.
  const handleToggleAway = async (nextAway: boolean) => {
    const target: 'active' | 'away' = nextAway ? 'away' : 'active';
    const previous = proStatus;
    setProStatus(target);
    setIsUpdatingStatus(true);
    try {
      await api.post('/users/me/status', { status: target });
      updateUser({ status: target });
    } catch (err) {
      console.error('[AccountSettings] Failed to update status', err);
      setProStatus(previous);
      toast.error(t('common.error'), extractApiErrorMessage(err, t('common.error')));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
      <p className="text-sm text-[var(--hm-fg-muted)]">
        {t('settings.manageYourAccountSettings')}
      </p>

      {/* Away mode (SLA-exempt). Lighter-touch than full deactivation:
          profile stays visible but is clearly marked Away in browse,
          and the accountability cron skips this pro entirely. Pros use
          this for vacation, illness, or busy days when they can't
          guarantee fast response. */}
      {isPro && !isProfileDeactivated && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: proStatus === 'away' ? 'rgba(148, 163, 184, 0.08)' : 'var(--hm-bg-tertiary)',
            border: `1px solid ${proStatus === 'away' ? 'rgba(148, 163, 184, 0.25)' : 'var(--hm-border-subtle)'}`,
          }}
        >
          <Toggle
            checked={proStatus === 'away'}
            disabled={isUpdatingStatus}
            onChange={(e) => handleToggleAway(e.target.checked)}
            label={
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                <Moon className="w-4 h-4 text-[var(--hm-fg-muted)]" />
                {t('settings.awayMode')}
              </span>
            }
            description={t('settings.awayModeDescription')}
          />
        </div>
      )}

      {/* Pro Profile Visibility */}
      {isPro && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: isProfileDeactivated ? 'rgba(234, 179, 8, 0.06)' : 'var(--hm-bg-tertiary)',
            border: `1px solid ${isProfileDeactivated ? 'rgba(234, 179, 8, 0.2)' : 'var(--hm-border-subtle)'}`,
          }}
        >
          {isProfileDeactivated ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-[var(--hm-warning-500)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--hm-warning-500)]">
                    {t('settings.profileIsDeactivated')}
                  </p>
                  <p className="text-xs text-[var(--hm-fg-muted)] mt-0.5">
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
                <p className="text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                  {t('settings.temporarilyPause')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--hm-fg-secondary)' }}>
                  {t('settings.temporarilyHideYourProfileFrom')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenDeactivateModal}
                className="w-full text-[var(--hm-warning-500)] border-yellow-400 hover:bg-[var(--hm-warning-50)]"
              >
                {t('settings.pauseProfile')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone — gated by features.accountDeletion */}
      {features.accountDeletion && (
        <Card className="overflow-hidden border-[var(--hm-error-500)]/30 bg-gradient-to-br from-red-500/5 to-red-500/10">
          <div className="px-4 py-3 border-b border-[var(--hm-error-500)]/15">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--hm-error-500)] shrink-0" />
              <h3 className="text-sm font-semibold text-[var(--hm-error-500)]">
                {t('settings.dangerZone')}
              </h3>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-[var(--hm-fg-primary)]">
                  {t('settings.deleteAccount')}
                </h4>
                <p className="text-sm mt-1 text-[var(--hm-fg-muted)]">
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
      )}

      {/* Account Info */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <IconBadge icon={User} variant="neutral" size="md" />
          <div>
            <p className="text-sm font-medium text-[var(--hm-fg-primary)]">
              {user?.name}
            </p>
            <p className="text-xs mt-0.5 text-[var(--hm-fg-muted)]">
              {user?.email || user?.phone}
            </p>
            <p className="text-xs mt-1 text-[var(--hm-fg-muted)]">
              {t('settings.accountId')} #{user?.uid || 'N/A'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

