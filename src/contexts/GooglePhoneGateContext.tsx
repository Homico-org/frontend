'use client';

import { useAuth } from '@/contexts/AuthContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Drives the mandatory "add + verify your phone" gate that follows a
 * Google sign-up. The contract:
 *   1. POST /auth/google returns { ..., needsPhone }. When needsPhone is
 *      true we set a localStorage marker (`PENDING_KEY`) and surface the
 *      blocking OTP screen.
 *   2. The screen sends an OTP (POST /verification/send-otp) and attaches
 *      the verified number (POST /auth/attach-phone), which returns a fresh
 *      session. We re-pose that session and clear the marker.
 *
 * The marker is the ONLY thing that makes the blocking screen appear, and
 * it is written EXCLUSIVELY by `beginGate` below (called from the Google
 * flow). Classic mobile users, pros and admins never get the marker, so
 * they are never blocked — even though many of them legitimately have a
 * phone already.
 */
const PENDING_KEY = 'pendingPhoneVerification';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GooglePhoneGateContextType {
  /** True while the blocking phone-verification screen must be shown. */
  isGateActive: boolean;
  /** Called by the Google flow when /auth/google returns needsPhone. */
  beginGate: () => void;
  /** Clears the gate (after a successful attach-phone). */
  endGate: () => void;
}

const GooglePhoneGateContext = createContext<GooglePhoneGateContextType | undefined>(
  undefined,
);

export function GooglePhoneGateProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthValidated } = useAuth();
  const [marker, setMarker] = useState(false);

  // Hydrate the marker from localStorage on mount (e.g. user reloaded the
  // page mid-gate). SSR-safe: defaults to false on the server.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMarker(localStorage.getItem(PENDING_KEY) === 'true');
  }, []);

  // Keep the marker in sync if another tab toggles it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PENDING_KEY) setMarker(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const beginGate = useCallback(() => {
    try {
      localStorage.setItem(PENDING_KEY, 'true');
    } catch {
      // ignore storage failures - the in-memory marker still gates this session
    }
    setMarker(true);
  }, []);

  const endGate = useCallback(() => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    setMarker(false);
  }, []);

  // Safety net: if the marker somehow survives but the logged-in user
  // already has a phone (e.g. attach succeeded in another tab, or a
  // pre-existing user), clear it so we never trap a phone-having user.
  useEffect(() => {
    if (marker && isAuthValidated && user && user.phone) {
      endGate();
    }
  }, [marker, isAuthValidated, user, endGate]);

  // The gate is only active when BOTH the marker is set AND we have a
  // logged-in user that lacks a phone. This double condition is the
  // guarantee that existing phone-having users are never blocked.
  const isGateActive = useMemo(
    () => marker && !!user && !user.phone,
    [marker, user],
  );

  const value = useMemo(
    () => ({ isGateActive, beginGate, endGate }),
    [isGateActive, beginGate, endGate],
  );

  return (
    <GooglePhoneGateContext.Provider value={value}>
      {children}
    </GooglePhoneGateContext.Provider>
  );
}

export function useGooglePhoneGate() {
  const ctx = useContext(GooglePhoneGateContext);
  if (ctx === undefined) {
    throw new Error('useGooglePhoneGate must be used within a GooglePhoneGateProvider');
  }
  return ctx;
}

/**
 * Shared helper: exchange a Google id_token for a Homico session.
 * Returns whether the phone gate must now be shown. Throws on failure
 * so callers can surface a toast.
 */
export async function exchangeGoogleToken(
  idToken: string,
  role: 'client' | 'pro',
): Promise<{ access_token: string; refresh_token?: string; user: any; needsPhone: boolean }> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Google sign-in failed');
  }
  return data;
}

/**
 * Hook bundling everything the blocking screen + the Google buttons need
 * to drive the attach-phone flow. Kept here so the screen and the buttons
 * stay in lockstep with the marker logic.
 */
export function useAttachPhone() {
  const { login, token } = useAuth();
  const { endGate } = useGooglePhoneGate();
  const { country, t } = useLanguage();
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const fullIdentifier = useCallback(
    () => `${countries[phoneCountry].phonePrefix}${phone.replace(/\s/g, '')}`,
    [phoneCountry, phone],
  );

  const sendOtp = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: fullIdentifier(), channel: 'sms', type: 'phone' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send code');
      }
      setShowOtp(true);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  }, [fullIdentifier]);

  const verifyAndAttach = useCallback(
    async (code?: string) => {
      setError('');
      setIsLoading(true);
      const finalCode = code ?? otp;
      try {
        const authToken =
          token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
        const res = await fetch(`${API_URL}/auth/attach-phone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ identifier: fullIdentifier(), code: finalCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            throw new Error(t('auth.googlePhoneTaken'));
          }
          throw new Error(data.message || t('auth.invalidCode'));
        }
        // Re-pose the fresh session (now carrying the verified phone) and
        // lift the gate.
        login(data.access_token, data.user, data.refresh_token);
        endGate();
        toast.success(t('auth.phoneVerified'));
      } catch (err: any) {
        setError(err.message || t('auth.invalidCode'));
        setOtp('');
      } finally {
        setIsLoading(false);
      }
    },
    [otp, token, fullIdentifier, login, endGate, toast, t],
  );

  return {
    phone,
    setPhone,
    phoneCountry,
    setPhoneCountry,
    otp,
    setOtp,
    showOtp,
    setShowOtp,
    resendTimer,
    isLoading,
    error,
    setError,
    sendOtp,
    verifyAndAttach,
  };
}
