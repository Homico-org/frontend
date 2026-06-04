'use client';

import { AnalyticsEvent, trackAnalyticsEvent } from '@/hooks/useAnalytics';
import api from '@/lib/api';
import { AccountType, UserRole } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  isCountryAgnostic,
  swapCountryPrefix,
  writeMarketplaceCookie,
} from '@/utils/countryLink';
import { isSupportedCountry } from '@/data/countries';

interface SelectedService {
  key: string;
  categoryKey: string;
  name: string;
  nameKa?: string;
  experience: string;
}

interface User {
  id: string;
  uid?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  selectedServices?: SelectedService[];
  accountType?: AccountType;
  isProfileCompleted?: boolean;
  verificationStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  // Pro availability status. `away` exempts the pro from SLA timers
  // and shows an "Away" pill in browse. Surfaced via POST /users/me/status.
  status?: 'active' | 'busy' | 'away';
  // SLA accountability state. Drives the SlaStatusBanner on /my-space.
  // `none` means nothing to display; the other levels render the banner.
  slaPenaltyLevel?: 'none' | 'warning' | 'demoted' | 'paused';
  slaDemotedUntil?: string;
  // Surface the existing deactivation fields so the banner can render
  // the paused countdown using `deactivatedUntil`. `deactivationReason
  // === 'sla_breach'` is how the banner tells SLA-driven pauses from
  // user-driven ones (the latter doesn't get the SLA banner).
  isProfileDeactivated?: boolean;
  deactivatedUntil?: string;
  deactivationReason?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthValidated: boolean;
  login: (accessToken: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to clear all auth data
const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  // Also clear old token key if exists
  localStorage.removeItem('token');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthValidated, setIsAuthValidated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Ref to prevent duplicate auth initialization (React Strict Mode)
  const authInitializedRef = useRef(false);

  // Validate token with backend - uses api instance so refresh interceptor works
  const validateToken = useCallback(async (tokenToValidate: string): Promise<User | null> => {
    try {
      // Ensure the token is set before calling
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenToValidate}`;
      const response = await api.get('/users/me');
      const userData = response.data;
      return {
        id: userData.id || userData._id,
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        city: userData.city,
        phone: userData.phone,
        // Without this, every app boot silently strips the verified flag
        // from the user object even though /users/me returns it correctly.
        // The proposal/comment gates on JobDetailClient read
        // `user.isPhoneVerified` and were blocking verified pros from
        // sending proposals because the field arrived as undefined.
        isPhoneVerified: userData.isPhoneVerified,
        selectedCategories: userData.selectedCategories,
        selectedSubcategories: userData.selectedSubcategories,
        selectedServices: userData.selectedServices,
        accountType: userData.accountType,
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
        setIsAuthValidated(true);
        return;
      }

      // Get locally stored user data - use immediately for fast initial render.
      // Wrapped in try/catch because localStorage can hold corrupted JSON
      // (other tab race, partial clear, manual devtools edit) and an
      // unhandled SyntaxError here would crash the entire AuthProvider on
      // mount, taking down the whole app for the user.
      let storedUser: User | null = null;
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        try {
          storedUser = JSON.parse(storedUserStr) as User;
        } catch (err) {
          console.warn('[Auth] Cached user data was corrupted, clearing.', err);
          localStorage.removeItem('user');
        }
      }

      // Use cached user data immediately to prevent blocking
      if (storedUser) {
        setUser(storedUser);
        setToken(accessToken);
        setIsLoading(false);

        // On boot we only mirror the marketplace cookie - no URL swap.
        // A deep-link / bookmark to /ge/jobs/abc should still resolve;
        // the cookie alone is enough so future bare-path visits and
        // country-agnostic pages know where the user belongs. The
        // explicit `login` callback above does the URL swap on a fresh
        // sign-in, which is when the user expects to land on "their"
        // marketplace.
        const bootCountry = (storedUser as { country?: string }).country;
        if (bootCountry && isSupportedCountry(bootCountry)) {
          writeMarketplaceCookie(bootCountry);
        }

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
          setIsAuthValidated(true);
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
        setIsAuthValidated(true);
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

  const login = useCallback((accessToken: string, userData: User, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
    setToken(accessToken);

    // Sync the active marketplace to the user's stored country. Without
    // this, a US-based pro who signs in while parked on /ge stays on
    // /ge for the rest of the session - their dashboard, post-job
    // flow, and AI assistant all keep pretending they're in Tbilisi.
    //
    // Order of operations:
    //   1. Stamp the `homico-marketplace` cookie so future bare-path
    //      navigations and country-agnostic pages resolve to the user's
    //      country.
    //   2. If we're standing on a country-scoped path with a different
    //      country segment, swap the prefix client-side. Country-
    //      agnostic pages (settings, admin, /pro/profile-setup) are
    //      left alone - the cookie update is enough for them.
    const userCountry = (userData as { country?: string }).country;
    if (userCountry && isSupportedCountry(userCountry)) {
      writeMarketplaceCookie(userCountry);
      if (pathname && !isCountryAgnostic(pathname)) {
        const target = swapCountryPrefix(pathname, userCountry);
        if (target !== pathname) {
          router.replace(target);
        }
      }
    }
  }, [pathname, router]);

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
    isAuthValidated,
    login,
    logout,
    updateUser,
  }), [user, token, isLoading, isAuthValidated, login, logout, updateUser]);

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
