'use client';

import { AlertCircle, Bell, BriefcaseBusiness, CheckCircle2, FileText, Mail, Megaphone, MessageSquare, Shield, Smartphone } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

// Types for notification preferences
interface NotificationPreferences {
  email: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
    marketing: boolean;
  };
  push: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
  };
  sms: {
    enabled: boolean;
    proposals: boolean;
    messages: boolean;
  };
}

interface NotificationSettingsData {
  email: string | null;
  isEmailVerified: boolean;
  phone: string | null;
  isPhoneVerified: boolean;
  preferences: NotificationPreferences;
}

interface NotificationSettingsProps {
  locale: string;
  notificationData: NotificationSettingsData | null;
  isLoading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onUpdatePreference: (channel: 'email' | 'push' | 'sms', key: string, value: boolean) => void;
  onAddEmail: () => void;
  onRetry: () => void;
}

// Notification item component
function NotificationItem({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  variant = 'primary',
  size = 'sm',
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'primary' | 'violet' | 'success';
  size?: 'sm' | 'md';
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>
          )}
        </div>
      </div>
      <Toggle
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        variant={variant}
        size={size}
      />
    </div>
  );
}

// Notification section header
function NotificationSectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconBgColor,
  iconColor,
  enabled,
  onToggle,
  variant,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  variant?: 'primary' | 'violet' | 'success';
  action?: React.ReactNode;
}) {
  return (
    <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBgColor }}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          {subtitle && (
            <div className="mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action ? action : onToggle && enabled !== undefined && (
        <Toggle
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          variant={variant}
        />
      )}
    </div>
  );
}

export default function NotificationSettings({
  locale,
  notificationData,
  isLoading,
  message,
  onUpdatePreference,
  onAddEmail,
  onRetry,
}: NotificationSettingsProps) {
  const t = {
    title: locale === 'ka' ? 'შეტყობინებები' : 'Notifications',
    subtitle: locale === 'ka' ? 'აირჩიეთ როგორ გსურთ შეტყობინებების მიღება' : 'Choose how you want to receive notifications',
    loading: locale === 'ka' ? 'იტვირთება...' : 'Loading...',
    loadFailed: locale === 'ka' ? 'პარამეტრების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load preferences',
    tryAgain: locale === 'ka' ? 'თავიდან ცდა' : 'Try again',
    email: locale === 'ka' ? 'ელ-ფოსტა' : 'Email',
    noEmail: locale === 'ka' ? 'ელ-ფოსტა არ არის დამატებული' : 'No email added',
    addEmail: locale === 'ka' ? 'დამატება' : 'Add Email',
    verified: locale === 'ka' ? 'დადასტურებული' : 'Verified',
    unverified: locale === 'ka' ? 'დასადასტურებელი' : 'Unverified',
    push: locale === 'ka' ? 'Push შეტყობინებები' : 'Push Notifications',
    pushDesc: locale === 'ka' ? 'ბრაუზერისა და აპის შეტყობინებები' : 'Browser and app notifications',
    sms: locale === 'ka' ? 'SMS შეტყობინებები' : 'SMS Notifications',
    noPhone: locale === 'ka' ? 'ტელეფონი არ არის დამატებული' : 'No phone added',
    unavailable: locale === 'ka' ? 'მიუწვდომელია' : 'Unavailable',
    newJobs: locale === 'ka' ? 'ახალი სამუშაოები' : 'New Jobs',
    newJobsDesc: locale === 'ka' ? 'როცა შენს კატეგორიაში ახალი სამუშაო დაიდება' : 'When new jobs match your categories',
    proposals: locale === 'ka' ? 'შეთავაზებები' : 'Proposals',
    proposalsDesc: locale === 'ka' ? 'როცა სპეციალისტი გამოგიგზავნის შეთავაზებას' : 'When a pro sends you a proposal',
    messages: locale === 'ka' ? 'შეტყობინებები' : 'Messages',
    messagesDesc: locale === 'ka' ? 'როცა ახალ შეტყობინებას მიიღებ' : 'When you receive a new message',
    marketing: locale === 'ka' ? 'მარკეტინგი' : 'Marketing',
    marketingDesc: locale === 'ka' ? 'სიახლეები და სპეციალური შეთავაზებები' : 'News and special offers',
    dataProtected: locale === 'ka' ? 'თქვენი მონაცემები დაცულია' : 'Your data is protected',
    dataProtectedDesc: locale === 'ka' ? 'ჩვენ არასდროს გავყიდით თქვენს ინფორმაციას მესამე მხარეს' : 'We never sell your information to third parties',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type} size="sm" className="animate-fade-in">
          {message.text}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" color="#C4735B" />
          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {t.loading}
          </span>
        </div>
      ) : notificationData ? (
        <div className="space-y-6">
          {/* Email Notifications Section */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <NotificationSectionHeader
              icon={Mail}
              title={t.email}
              iconBgColor="rgba(210, 105, 30, 0.1)"
              iconColor="text-[#E07B4F]"
              subtitle={
                notificationData.email ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notificationData.email}</span>
                    {notificationData.isEmailVerified ? (
                      <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3 h-3" />}>
                        {t.verified}
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="xs" icon={<AlertCircle className="w-3 h-3" />}>
                        {t.unverified}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {t.noEmail}
                  </span>
                )
              }
              enabled={notificationData.email ? notificationData.preferences.email.enabled : undefined}
              onToggle={notificationData.email ? (v) => onUpdatePreference('email', 'enabled', v) : undefined}
              variant="primary"
              action={!notificationData.email ? (
                <button
                  onClick={onAddEmail}
                  className="px-3 py-1.5 text-sm font-medium text-[#E07B4F] bg-[#E07B4F]/10 hover:bg-[#E07B4F]/20 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  {t.addEmail}
                </button>
              ) : undefined}
            />

            {notificationData.email && notificationData.preferences.email.enabled && (
              <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                <NotificationItem
                  icon={BriefcaseBusiness}
                  label={t.newJobs}
                  description={t.newJobsDesc}
                  checked={notificationData.preferences.email.newJobs}
                  onChange={(v) => onUpdatePreference('email', 'newJobs', v)}
                  variant="primary"
                />
                <NotificationItem
                  icon={FileText}
                  label={t.proposals}
                  description={t.proposalsDesc}
                  checked={notificationData.preferences.email.proposals}
                  onChange={(v) => onUpdatePreference('email', 'proposals', v)}
                  variant="primary"
                />
                <NotificationItem
                  icon={MessageSquare}
                  label={t.messages}
                  description={t.messagesDesc}
                  checked={notificationData.preferences.email.messages}
                  onChange={(v) => onUpdatePreference('email', 'messages', v)}
                  variant="primary"
                />
                <NotificationItem
                  icon={Megaphone}
                  label={t.marketing}
                  description={t.marketingDesc}
                  checked={notificationData.preferences.email.marketing}
                  onChange={(v) => onUpdatePreference('email', 'marketing', v)}
                  variant="primary"
                />
              </div>
            )}
          </div>

          {/* Push Notifications Section */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <NotificationSectionHeader
              icon={Bell}
              title={t.push}
              subtitle={<span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.pushDesc}</span>}
              iconBgColor="rgba(139, 92, 246, 0.1)"
              iconColor="text-violet-500"
              enabled={notificationData.preferences.push.enabled}
              onToggle={(v) => onUpdatePreference('push', 'enabled', v)}
              variant="violet"
            />

            {notificationData.preferences.push.enabled && (
              <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                <NotificationItem
                  icon={BriefcaseBusiness}
                  label={t.newJobs}
                  checked={notificationData.preferences.push.newJobs}
                  onChange={(v) => onUpdatePreference('push', 'newJobs', v)}
                  variant="violet"
                />
                <NotificationItem
                  icon={FileText}
                  label={t.proposals}
                  checked={notificationData.preferences.push.proposals}
                  onChange={(v) => onUpdatePreference('push', 'proposals', v)}
                  variant="violet"
                />
                <NotificationItem
                  icon={MessageSquare}
                  label={t.messages}
                  checked={notificationData.preferences.push.messages}
                  onChange={(v) => onUpdatePreference('push', 'messages', v)}
                  variant="violet"
                />
              </div>
            )}
          </div>

          {/* SMS Notifications Section */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <NotificationSectionHeader
              icon={Smartphone}
              title={t.sms}
              iconBgColor="rgba(34, 197, 94, 0.1)"
              iconColor="text-green-500"
              subtitle={
                notificationData.phone ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notificationData.phone}</span>
                    {notificationData.isPhoneVerified && (
                      <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3 h-3" />}>
                        {t.verified}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {t.noPhone}
                  </span>
                )
              }
              enabled={notificationData.phone ? notificationData.preferences.sms.enabled : undefined}
              onToggle={notificationData.phone ? (v) => onUpdatePreference('sms', 'enabled', v) : undefined}
              variant="success"
              action={!notificationData.phone ? (
                <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-tertiary)' }}>
                  {t.unavailable}
                </span>
              ) : undefined}
            />

            {notificationData.phone && notificationData.preferences.sms.enabled && (
              <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                <NotificationItem
                  icon={FileText}
                  label={t.proposals}
                  checked={notificationData.preferences.sms.proposals}
                  onChange={(v) => onUpdatePreference('sms', 'proposals', v)}
                  variant="success"
                />
                <NotificationItem
                  icon={MessageSquare}
                  label={t.messages}
                  checked={notificationData.preferences.sms.messages}
                  onChange={(v) => onUpdatePreference('sms', 'messages', v)}
                  variant="success"
                />
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {t.dataProtected}
              </p>
              <p className="text-xs mt-1 text-blue-600/70 dark:text-blue-400/70">
                {t.dataProtectedDesc}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {t.loadFailed}
          </p>
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F]"
          >
            {t.tryAgain}
          </button>
        </div>
      )}
    </div>
  );
}
