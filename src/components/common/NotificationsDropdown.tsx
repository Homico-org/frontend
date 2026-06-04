'use client';

import TimeAgo from '@/components/common/TimeAgo';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ACCENT_COLOR } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Notification, useNotifications } from '@/contexts/NotificationContext';
import {
  Bell,
  Briefcase,
  CheckCheck,
  ChevronRight,
  MessageSquare,
  Megaphone,
  Shield,
  Star,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type IconType = typeof Briefcase;

const typeIcon: Record<string, IconType> = {
  new_proposal: Briefcase,
  proposal_accepted: CheckCheck,
  proposal_rejected: Briefcase,
  job_completed: CheckCheck,
  job_cancelled: Briefcase,
  job_invitation: Briefcase,
  new_message: MessageSquare,
  new_review: Star,
  account_verified: Shield,
  profile_update: UserCheck,
  profile_approved: CheckCheck,
  profile_rejected: Briefcase,
  new_booking: Briefcase,
  booking_confirmed: CheckCheck,
  booking_started: Briefcase,
  booking_cancelled: Briefcase,
  booking_completed: CheckCheck,
  review_prompt: Star,
  system_announcement: Megaphone,
};

const titleToTypeMap: Record<string, string> = {
  'New Booking Request': 'new_booking',
  'Booking Confirmed': 'booking_confirmed',
  'Work Started': 'booking_started',
  'Booking Cancelled': 'booking_cancelled',
  'Booking Completed': 'booking_completed',
  'Work Completed': 'work_completed',
  'How was your experience?': 'review_prompt',
  'New Proposal': 'new_proposal',
  'Proposal Accepted': 'proposal_accepted',
  'Proposal Rejected': 'proposal_rejected',
  'Job Completed': 'job_completed',
  'Job Cancelled': 'job_cancelled',
  'Job Invitation': 'job_invitation',
  'New Message': 'new_message',
  'New Review': 'new_review',
  'Account Verified': 'account_verified',
  'Profile Update': 'profile_update',
  'Profile Approved': 'profile_approved',
  'Profile Needs Updates': 'profile_rejected',
  'System Announcement': 'system_announcement',
};

function translateNotification(
  n: Notification,
  t: (k: string, p?: Record<string, string | number>) => string,
): { title: string; message: string } {
  if (n.titleKey || n.messageKey) {
    const params = n.i18nParams || {};
    const tt = n.titleKey ? t(n.titleKey, params) : n.title;
    const tm = n.messageKey ? t(n.messageKey, params) : n.message;
    return {
      title: tt !== n.titleKey ? tt : n.title,
      message: tm !== n.messageKey ? tm : n.message,
    };
  }
  const resolvedKey = titleToTypeMap[n.title] || n.type;
  const titleKey = `notifications.types.${resolvedKey}.title`;
  const messageKey = `notifications.types.${resolvedKey}.message`;
  const tt = t(titleKey);
  const tm = t(messageKey);
  return {
    title: tt !== titleKey ? tt : n.title,
    message: tm !== messageKey ? tm : n.message,
  };
}

const MAX_ITEMS = 6;

interface NotificationsDropdownProps {
  onClose: () => void;
}

export default function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [tab, setTab] = useState<'unread' | 'all'>(unreadCount > 0 ? 'unread' : 'all');

  // The provider only auto-fetches the unread COUNT on mount - it never
  // hydrates the actual notification list. Without this effect the
  // dropdown (and mobile bottom sheet) opens to an empty state even
  // though the bell shows a count, because the only items in context
  // are whatever the WebSocket pushed since this session started.
  useEffect(() => {
    fetchNotifications({ limit: 20 });
  }, [fetchNotifications]);

  const filtered = useMemo(() => {
    const base = tab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
    return base.slice(0, MAX_ITEMS);
  }, [notifications, tab]);

  const handleItemClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await markAsRead([n.id]);
      } catch {
        // Non-fatal: the dropdown still dismisses and the user can refresh later.
      }
    }
    onClose();
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="flex flex-col max-h-[min(560px,80vh)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--hm-border-subtle)]">
        <h3 className="text-[15px] font-semibold text-[var(--hm-fg-primary)]">
          {t('notifications.title')}
        </h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-[12px] font-medium hover:opacity-80 transition-opacity"
            style={{ color: ACCENT_COLOR }}
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--hm-border-subtle)]">
        <TabButton active={tab === 'unread'} onClick={() => setTab('unread')}>
          {t('notifications.filters.unread')}
          {unreadCount > 0 && (
            <span
              className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: ACCENT_COLOR }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
          {t('notifications.filters.all')}
        </TabButton>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="sm" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: `${ACCENT_COLOR}14` }}
            >
              <Bell className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
            </div>
            <p className="text-[13px] text-[var(--hm-fg-secondary)]">
              {t('notifications.noNotifications')}
            </p>
          </div>
        ) : (
          <ul className="py-1">
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onClick={() => handleItemClick(n)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer - Show all */}
      <Link
        href="/notifications"
        onClick={onClose}
        className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-[var(--hm-border-subtle)] text-[13px] font-semibold hover:bg-[var(--hm-bg-tertiary)] transition-colors"
        style={{ color: ACCENT_COLOR }}
      >
        {t('notifications.showAll')}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 text-[13px] font-medium transition-colors"
      style={{
        color: active ? 'var(--hm-fg-primary)' : 'var(--hm-fg-muted)',
        borderBottom: active
          ? `2px solid ${ACCENT_COLOR}`
          : '2px solid transparent',
      }}
    >
      {children}
    </button>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const { t, locale } = useLanguage();
  const Icon = typeIcon[notification.type] || Bell;
  const translated = useMemo(
    () => translateNotification(notification, t),
    [notification, t, locale], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--hm-bg-tertiary)] transition-colors relative"
      >
        {/* Unread dot rail */}
        {!notification.isRead && (
          <span
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT_COLOR }}
            aria-hidden
          />
        )}

        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${ACCENT_COLOR}14` }}
        >
          <Icon className="w-4 h-4" style={{ color: ACCENT_COLOR }} strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-[13px] leading-snug truncate ${
                notification.isRead
                  ? 'text-[var(--hm-fg-secondary)] font-medium'
                  : 'text-[var(--hm-fg-primary)] font-semibold'
              }`}
            >
              {translated.title}
            </p>
            <TimeAgo
              isoDate={notification.createdAt}
              variant="compact"
              className="text-[10px] text-[var(--hm-fg-muted)] whitespace-nowrap flex-shrink-0 mt-0.5"
            />
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--hm-fg-muted)] line-clamp-2">
            {translated.message}
          </p>
        </div>
      </button>
    </li>
  );
}
