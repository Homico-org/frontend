'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AuthModalContextType {
  isLoginModalOpen: boolean;
  /**
   * Opens the login modal. After a successful login the user returns
   * to `redirectPath` (if provided) or to the page they were on when
   * the modal was opened. Pass an explicit path for cross-page returns
   * (e.g. open from a CTA on `/professionals/[id]` and return into
   * `/messages?recipient={id}`).
   */
  openLoginModal: (redirectPath?: string) => void;
  closeLoginModal: () => void;
  redirectPath: string | null;
  clearRedirectPath: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

/**
 * Capture the current location. Used as the default redirect path so
 * callers that forget to pass one still bring the user back to where
 * they were instead of bouncing them to `/`.
 */
function captureCurrentPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname + window.location.search;
  // Don't capture auth-related routes - returning to /login or
  // /register after logging in would be confusing.
  if (path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')) {
    return null;
  }
  return path;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const openLoginModal = useCallback((path?: string) => {
    // Explicit path always wins. Otherwise fall back to the current
    // URL so the user doesn't lose context after signing in. The two
    // historical leaks were on this exact pattern: callers did
    // `openLoginModal()` with no arg and the user ended up on `/`.
    const target = path ?? captureCurrentPath();
    if (target) {
      setRedirectPath(target);
    }
    setIsLoginModalOpen(true);
  }, []);

  // Listen for login modal open events from api interceptor (401 responses)
  useEffect(() => {
    const handleOpenLoginModal = () => {
      // 401 interceptor doesn't pass a path; default to current URL
      // so the user can resume on the same page after re-auth.
      const target = captureCurrentPath();
      if (target) {
        setRedirectPath(target);
      }
      setIsLoginModalOpen(true);
    };

    window.addEventListener('auth:open-login-modal', handleOpenLoginModal);

    // Drain any 401 that fired before this listener mounted. Without
    // this, an early-boot token-validation 401 would dispatch
    // `auth:open-login-modal` into a window with no listener, leaving
    // the user on the page with no prompt.
    const pendingWindow = window as { __homiPendingLoginModal?: boolean };
    if (pendingWindow.__homiPendingLoginModal) {
      pendingWindow.__homiPendingLoginModal = false;
      handleOpenLoginModal();
    }

    return () => {
      window.removeEventListener('auth:open-login-modal', handleOpenLoginModal);
    };
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const clearRedirectPath = useCallback(() => {
    setRedirectPath(null);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        redirectPath,
        clearRedirectPath,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
