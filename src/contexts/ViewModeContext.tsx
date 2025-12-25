'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

type ViewMode = 'pro' | 'client';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isClientMode: boolean;
  isProMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'homi_pro_view_mode_toggle';

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewModeState] = useState<ViewMode>('pro');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load view mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(STORAGE_KEY);
      if (savedMode === 'client' || savedMode === 'pro') {
        setViewModeState(savedMode);
      }
      setIsHydrated(true);
    }
  }, []);

  // Reset to pro mode if user is not a pro or admin
  useEffect(() => {
    if (user && user.role !== 'pro' && user.role !== 'admin') {
      setViewModeState('pro');
    }
  }, [user]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'pro' ? 'client' : 'pro';
    setViewMode(newMode);
    router.push('/browse');
  };

  // Only allow client mode for pro users and admin
  const effectiveViewMode = (user?.role === 'pro' || user?.role === 'admin') ? viewMode : 'pro';

  return (
    <ViewModeContext.Provider
      value={{
        viewMode: effectiveViewMode,
        setViewMode,
        toggleViewMode,
        isClientMode: effectiveViewMode === 'client',
        isProMode: effectiveViewMode === 'pro',
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
