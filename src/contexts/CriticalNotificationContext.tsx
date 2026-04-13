'use client';

import api from '@/lib/api';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { CRITICAL_NOTIFICATION_TYPES, Notification, useNotifications } from './NotificationContext';

interface CriticalNotificationContextType {
  currentNotification: Notification | null;
  secondsRemaining: number;
  queueLength: number;
  dismissedNotifications: Notification[];
  dismissCurrent: () => void;
  handlePrimaryAction: () => void;
  clearDismissed: (id: string) => void;
  handleDismissedAction: (id: string) => void;
}

const CriticalNotificationContext = createContext<CriticalNotificationContextType | undefined>(undefined);

const COUNTDOWN_SECONDS: Record<string, number> = {
  new_booking: 30,
  booking_confirmed: 15,
  booking_started: 15,
  booking_completed: 15,
};

function isCriticalType(type: string): boolean {
  return (CRITICAL_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

export function CriticalNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { notifications, markAsRead } = useNotifications();

  const [queue, setQueue] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [dismissedNotifications, setDismissedNotifications] = useState<Notification[]>([]);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const missedCheckDoneRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showNext = useCallback(() => {
    clearTimer();
    setQueue(prev => {
      if (prev.length === 0) {
        setCurrentNotification(null);
        setSecondsRemaining(0);
        return prev;
      }
      const [next, ...rest] = prev;
      setCurrentNotification(next);
      const duration = COUNTDOWN_SECONDS[next.type] || 15;
      setSecondsRemaining(duration);
      return rest;
    });
  }, [clearTimer]);

  // Dismiss moves notification to the header banner list
  const dismissCurrent = useCallback(() => {
    if (currentNotification) {
      setDismissedNotifications(prev => [currentNotification, ...prev]);
    }
    showNext();
  }, [currentNotification, showNext]);

  // Primary action on overlay — acted on, no need for banner
  const handlePrimaryAction = useCallback(() => {
    if (currentNotification) {
      markAsRead([currentNotification.id]);
      if (currentNotification.link) {
        window.location.href = currentNotification.link;
      }
    }
    showNext();
  }, [currentNotification, markAsRead, showNext]);

  // Clear a dismissed notification from the banner
  const clearDismissed = useCallback((id: string) => {
    setDismissedNotifications(prev => prev.filter(n => n.id !== id));
    markAsRead([id]);
  }, [markAsRead]);

  // Act on a dismissed notification from the banner
  const handleDismissedAction = useCallback((id: string) => {
    const notification = dismissedNotifications.find(n => n.id === id);
    if (notification) {
      markAsRead([id]);
      setDismissedNotifications(prev => prev.filter(n => n.id !== id));
      if (notification.link) {
        window.location.href = notification.link;
      }
    }
  }, [dismissedNotifications, markAsRead]);

  const enqueue = useCallback((notification: Notification) => {
    if (seenIdsRef.current.has(notification.id)) return;
    seenIdsRef.current.add(notification.id);

    setCurrentNotification(prev => {
      if (prev === null) {
        const duration = COUNTDOWN_SECONDS[notification.type] || 15;
        setSecondsRemaining(duration);
        return notification;
      }
      setQueue(q => [...q, notification]);
      return prev;
    });
  }, []);

  // Watch for new critical notifications
  const prevNotificationsLengthRef = useRef(0);
  useEffect(() => {
    if (notifications.length === 0) return;
    if (notifications.length <= prevNotificationsLengthRef.current) {
      prevNotificationsLengthRef.current = notifications.length;
      return;
    }
    prevNotificationsLengthRef.current = notifications.length;

    const latest = notifications[0];
    if (latest && isCriticalType(latest.type) && !latest.isRead) {
      enqueue(latest);
    }
  }, [notifications, enqueue]);

  // Countdown timer — auto-dismiss also goes to banner
  useEffect(() => {
    if (!currentNotification) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          // Move to dismissed banner on timeout
          setDismissedNotifications(d => [currentNotification, ...d]);
          setTimeout(() => showNext(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [currentNotification, clearTimer, showNext]);

  // Body scroll lock
  useEffect(() => {
    if (currentNotification) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentNotification]);

  // Check for missed critical notifications on mount and tab focus
  const checkMissed = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications?unreadOnly=true&limit=20');
      const allNotifications: Notification[] = (response.data.notifications || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (n: any) => ({
          id: n._id || n.id || '',
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          link: n.link,
          referenceId: n.referenceId,
          referenceModel: n.referenceModel,
          metadata: n.metadata,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })
      );

      const cutoff = Date.now() - 30 * 60 * 1000;
      const missed = allNotifications.filter(
        n => isCriticalType(n.type) && !seenIdsRef.current.has(n.id) && new Date(n.createdAt).getTime() > cutoff
      );

      missed.forEach(n => enqueue(n));
    } catch {
      // Silently fail
    }
  }, [isAuthenticated, enqueue]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !missedCheckDoneRef.current) {
      missedCheckDoneRef.current = true;
      checkMissed();
    }
    if (!isAuthenticated) {
      missedCheckDoneRef.current = false;
    }
  }, [authLoading, isAuthenticated, checkMissed]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        checkMissed();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isAuthenticated, checkMissed]);

  const contextValue = useMemo(() => ({
    currentNotification,
    secondsRemaining,
    queueLength: queue.length,
    dismissedNotifications,
    dismissCurrent,
    handlePrimaryAction,
    clearDismissed,
    handleDismissedAction,
  }), [currentNotification, secondsRemaining, queue.length, dismissedNotifications, dismissCurrent, handlePrimaryAction, clearDismissed, handleDismissedAction]);

  return (
    <CriticalNotificationContext.Provider value={contextValue}>
      {children}
    </CriticalNotificationContext.Provider>
  );
}

export function useCriticalNotification() {
  const context = useContext(CriticalNotificationContext);
  if (context === undefined) {
    throw new Error('useCriticalNotification must be used within CriticalNotificationProvider');
  }
  return context;
}
