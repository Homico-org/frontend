'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
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
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-500/15',
  },
  proposal_rejected: {
    icon: Briefcase,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-500/15',
  },
  job_completed: {
    icon: CheckCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-500/15',
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
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-500/15',
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
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 50 });
    }
  }, [isAuthenticated, fetchNotifications]);

  const filters: { key: FilterKey; label: string; labelKa: string }[] = [
    { key: 'all', label: 'All', labelKa: 'ყველა' },
    { key: 'unread', label: 'Unread', labelKa: 'წაუკითხავი' },
    { key: 'jobs', label: 'Jobs', labelKa: 'სამუშაოები' },
    { key: 'messages', label: 'Messages', labelKa: 'შეტყობინებები' },
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
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 dark:border-primary-500/20 border-t-emerald-500 dark:border-t-primary-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bell className="w-6 h-6 text-emerald-500 dark:text-primary-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header Section */}
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
            onClick={() => router.push('/browse')}
            className="group inline-flex items-center gap-2 text-sm transition-all duration-300 mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{locale === 'ka' ? 'უკან' : 'Back'}</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Animated Bell Icon */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/15"
                >
                  <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
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
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
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
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {locale === 'ka' ? filter.labelKa : filter.label}
                {filter.key === 'unread' && unreadCount > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeFilter === filter.key ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
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
                className="rounded-2xl p-5 animate-pulse"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-neutral-700/50" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700/50" />
                    <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-neutral-700/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div
            className="rounded-3xl p-12 text-center"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-gray-100 dark:bg-white/5"
            >
              <Bell className="h-10 w-10 text-gray-400 dark:text-neutral-600" />
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
                  className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    !notification.isRead ? 'ring-1 ring-emerald-500/30 dark:ring-primary-500/30' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Unread indicator background */}
                  {!notification.isRead && (
                    <div
                      className="absolute inset-0 rounded-2xl opacity-30 dark:opacity-50 pointer-events-none bg-emerald-50 dark:bg-emerald-500/10"
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
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-primary-400 group-hover:text-emerald-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                          <span>{locale === 'ka' ? 'დეტალების ნახვა' : 'View details'}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-primary-400 shadow-lg shadow-emerald-500/50 dark:shadow-primary-400/50" />
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
