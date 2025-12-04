'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

export type NotificationType =
  | 'new_proposal'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'job_completed'
  | 'job_cancelled'
  | 'new_message'
  | 'new_review'
  | 'account_verified'
  | 'profile_update'
  | 'system_announcement';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  referenceId?: string;
  referenceModel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
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

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/unread-count');
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
      setNotifications(response.data.notifications);
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
          !notificationIds || notificationIds.includes(n._id)
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
      setNotifications(prev => prev.filter(n => n._id !== id));
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

  // Fetch unread count on auth change
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refreshUnreadCount();
    } else if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [authLoading, isAuthenticated, refreshUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshUnreadCount,
      }}
    >
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
