'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

// Google OAuth types declared in src/types/google.d.ts

// JWT decode helper
function decodeJwt(token: string): { email: string; name: string; picture?: string; sub: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

export interface GoogleSignInButtonProps {
  /** Callback when Google sign-in is successful */
  onSuccess: (userData: GoogleUserData, credential: string) => void;
  /** Callback when Google sign-in fails */
  onError?: (error: string) => void;
  /** Button text type */
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  /** Button width in pixels */
  width?: number;
  /** Loading text for the fallback button */
  loadingText?: string;
  /** Whether the button should be visible/active */
  isActive?: boolean;
  /** Unique key for this button instance (important for multiple buttons on same page) */
  buttonKey?: string;
  /** Custom class name for the container */
  className?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'signin_with',
  width = 300,
  loadingText = 'Loading...',
  isActive = true,
  buttonKey = 'default',
  className = '',
}: GoogleSignInButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!window.google?.accounts?.id;
    }
    return false;
  });
  const [buttonRendered, setButtonRendered] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(`google-btn-${buttonKey}-${Math.random().toString(36).substr(2, 9)}`);

  // Handle Google callback
  const handleGoogleCallback = useCallback((response: { credential: string }) => {
    const decoded = decodeJwt(response.credential);
    if (!decoded) {
      onError?.('Failed to decode Google response');
      return;
    }

    onSuccess({
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      googleId: decoded.sub,
    }, response.credential);
  }, [onSuccess, onError]);

  // Check for Google script on mount
  useEffect(() => {
    if (!scriptLoaded) {
      const checkGoogle = () => {
        if (window.google?.accounts?.id) {
          setScriptLoaded(true);
        }
      };
      checkGoogle();
      const interval = setInterval(checkGoogle, 100);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [scriptLoaded]);

  // Reset button when becoming inactive
  useEffect(() => {
    if (!isActive) {
      setButtonRendered(false);
      // Increment render attempt to force re-render when becoming active again
      setRenderAttempt(prev => prev + 1);
    }
  }, [isActive]);

  // Initialize and render Google button
  useEffect(() => {
    if (!scriptLoaded || !isActive || !buttonRef.current) {
      return;
    }

    const initializeButton = () => {
      const googleAccounts = window.google?.accounts?.id;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!googleAccounts || !clientId || !buttonRef.current) {
        return;
      }

      // Clear any existing content
      buttonRef.current.innerHTML = '';

      // Initialize Google Sign In
      googleAccounts.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });

      // Render the button
      googleAccounts.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width,
      });

      // Mark as rendered after a short delay
      setTimeout(() => {
        setButtonRendered(true);
      }, 150);
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeButton, 100);
    return () => clearTimeout(timeoutId);
  }, [scriptLoaded, isActive, handleGoogleCallback, text, width, renderAttempt]);

  return (
    <>
      {/* Google Sign In Script - only render once per page */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className={`relative ${className}`}>
        {/* Actual Google Button Container - always in DOM but hidden when not rendered */}
        <div
          ref={buttonRef}
          id={uniqueId.current}
          className={`flex justify-center transition-opacity duration-200 ${
            buttonRendered && isActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
          style={{ minHeight: buttonRendered ? 'auto' : 0 }}
        />

        {/* Loading/Fallback Button */}
        {(!buttonRendered || !isActive) && (
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-400 cursor-wait"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium">{loadingText}</span>
          </button>
        )}
      </div>
    </>
  );
}
