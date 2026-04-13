'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { isFirebaseConfigured, onForegroundMessage, requestPushToken } from '@/lib/firebase';
import { useToast } from '@/contexts/ToastContext';
import { useEffect, useRef } from 'react';

/**
 * Registers push notifications when user is authenticated.
 * Saves the FCM token to the backend for server-side sending.
 * Shows foreground notifications as toasts.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const toast = useToast();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || !isFirebaseConfigured || registeredRef.current) return;
    registeredRef.current = true;

    (async () => {
      const token = await requestPushToken();
      if (!token) return;

      try {
        await api.post('/users/push-token', { token, platform: 'web' });
      } catch {
        // Silent fail — push is optional
      }
    })();

    // Show foreground messages as toasts
    let unsubscribe: (() => void) | null = null;
    onForegroundMessage((payload) => {
      if (payload.title) {
        toast.success(payload.title, payload.body || '');
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
}
