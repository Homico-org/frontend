'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionExpiredToast() {
  const { error } = useToast();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Track whether the user had an active session immediately before the
  // auth:logout event fired. AuthContext's own listener races with this
  // one and clears `isAuthenticated`, so reading state inside the
  // handler would always see `false`. The ref captures the value at the
  // moment of the dispatch.
  const wasAuthRef = useRef(false);
  useEffect(() => {
    wasAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleLogout = () => {
      if (!wasAuthRef.current) return;
      error(t('auth.sessionExpiredTitle'), t('auth.sessionExpiredBody'));
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [error, t]);

  return null;
}
