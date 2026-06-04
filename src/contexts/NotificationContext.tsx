'use client';

import api from '@/lib/api';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const CRITICAL_NOTIFICATION_TYPES = [
  'new_booking',
  'booking_confirmed',
  'booking_started',
  'booking_completed',
] as const;

export type NotificationType =
  | 'new_proposal'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'job_completed'
  | 'job_cancelled'
  | 'job_invitation'
  | 'new_message'
  | 'new_review'
  | 'account_verified'
  | 'profile_update'
  | 'system_announcement'
  | 'profile_approved'
  | 'profile_rejected'
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_started'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'review_prompt';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  // i18n keys + params for localized rendering (added 2026-05). When
  // present, the bell-icon feed calls `t(titleKey, i18nParams)` so
  // the same notification reads in the user's UI language. Falls
  // back to `title` / `message` (always English) for legacy docs.
  titleKey?: string;
  messageKey?: string;
  i18nParams?: Record<string, string | number>;
  isRead: boolean;
  link?: string;
  referenceId?: string;
  referenceModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// Raw notification from API (before transformation)
interface RawNotification {
  _id?: string;
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  i18nParams?: Record<string, string | number>;
  isRead: boolean;
  link?: string;
  referenceId?: string;
  referenceModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// Transform backend response to frontend format
function transformNotification(n: RawNotification): Notification {
  return {
    id: n._id || n.id || '',
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    titleKey: n.titleKey,
    messageKey: n.messageKey,
    i18nParams: n.i18nParams,
    isRead: n.isRead,
    link: n.link,
    referenceId: n.referenceId,
    referenceModel: n.referenceModel,
    metadata: n.metadata,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

// Exact unread counts grouped into the activity-menu categories the header
// renders (tile badges + footer summary). Sourced from the server aggregation
// at GET /notifications/unread-counts-by-category, so they stay accurate even
// when the bell feed is paginated.
export interface ActivityUnreadCounts {
  invitations: number;
  newProposals: number;
  proposalReplies: number;
  bookings: number;
  reviews: number;
}

const EMPTY_ACTIVITY_COUNTS: ActivityUnreadCounts = {
  invitations: 0,
  newProposals: 0,
  proposalReplies: 0,
  bookings: 0,
  reviews: 0,
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  activityCounts: ActivityUnreadCounts;
  refreshActivityCounts: () => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
  fetchNotifications: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => Promise<void>;
  markAsRead: (notificationIds?: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityCounts, setActivityCounts] = useState<ActivityUnreadCounts>(
    EMPTY_ACTIVITY_COUNTS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for WebSocket management
  const socketRef = useRef<Socket | null>(null);
  const initialFetchDoneRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Shared abort refs. Both functions can fire multiple times in quick
  // succession (refreshUnreadCount fires after every markAsRead;
  // fetchNotifications fires on filter change and auth change). Without
  // cancellation, parallel in-flight requests could resolve out of
  // order and clobber state with stale data.
  const refreshUnreadAbortRef = useRef<AbortController | null>(null);
  const fetchNotificationsAbortRef = useRef<AbortController | null>(null);
  const activityCountsAbortRef = useRef<AbortController | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    refreshUnreadAbortRef.current?.abort();
    const controller = new AbortController();
    refreshUnreadAbortRef.current = controller;
    try {
      const response = await api.get(`/notifications/unread-count`, {
        signal: controller.signal,
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError') return;
      if ((error as { code?: string })?.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  const refreshActivityCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    activityCountsAbortRef.current?.abort();
    const controller = new AbortController();
    activityCountsAbortRef.current = controller;
    try {
      const response = await api.get(
        `/notifications/unread-counts-by-category`,
        { signal: controller.signal },
      );
      setActivityCounts({ ...EMPTY_ACTIVITY_COUNTS, ...response.data });
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError') return;
      if ((error as { code?: string })?.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch activity counts:', error);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    if (!isAuthenticated) return;
    fetchNotificationsAbortRef.current?.abort();
    const controller = new AbortController();
    fetchNotificationsAbortRef.current = controller;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));
      if (options?.unreadOnly) params.append('unreadOnly', 'true');

      const response = await api.get(`/notifications?${params.toString()}`, {
        signal: controller.signal,
      });
      setNotifications(response.data.notifications.map(transformNotification));
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError') return;
      if ((error as { code?: string })?.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!isAuthenticated) return;
    try {
      await api.post('/notifications/mark-read', { notificationIds });
      setNotifications(prev =>
        prev.map(n =>
          !notificationIds || notificationIds.includes(n.id)
            ? { ...n, isRead: true }
            : n
        )
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await api.post('/notifications/mark-read', { markAll: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      await refreshUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  const deleteAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }, [isAuthenticated]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((rawNotification: RawNotification) => {
    const notification = transformNotification(rawNotification);

    // Add to notifications list (at the beginning)
    setNotifications(prev => {
      // Check if notification already exists
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });

    // Increment unread count
    setUnreadCount(prev => prev + 1);

    // Play notification sound (optional)
    try {
      const audio = new Audio('/sounds/notification.wav');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch {
      // Ignore audio errors
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Create socket connection to notifications namespace.
    // `auth` is a CALLBACK (not a static object) so every connection
    // attempt - including reconnects - reads the freshest token from
    // localStorage. Without this, a token captured here once goes stale
    // when the JWT expires; the axios interceptor refreshes the stored
    // token on the next HTTP 401, but the socket would keep retrying
    // with the old one and the gateway rejects each attempt with
    // "jwt expired" until a full page reload.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/notifications`, {
      auth: (cb) => cb({ token: localStorage.getItem('access_token') || '' }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // When the axios interceptor refreshes the access token (after a 401),
    // it fires `auth:refresh`. Force an immediate reconnect so the socket
    // re-handshakes with the new token rather than waiting out the backoff
    // or exhausting its 10 reconnect attempts against the expired one.
    const handleTokenRefresh = () => {
      if (!localStorage.getItem('access_token')) return;
      socket.disconnect();
      socket.connect();
    };
    window.addEventListener('auth:refresh', handleTokenRefresh);

    socket.on('connect', () => {
      setIsConnected(true);

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Notifications] Connection error:', error.message);
      setIsConnected(false);
    });

    // Listen for new notifications
    socket.on('notification:new', handleNewNotification);

    // Listen for unread count updates
    socket.on('notification:count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    // Listen for system announcements
    socket.on('notification:system', (notification: Notification) => {
      handleNewNotification(notification);
    });

    return () => {
      window.removeEventListener('auth:refresh', handleTokenRefresh);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notification:new');
      socket.off('notification:count');
      socket.off('notification:system');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, authLoading, handleNewNotification]);

  // Fetch unread count on auth change
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Prevent duplicate initial fetch in React Strict Mode
      if (initialFetchDoneRef.current) return;
      initialFetchDoneRef.current = true;
      refreshUnreadCount();
    } else if (!isAuthenticated) {
      initialFetchDoneRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
      setActivityCounts(EMPTY_ACTIVITY_COUNTS);
    }
  }, [authLoading, isAuthenticated, refreshUnreadCount]);

  // Keep the activity-category counts in sync with the unread total. Any
  // change to unreadCount (a new notification over WS, or a mark-read) means
  // the per-category breakdown may have shifted, so refetch the exact counts.
  // Cheap (one grouped aggregation) and always consistent with the badges.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refreshActivityCounts();
    }
  }, [unreadCount, authLoading, isAuthenticated, refreshActivityCounts]);

  // No polling fallback - WebSocket has built-in reconnection logic
  // If WS disconnects, it will auto-reconnect and sync counts

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    activityCounts,
    refreshActivityCounts,
    isLoading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshUnreadCount,
  }), [notifications, unreadCount, activityCounts, refreshActivityCounts, isLoading, isConnected, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
