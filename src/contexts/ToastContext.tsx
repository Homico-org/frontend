'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdRef.current}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => {
    addToast({ type: 'success', message, description });
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast({ type: 'error', message, description, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((message: string, description?: string) => {
    addToast({ type: 'warning', message, description });
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    addToast({ type: 'info', message, description });
  }, [addToast]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }), [toasts, addToast, removeToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
