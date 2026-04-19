"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/IconBadge";
import { FormGroup, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import {
  countries,
  CountryCode,
  useLanguage,
} from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { trackEvent as trackClick } from "@/hooks/useTracker";
import type { DemoAccount } from "@/types/shared";
import { Lock, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

function DevAccountPicker({ onSelect }: { onSelect: (phone: string) => void }): React.ReactElement | null {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${API_URL}/auth/demo-accounts`)
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  if (!loaded || accounts.length === 0) return null;

  const roleEmoji: Record<string, string> = {
    pro: "🔧",
    client: "👤",
    admin: "🛡️",
  };

  return (
    <div className="mt-3 border-t border-[var(--hm-border-subtle)] pt-3">
      <p className="text-[10px] text-[var(--hm-fg-muted)] mb-2 text-center">
        DEV: Quick login
      </p>
      <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
        {accounts.map((acc) => {
          const localPhone = acc.phone.replace(/^\+995/, "");
          return (
            <button
              key={acc.phone}
              type="button"
              onClick={() => onSelect(localPhone)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left bg-[var(--hm-bg-tertiary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            >
              {acc.avatar ? (
                <img
                  src={acc.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="text-sm">{roleEmoji[acc.role] || "👤"}</span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-[var(--hm-fg-secondary)] truncate">
                  {acc.name}
                </p>
                <p className="text-[8px] text-[var(--hm-fg-muted)] truncate">
                  {acc.title || acc.role}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginModal(): React.ReactElement | null {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, redirectPath, clearRedirectPath } =
    useAuthModal();
  const { t, locale } = useLanguage();
  const { trackEvent } = useAnalytics();

  // Form state - initialize from localStorage for returning users
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastLoginPhone") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(
        "lastLoginCountry",
      ) as CountryCode | null;
      if (saved && countries[saved]) return saved;
    }
    return "GE";
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoginModalOpen]);

  const handleEscKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLoginModal();
    },
    [closeLoginModal],
  );

  useEffect(() => {
    if (isLoginModalOpen) document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isLoginModalOpen, handleEscKey]);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setPassword("");
      setError("");
    }
  }, [isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const identifier = `${countries[phoneCountry].phonePrefix}${phone.replace(/\s/g, "")}`;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      // Save credentials for next login
      try {
        localStorage.setItem("lastLoginPhone", phone);
        localStorage.setItem("lastLoginCountry", phoneCountry);
      } catch {
        // Ignore localStorage errors
      }

      login(data.access_token, data.user, data.refresh_token);
      trackEvent(AnalyticsEvent.LOGIN, {
        userRole: data.user.role,
        authMethod: "mobile",
      });
      closeLoginModal();

      if (redirectPath) {
        router.push(redirectPath);
        clearRedirectPath();
      } else if (data.user.role === "admin") {
        router.push("/admin");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.toLowerCase().includes("invalid credentials")) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(t("auth.loginFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={closeLoginModal}
      />

      {/* Modal Container - Bottom sheet on mobile, centered on desktop */}
      <div
        className={`relative w-full sm:max-w-[380px] transition-all duration-300 ${
          isVisible
            ? "opacity-100 translate-y-0 sm:scale-100"
            : "opacity-0 translate-y-full sm:translate-y-4 sm:scale-95"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Modal Card */}
        <div
          className="relative rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--hm-bg-elevated)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle for mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-neutral-300" />
          </div>

          {/* Close Button */}
          <Button
            onClick={closeLoginModal}
            variant="ghost"
            size="icon"
            className="absolute top-3 sm:top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full z-10"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Content */}
          <div className="px-5 sm:px-6 pt-4 sm:pt-8 pb-8 sm:pb-6">
            {/* Header */}
            <div className="text-center mb-5">
              <IconBadge
                icon={Lock}
                size="lg"
                variant="accent"
                className="mx-auto mb-3"
              />
              <h2 className="text-lg font-bold" style={{ color: 'var(--hm-fg-primary)' }}>
                {t("auth.welcomeBack")}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--hm-fg-secondary)' }}>
                {t("auth.enterPhoneNumber")}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="error" size="sm" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-3">
              <FormGroup>
                <Label>{t("auth.phoneNumber")}</Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  country={phoneCountry}
                  onCountryChange={setPhoneCountry}
                  placeholder={countries[phoneCountry].placeholder}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>{t("common.password")}</Label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.enterYourPassword")}
                  required
                />
              </FormGroup>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  onClick={closeLoginModal}
                  className="text-sm sm:text-xs font-medium text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] active:opacity-70 transition-colors py-1"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                className="w-full h-12 sm:h-10 text-base sm:text-sm"
              >
                {t("auth.signIn")}
              </Button>
            </form>

            {/* Dev quick-fill test accounts */}
            {process.env.NODE_ENV === "development" && (
              <DevAccountPicker
                onSelect={(phone) => {
                  setPhone(phone);
                  setPhoneCountry("GE" as CountryCode);
                  setPassword("Demo123!");
                }}
              />
            )}

            {/* Sign Up Link */}
            <p className="text-center text-sm sm:text-xs mt-5 sm:mt-4" style={{ color: 'var(--hm-fg-secondary)' }}>
              {t("auth.dontHaveAccount")}{" "}
              <Link
                href="/register"
                onClick={() => {
                  closeLoginModal();
                  trackClick("register_click", "from-login-modal");
                }}
                className="font-semibold text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] active:opacity-70 transition-colors"
              >
                {t("auth.signUp")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
