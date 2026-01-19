'use client';

import api from '@/lib/api';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
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
    isRead: n.isRead,
    link: n.link,
    referenceId: n.referenceId,
    referenceModel: n.referenceModel,
    metadata: n.metadata,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for WebSocket management
  const socketRef = useRef<Socket | null>(null);
  const initialFetchDoneRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get(`/notifications/unread-count`);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));
      if (options?.unreadOnly) params.append('unreadOnly', 'true');

      const response = await api.get(`/notifications?${params.toString()}`);
      setNotifications(response.data.notifications.map(transformNotification));
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
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
    console.log('[Notifications] New notification received:', notification.type);

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
      const audio = new Audio('/sounds/notification.mp3');
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

    // Create socket connection to notifications namespace
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Notifications] WebSocket connected');
      setIsConnected(true);

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Notifications] WebSocket disconnected:', reason);
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
    }
  }, [authLoading, isAuthenticated, refreshUnreadCount]);

  // No polling fallback - WebSocket has built-in reconnection logic
  // If WS disconnects, it will auto-reconnect and sync counts

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshUnreadCount,
  }), [notifications, unreadCount, isLoading, isConnected, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, refreshUnreadCount]);

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
