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

// Notification type configurations
const notificationConfig: Record<NotificationType, { icon: any; color: string; bgColor: string; gradient: string }> = {
  new_proposal: {
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    gradient: 'from-blue-500/20 to-blue-600/5'
  },
  proposal_accepted: {
    icon: CheckCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-emerald-600/5'
  },
  proposal_rejected: {
    icon: Briefcase,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    gradient: 'from-red-500/20 to-red-600/5'
  },
  job_completed: {
    icon: CheckCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-emerald-600/5'
  },
  job_cancelled: {
    icon: Briefcase,
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-500/10',
    gradient: 'from-neutral-500/20 to-neutral-600/5'
  },
  new_message: {
    icon: MessageSquare,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    gradient: 'from-violet-500/20 to-violet-600/5'
  },
  new_review: {
    icon: Star,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    gradient: 'from-amber-500/20 to-amber-600/5'
  },
  account_verified: {
    icon: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-emerald-600/5'
  },
  profile_update: {
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    gradient: 'from-cyan-500/20 to-cyan-600/5'
  },
  system_announcement: {
    icon: Megaphone,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-orange-600/5'
  },
};

type FilterKey = 'all' | 'unread' | 'jobs' | 'messages' | 'reviews';

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
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

    if (diffInSeconds < 60) return language === 'ka' ? 'ახლახანს' : 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return language === 'ka' ? `${mins} წუთის წინ` : `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'ka' ? `${hours} საათის წინ` : `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return language === 'ka' ? `${days} დღის წინ` : `${days}d ago`;
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
          <div className="w-16 h-16 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
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
            className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-200 transition-all duration-300 mb-6"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{language === 'ka' ? 'უკან' : 'Back'}</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Animated Bell Icon */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%)',
                    boxShadow: '0 0 40px rgba(52, 211, 153, 0.1)',
                  }}
                >
                  <Bell className="w-6 h-6 text-primary-400" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-50">
                  {language === 'ka' ? 'შეტყობინებები' : 'Notifications'}
                </h1>
                <p className="mt-1 text-neutral-400 text-sm">
                  {unreadCount > 0
                    ? language === 'ka'
                      ? `${unreadCount} წაუკითხავი შეტყობინება`
                      : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : language === 'ka'
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
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  color: 'rgb(52, 211, 153)',
                }}
              >
                <Check className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">{language === 'ka' ? 'ყველას წაკითხვა' : 'Mark all read'}</span>
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={notifications.length === 0 || isDeleting}
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'rgb(239, 68, 68)',
                }}
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">{language === 'ka' ? 'ყველას წაშლა' : 'Clear all'}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'text-dark-bg'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                style={{
                  backgroundColor: activeFilter === filter.key ? 'rgb(52, 211, 153)' : 'rgba(255, 255, 255, 0.05)',
                  border: activeFilter === filter.key ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {language === 'ka' ? filter.labelKa : filter.label}
                {filter.key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
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
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-700/50" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-neutral-700/50" />
                    <div className="h-3 w-1/2 rounded bg-neutral-700/30" />
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
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              }}
            >
              <Bell className="h-10 w-10 text-neutral-600" />
            </div>
            <h3 className="text-xl font-serif font-medium text-neutral-200 mb-2">
              {activeFilter === 'unread'
                ? language === 'ka' ? 'წაუკითხავი შეტყობინებები არ არის' : 'No unread notifications'
                : language === 'ka' ? 'შეტყობინებები არ არის' : 'No notifications yet'}
            </h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {language === 'ka'
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
                  className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-500 hover:scale-[1.01] ${
                    !notification.isRead ? 'ring-1 ring-primary-500/30' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Unread indicator glow */}
                  {!notification.isRead && (
                    <div
                      className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${config.gradient})`,
                      }}
                    />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor}`}
                    >
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm sm:text-base ${!notification.isRead ? 'text-neutral-100' : 'text-neutral-300'}`}>
                            {notification.title}
                          </h4>
                          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Time & Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Link indicator */}
                      {notification.link && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-primary-400 group-hover:text-primary-300 transition-colors duration-300">
                          <span>{language === 'ka' ? 'დეტალების ნახვა' : 'View details'}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary-400 shadow-lg shadow-primary-400/50" />
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
