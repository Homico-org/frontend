'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AuthModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: (redirectPath?: string) => void;
  closeLoginModal: () => void;
  redirectPath: string | null;
  clearRedirectPath: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const openLoginModal = useCallback((path?: string) => {
    if (path) {
      setRedirectPath(path);
    }
    setIsLoginModalOpen(true);
  }, []);

  // Listen for login modal open events from api interceptor (401 responses)
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    window.addEventListener('auth:open-login-modal', handleOpenLoginModal);
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
