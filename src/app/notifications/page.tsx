'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import Header, { HeaderSpacer } from '@/components/common/Header';
import {
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
  Sparkles,
  Filter,
  X
} from 'lucide-react';

// Notification type configurations
const notificationConfig: Record<NotificationType, { icon: any; color: string; bgColor: string }> = {
  new_proposal: {
    icon: Briefcase,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  proposal_accepted: {
    icon: CheckCheck,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  proposal_rejected: {
    icon: Briefcase,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  job_completed: {
    icon: CheckCheck,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  job_cancelled: {
    icon: Briefcase,
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
  },
  new_message: {
    icon: MessageSquare,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  new_review: {
    icon: Star,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  account_verified: {
    icon: Shield,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  profile_update: {
    icon: Sparkles,
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
  system_announcement: {
    icon: Megaphone,
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
  },
};

type FilterKey = 'all' | 'unread' | 'jobs' | 'messages' | 'reviews';

// Swipeable notification card component
function SwipeableNotificationCard({
  notification,
  onDelete,
  onClick,
  formatTimeAgo,
  locale,
}: {
  notification: Notification;
  onDelete: () => void;
  onClick: () => void;
  formatTimeAgo: (date: string) => string;
  locale: string;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const config = notificationConfig[notification.type] || notificationConfig.system_announcement;
  const Icon = config.icon;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Only allow left swipe (negative values)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -60) {
      // Trigger delete
      setTranslateX(-100);
      setTimeout(onDelete, 200);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500"
        style={{ opacity: Math.min(Math.abs(translateX) / 60, 1) }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => translateX === 0 && onClick()}
        className="relative bg-white dark:bg-neutral-900 transition-transform cursor-pointer active:bg-neutral-50 dark:active:bg-neutral-800"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`text-sm font-medium leading-snug ${
                  !notification.isRead ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {notification.title}
              </h4>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#C4735B] flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500 line-clamp-2">
              {notification.message}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
                {formatTimeAgo(notification.createdAt)}
              </span>
              {notification.link && (
                <span className="text-[11px] text-[#C4735B] flex items-center gap-0.5">
                  {locale === 'ka' ? 'ნახვა' : 'View'}
                  <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Group notifications by date
function groupNotificationsByDate(notifications: Notification[], locale: string) {
  const groups: { label: string; notifications: Notification[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const todayGroup: Notification[] = [];
  const yesterdayGroup: Notification[] = [];
  const thisWeekGroup: Notification[] = [];
  const olderGroup: Notification[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      todayGroup.push(n);
    } else if (date.getTime() === yesterday.getTime()) {
      yesterdayGroup.push(n);
    } else if (date >= thisWeek) {
      thisWeekGroup.push(n);
    } else {
      olderGroup.push(n);
    }
  });

  if (todayGroup.length > 0) {
    groups.push({ label: locale === 'ka' ? 'დღეს' : 'Today', notifications: todayGroup });
  }
  if (yesterdayGroup.length > 0) {
    groups.push({ label: locale === 'ka' ? 'გუშინ' : 'Yesterday', notifications: yesterdayGroup });
  }
  if (thisWeekGroup.length > 0) {
    groups.push({ label: locale === 'ka' ? 'ამ კვირაში' : 'This Week', notifications: thisWeekGroup });
  }
  if (olderGroup.length > 0) {
    groups.push({ label: locale === 'ka' ? 'ძველი' : 'Older', notifications: olderGroup });
  }

  return groups;
}

function NotificationsPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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

  const filters: { key: FilterKey; label: string; labelKa: string; count?: number }[] = [
    { key: 'all', label: 'All', labelKa: 'ყველა' },
    { key: 'unread', label: 'Unread', labelKa: 'წაუკითხავი', count: unreadCount },
    { key: 'jobs', label: 'Jobs', labelKa: 'სამუშაოები' },
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

  const groupedNotifications = groupNotificationsByDate(filteredNotifications, locale);

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return locale === 'ka' ? 'ახლახანს' : 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return locale === 'ka' ? `${mins} წთ წინ` : `${mins}m`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return locale === 'ka' ? `${hours} სთ წინ` : `${hours}h`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return locale === 'ka' ? `${days} დღე` : `${days}d`;
  }, [locale]);

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
    await deleteAllNotifications();
  };

  const currentFilter = filters.find(f => f.key === activeFilter);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <Header />
      <HeaderSpacer />

      {/* Sticky Header */}
      <div className="sticky top-14 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          {/* Title Row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {locale === 'ka' ? 'შეტყობინებები' : 'Notifications'}
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[#C4735B] text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title={locale === 'ka' ? 'ყველას წაკითხვა' : 'Mark all read'}
                >
                  <CheckCheck className="w-5 h-5 text-[#C4735B]" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title={locale === 'ka' ? 'ყველას წაშლა' : 'Clear all'}
                >
                  <Trash2 className="w-5 h-5 text-neutral-400 hover:text-red-500 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs - Desktop */}
          <div className="hidden sm:flex px-4 pb-3 gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeFilter === filter.key
                    ? 'bg-[#C4735B] text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {locale === 'ka' ? filter.labelKa : filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeFilter === filter.key ? 'bg-white/20' : 'bg-[#C4735B]/10 text-[#C4735B]'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter Button - Mobile */}
          <div className="sm:hidden px-4 pb-3">
            <button
              onClick={() => setShowFilterMenu(true)}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'ka' ? currentFilter?.labelKa : currentFilter?.label}</span>
              {activeFilter === 'unread' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-[#C4735B] text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showFilterMenu && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFilterMenu(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-2xl animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'ფილტრი' : 'Filter'}
                </h3>
                <button
                  onClick={() => setShowFilterMenu(false)}
                  className="p-2 -mr-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="space-y-1">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setActiveFilter(filter.key);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeFilter === filter.key
                        ? 'bg-[#C4735B]/10 text-[#C4735B]'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="font-medium">{locale === 'ka' ? filter.labelKa : filter.label}</span>
                    <div className="flex items-center gap-2">
                      {filter.count !== undefined && filter.count > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-[#C4735B] text-white rounded-full">
                          {filter.count}
                        </span>
                      )}
                      {activeFilter === filter.key && (
                        <Check className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Safe area padding */}
            <div className="h-8" />
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto pb-20">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {activeFilter === 'unread'
                ? locale === 'ka' ? 'წაუკითხავი არ არის' : 'All caught up!'
                : locale === 'ka' ? 'შეტყობინებები არ არის' : 'No notifications'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 max-w-xs mx-auto">
              {activeFilter === 'unread'
                ? locale === 'ka' ? 'ყველა შეტყობინება წაკითხულია' : "You've read all your notifications"
                : locale === 'ka' ? 'ახალი შეტყობინებები აქ გამოჩნდება' : "New notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                {/* Date Label */}
                <div className="px-4 py-2 sticky top-[116px] sm:top-[140px] z-10">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                    {group.label}
                  </span>
                </div>

                {/* Notifications */}
                <div className="px-4 space-y-2">
                  {group.notifications.map((notification) => (
                    <SwipeableNotificationCard
                      key={notification._id}
                      notification={notification}
                      onDelete={() => deleteNotification(notification._id)}
                      onClick={() => handleNotificationClick(notification)}
                      formatTimeAgo={formatTimeAgo}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Swipe hint for mobile */}
        {filteredNotifications.length > 0 && (
          <div className="sm:hidden px-4 py-6 text-center">
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              {locale === 'ka' ? 'გადაასრიალე მარცხნივ წასაშლელად' : 'Swipe left to delete'}
            </p>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsPageContent />
    </AuthGuard>
  );
}
