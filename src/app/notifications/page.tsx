'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import {
  ArrowLeft,
  Bell,
  Check,
  Trash2,
  Briefcase,
  MessageSquare,
  Star,
  Shield,
  Megaphone,
  CheckCheck,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// Notification type configurations with theme-aware colors
const notificationConfig: Record<NotificationType, { icon: any; colorClass: string; bgClass: string }> = {
  new_proposal: {
    icon: Briefcase,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-500/15',
  },
  proposal_accepted: {
    icon: CheckCheck,
    colorClass: 'text-[#E07B4F] dark:text-[#E8956A]',
    bgClass: 'bg-[#E07B4F]/10 dark:bg-[#E07B4F]/15',
  },
  proposal_rejected: {
    icon: Briefcase,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-500/15',
  },
  job_completed: {
    icon: CheckCheck,
    colorClass: 'text-[#E07B4F] dark:text-[#E8956A]',
    bgClass: 'bg-[#E07B4F]/10 dark:bg-[#E07B4F]/15',
  },
  job_cancelled: {
    icon: Briefcase,
    colorClass: 'text-gray-600 dark:text-neutral-400',
    bgClass: 'bg-gray-100 dark:bg-neutral-500/15',
  },
  new_message: {
    icon: MessageSquare,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-500/15',
  },
  new_review: {
    icon: Star,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-500/15',
  },
  account_verified: {
    icon: Shield,
    colorClass: 'text-[#E07B4F] dark:text-[#E8956A]',
    bgClass: 'bg-[#E07B4F]/10 dark:bg-[#E07B4F]/15',
  },
  profile_update: {
    icon: Sparkles,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-100 dark:bg-cyan-500/15',
  },
  system_announcement: {
    icon: Megaphone,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-500/15',
  },
};

type FilterKey = 'all' | 'unread' | 'jobs' | 'messages' | 'reviews';

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/notifications');
    }
  }, [authLoading, isAuthenticated, openLoginModal]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 50 });
    }
  }, [isAuthenticated, fetchNotifications]);

  const filters: { key: FilterKey; label: string; labelKa: string }[] = [
    { key: 'all', label: 'All', labelKa: 'ყველა' },
    { key: 'unread', label: 'Unread', labelKa: 'წაუკითხავი' },
    { key: 'reviews', label: 'Reviews', labelKa: 'შეფასებები' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    switch (activeFilter) {
      case 'unread':
        return !n.isRead;
      case 'jobs':
        return ['new_proposal', 'proposal_accepted', 'proposal_rejected', 'job_completed', 'job_cancelled'].includes(n.type);
      case 'messages':
        return n.type === 'new_message';
      case 'reviews':
        return n.type === 'new_review';
      default:
        return true;
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return locale === 'ka' ? 'ახლახანს' : 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return locale === 'ka' ? `${mins} წუთის წინ` : `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return locale === 'ka' ? `${hours} საათის წინ` : `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return locale === 'ka' ? `${days} დღის წინ` : `${days}d ago`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead([notification._id]);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    await deleteAllNotifications();
    setIsDeleting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#E07B4F]/20 dark:border-[#E07B4F]/20 border-t-[#E07B4F] dark:border-t-[#E07B4F] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#E07B4F] dark:text-[#E8956A] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Background with decorative objects */}
      <AppBackground />

      {/* Main Header */}
      <Header />
      <HeaderSpacer />

      {/* Page Header Section */}
      <div
        className="relative border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(var(--color-bg-secondary-rgb), 0.8)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'rgba(210, 105, 30, 0.08)',
                border: '1px solid rgba(210, 105, 30, 0.12)',
              }}
            >
              <ArrowLeft className="h-4 w-4 text-[#E07B4F] dark:text-[#E8956A] group-hover:-translate-x-0.5 transition-transform duration-300" />
            </div>
            <span className="group-hover:text-[#E07B4F] dark:group-hover:text-[#E8956A] transition-colors">
              {locale === 'ka' ? 'უკან' : 'Back'}
            </span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Animated Bell Icon */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E07B4F]/10 dark:bg-[#E07B4F]/15"
                >
                  <Bell className="w-6 h-6 text-[#E07B4F] dark:text-[#E8956A]" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka' ? 'შეტყობინებები' : 'Notifications'}
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {unreadCount > 0
                    ? locale === 'ka'
                      ? `${unreadCount} წაუკითხავი შეტყობინება`
                      : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : locale === 'ka'
                    ? 'ყველა შეტყობინება წაკითხულია'
                    : 'All caught up'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-[#E07B4F]/5 dark:bg-[#E07B4F]/10 border border-[#E07B4F]/20 dark:border-[#E07B4F]/20 text-[#E07B4F] dark:text-[#E8956A] hover:bg-[#E07B4F]/10 dark:hover:bg-[#E07B4F]/20"
              >
                <Check className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">{locale === 'ka' ? 'ყველას წაკითხვა' : 'Mark all read'}</span>
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={notifications.length === 0 || isDeleting}
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">{locale === 'ka' ? 'ყველას წაშლა' : 'Clear all'}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 border ${
                  activeFilter === filter.key
                    ? 'bg-[#E07B4F] text-white border-[#E07B4F]'
                    : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {locale === 'ka' ? filter.labelKa : filter.label}
                {filter.key === 'unread' && unreadCount > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeFilter === filter.key ? 'bg-white/20' : 'bg-[#E07B4F]/10 dark:bg-[#E07B4F]/20 text-[#E07B4F] dark:text-[#E8956A]'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-pulse backdrop-blur-md"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)',
                  border: '1px solid rgba(210, 105, 30, 0.1)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E07B4F]/8" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-[#E07B4F]/8" />
                    <div className="h-3 w-1/2 rounded bg-[#E07B4F]/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State - Glassmorphic transparent card */
          <div
            className="rounded-3xl p-12 text-center backdrop-blur-xl"
            style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
              border: '1px solid rgba(210, 105, 30, 0.15)',
              boxShadow: '0 8px 32px rgba(210, 105, 30, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(210, 105, 30, 0.12) 0%, rgba(210, 105, 30, 0.06) 100%)',
                border: '1px solid rgba(210, 105, 30, 0.1)',
              }}
            >
              <Bell className="h-10 w-10 text-[#E07B4F]/50" />
            </div>
            <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {activeFilter === 'unread'
                ? locale === 'ka' ? 'წაუკითხავი შეტყობინებები არ არის' : 'No unread notifications'
                : locale === 'ka' ? 'შეტყობინებები არ არის' : 'No notifications yet'}
            </h3>
            <p style={{ color: 'var(--color-text-tertiary)' }} className="max-w-sm mx-auto">
              {locale === 'ka'
                ? 'როდესაც მიიღებთ შეტყობინებას, ის აქ გამოჩნდება'
                : "When you receive notifications, they'll appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const config = notificationConfig[notification.type] || notificationConfig.system_announcement;
              const Icon = config.icon;

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-md"
                  style={{
                    background: !notification.isRead
                      ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.25) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)',
                    border: !notification.isRead
                      ? '1px solid rgba(210, 105, 30, 0.2)'
                      : '1px solid rgba(210, 105, 30, 0.1)',
                    boxShadow: !notification.isRead
                      ? '0 4px 20px rgba(210, 105, 30, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                      : 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {/* Unread indicator glow */}
                  {!notification.isRead && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(210, 105, 30, 0.05) 0%, transparent 50%)',
                      }}
                    />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.bgClass}`}
                    >
                      <Icon className={`w-5 h-5 ${config.colorClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-medium text-sm sm:text-base"
                            style={{ color: !notification.isRead ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
                          >
                            {notification.title}
                          </h4>
                          <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                            {notification.message}
                          </p>
                        </div>

                        {/* Time & Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Link indicator */}
                      {notification.link && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#E07B4F] dark:text-[#E8956A] group-hover:text-[#D26B3F] dark:group-hover:text-[#E8956A] transition-colors duration-300">
                          <span>{locale === 'ka' ? 'დეტალების ნახვა' : 'View details'}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-[#E07B4F] dark:bg-[#E8956A] shadow-lg shadow-[#E07B4F]/50 dark:shadow-[#E8956A]/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
