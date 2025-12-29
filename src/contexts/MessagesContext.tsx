'use client';

import api from '@/lib/api';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface MessagesContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Ref to prevent duplicate initial fetch (React Strict Mode)
  const initialFetchDoneRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/conversations/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error);
    }
  }, [isAuthenticated]);

  // Fetch unread count on auth change
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Prevent duplicate initial fetch in React Strict Mode
      if (initialFetchDoneRef.current) return;
      initialFetchDoneRef.current = true;
      refreshUnreadCount();
    } else if (!isAuthenticated) {
      initialFetchDoneRef.current = false;
      setUnreadCount(0);
    }
  }, [authLoading, isAuthenticated, refreshUnreadCount]);

  // No polling - messages page uses WebSocket for real-time updates
  // refreshUnreadCount is called when user opens messages or receives WebSocket events

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    unreadCount,
    refreshUnreadCount,
  }), [unreadCount, refreshUnreadCount]);

  return (
    <MessagesContext.Provider value={contextValue}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
