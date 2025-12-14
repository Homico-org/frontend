'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  uid?: number;
  name: string;
  email: string;
  role: 'client' | 'pro' | 'company' | 'admin';
  avatar?: string;
  city?: string;
  phone?: string;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  accountType?: 'individual' | 'organization';
  companyName?: string;
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
        companyName: userData.companyName
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

      // Get locally stored user data
      const storedUserStr = localStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

      // Validate token with backend
      const validatedUser = await validateToken(accessToken);

      if (validatedUser) {
        // Merge with local data - prefer local avatar if it's a data URL (recently uploaded)
        // or if the backend avatar is empty/undefined
        let finalUser = validatedUser;
        if (storedUser?.avatar) {
          const isLocalDataUrl = storedUser.avatar.startsWith('data:');
          const isBackendAvatarEmpty = !validatedUser.avatar;
          if (isLocalDataUrl || isBackendAvatarEmpty) {
            finalUser = { ...validatedUser, avatar: storedUser.avatar };
          }
        }

        // Token is valid, update user state and localStorage
        localStorage.setItem('user', JSON.stringify(finalUser));
        setUser(finalUser);
        setToken(accessToken);
      } else {
        // Token is invalid, clear auth data
        clearAuthData();
        setUser(null);
        setToken(null);
      }

      setIsLoading(false);
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

  const login = (accessToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(accessToken);
  };

  const logout = useCallback(() => {
    // Clear all auth data
    clearAuthData();
    setUser(null);
    setToken(null);
    // Redirect to landing page
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
    if (landingUrl) {
      window.location.href = landingUrl;
    } else {
      // Fallback to home if no landing URL configured
      router.replace('/');
    }
  }, [router]);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
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
