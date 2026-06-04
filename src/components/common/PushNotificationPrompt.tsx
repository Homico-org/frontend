"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { isFirebaseConfigured, onForegroundMessage, requestPushToken } from "@/lib/firebase";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "homi:pushPromptDismissed:v1";
const ENGAGEMENT_KEY = "homi:pushPromptVisits:v1";
// Require at least N pageviews before showing - first-time users
// shouldn't be hit with a permission prompt before they understand
// the product.
const MIN_VISITS = 3;
// Re-ask after 14 days if dismissed. Permanent denial (browser
// "Block") is respected forever via `Notification.permission`.
const DISMISS_HOURS = 14 * 24;

/**
 * Soft in-app prompt for push notifications. Two reasons this
 * exists over auto-calling `Notification.requestPermission()` on
 * login:
 *
 * 1. The native prompt is jarring out of context. Most users hit
 *    "Block" reflexively which permanently kills the option. A
 *    soft in-app banner first lets them say "Maybe later" without
 *    burning the browser permission.
 * 2. iOS Safari only honors the native prompt if it's triggered
 *    from a user gesture - calling `requestPermission()` inside
 *    a `useEffect` silently fails. Routing through a click solves
 *    that.
 *
 * Shows only when:
 *  - User is authenticated
 *  - Firebase is configured (otherwise notifications can't be wired)
 *  - `Notification.permission === 'default'` (not granted, not denied)
 *  - User has visited at least MIN_VISITS times this session
 *  - Not dismissed within DISMISS_HOURS
 *  - Not already showing the install-PWA prompt or any modal
 */
export default function PushNotificationPrompt() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoading || !user) return;
    if (!isFirebaseConfigured) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;

    // Engagement gate: count visits, only show on visit ≥ N.
    try {
      const prev = parseInt(window.localStorage.getItem(ENGAGEMENT_KEY) ?? "0", 10);
      const next = (Number.isFinite(prev) ? prev : 0) + 1;
      window.localStorage.setItem(ENGAGEMENT_KEY, String(next));
      if (next < MIN_VISITS) return;
    } catch {
      return;
    }

    // Dismissal window: re-ask after DISMISS_HOURS.
    try {
      const dismissedAt = parseInt(window.localStorage.getItem(DISMISSED_KEY) ?? "0", 10);
      if (Number.isFinite(dismissedAt) && dismissedAt > 0) {
        const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
        if (hoursSince < DISMISS_HOURS) return;
      }
    } catch {
      return;
    }

    // Brief delay so the prompt doesn't dominate page-paint - feels
    // less aggressive.
    const id = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(id);
  }, [isLoading, user]);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      // `requestPushToken` calls `Notification.requestPermission()`
      // under the hood. Driven by this click, iOS Safari will
      // honor it. Successful permission grant returns the FCM
      // token; null means either denial or a Firebase error.
      const token = await requestPushToken();
      if (!token) {
        // User denied or Firebase failed - either way we won't
        // ask again. Browser permission state will reflect the
        // denial; if Firebase failed silently we just suppress
        // the prompt for the dismissal window.
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setVisible(false);
        return;
      }
      // Persist the token server-side so push can be delivered.
      try {
        await api.post("/users/push-token", { token, platform: "web" });
      } catch {
        // Token registration failed; user gets local notifications
        // (foreground listener below) but not server-pushed ones.
        // Silent - this is a best-effort enrichment.
      }
      // Wire foreground messages to toasts so the user sees the
      // first push immediately (positive reinforcement).
      onForegroundMessage((payload) => {
        if (payload.title) toast.success(payload.title, payload.body || "");
      }).catch(() => {
        // Listener attach failed - non-fatal.
      });
      setVisible(false);
    } finally {
      setEnabling(false);
    }
  };

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Quota / private-mode - banner will re-show next session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("pushPrompt.title")}
      // Lifted above the mobile bottom nav + safe-area inset so it
      // doesn't get cropped on iPhones. Hidden on desktop where the
      // native browser prompt is less surprising and we'd rather not
      // add a sticky element.
      className="lg:hidden fixed left-3 right-3 z-[80] flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--hm-n-900)] text-white shadow-2xl animate-slide-up-sheet"
      style={{ bottom: "calc(58px + env(safe-area-inset-bottom) + 12px)" }}
    >
      <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--hm-brand-500)]/20 flex items-center justify-center">
        <Bell className="w-4 h-4 text-[var(--hm-brand-400)]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t("pushPrompt.title")}</p>
        <p className="text-xs text-white/70 mt-0.5">{t("pushPrompt.body")}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={handleEnable}
            disabled={enabling}
            className="px-3 py-1.5 rounded-lg bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {t("pushPrompt.enable")}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            {t("pushPrompt.later")}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("common.close")}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
