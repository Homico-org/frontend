'use client';

import { AnalyticsEvent, trackAnalyticsEvent } from '@/hooks/useAnalytics';
import { AccountType, UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface User {
  id: string;
  uid?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  phone?: string;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  accountType?: AccountType;
  companyName?: string;
  isProfileCompleted?: boolean;
  verificationStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to clear all auth data
const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  // Also clear old token key if exists
  localStorage.removeItem('token');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Ref to prevent duplicate auth initialization (React Strict Mode)
  const authInitializedRef = useRef(false);

  // Validate token with backend
  const validateToken = useCallback(async (tokenToValidate: string): Promise<User | null> => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();
      return {
        id: userData.id || userData._id,
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        city: userData.city,
        phone: userData.phone,
        selectedCategories: userData.selectedCategories,
        selectedSubcategories: userData.selectedSubcategories,
        accountType: userData.accountType,
        companyName: userData.companyName,
        isProfileCompleted: userData.isProfileCompleted,
        verificationStatus: userData.verificationStatus
      };
    } catch (err) {
      console.error('Token validation failed:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (authInitializedRef.current) return;
    authInitializedRef.current = true;

    // Check if user is logged in on mount and validate token
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Get locally stored user data - use immediately for fast initial render
      const storedUserStr = localStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

      // Use cached user data immediately to prevent blocking
      if (storedUser) {
        setUser(storedUser);
        setToken(accessToken);
        setIsLoading(false);

        // Validate token in background (non-blocking)
        validateToken(accessToken).then(validatedUser => {
          if (validatedUser) {
            // Merge with local data - prefer local avatar if it's a data URL (recently uploaded)
            let finalUser = validatedUser;
            if (storedUser?.avatar) {
              const isLocalDataUrl = storedUser.avatar.startsWith('data:');
              const isBackendAvatarEmpty = !validatedUser.avatar;
              if (isLocalDataUrl || isBackendAvatarEmpty) {
                finalUser = { ...validatedUser, avatar: storedUser.avatar };
              }
            }
            // Update with fresh data from backend
            localStorage.setItem('user', JSON.stringify(finalUser));
            setUser(finalUser);
          } else {
            // Token is invalid, clear auth data
            clearAuthData();
            setUser(null);
            setToken(null);
          }
        });
      } else {
        // No cached user, must validate synchronously
        const validatedUser = await validateToken(accessToken);
        if (validatedUser) {
          localStorage.setItem('user', JSON.stringify(validatedUser));
          setUser(validatedUser);
          setToken(accessToken);
        } else {
          clearAuthData();
        }
        setIsLoading(false);
      }
    };

    initAuth();
  }, [validateToken]);

  // Listen for logout events from api interceptor
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const login = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    // Track logout event before clearing data
    trackAnalyticsEvent(AnalyticsEvent.LOGOUT, { userRole: user?.role });
    // Clear all auth data
    clearAuthData();
    setUser(null);
    setToken(null);
    // Redirect to home page
    router.replace('/');
  }, [router, user?.role]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => {
      if (prev) {
        const updatedUser = { ...prev, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return prev;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  }), [user, token, isLoading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
