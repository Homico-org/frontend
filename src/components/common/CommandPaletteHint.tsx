"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const SEEN_KEY = "homi:cmdkHintSeen:v1";

/**
 * One-time tooltip pointing at the header search icon, teaching
 * users that ⌘K opens the command palette. Without this, the
 * feature exists but is invisible - shipping a keyboard shortcut
 * with no discovery affordance means only power users find it.
 *
 * Shows once per device per user. The dismiss-flag lives in
 * `localStorage` so refreshing doesn't re-show it; closing the
 * tab keeps the user's "already seen" state across sessions.
 *
 * Render once at root layout. Self-gates on auth + first-session.
 */
export default function CommandPaletteHint() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoading) return;
    if (!isAuthenticated) return;
    // Only surface once. Returning visitors who dismissed shouldn't
    // see it again.
    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      return;
    }
    // Small delay so the hint pops in after the user lands and
    // their eye has settled on the header - not the same instant
    // as page paint.
    const id = window.setTimeout(() => setShow(true), 1800);
    return () => window.clearTimeout(id);
  }, [isAuthenticated, isLoading]);

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Quota / private-mode lockouts - the worst case is the hint
      // shows again next session, harmless.
    }
  };

  // Auto-dismiss after 8s if the user ignores it - we don't want
  // a permanent badge in the corner.
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(dismiss, 8000);
    return () => window.clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="hidden sm:flex fixed top-16 right-4 z-[60] items-center gap-2 px-3 py-2 rounded-xl bg-[var(--hm-n-900)] text-[var(--hm-n-50)] text-sm shadow-2xl animate-fade-in"
      style={{
        // Tiny arrow pointing up at the search icon in the header.
        // CSS triangle via border trick keeps it dependency-free.
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-1.5 right-6 w-3 h-3 rotate-45"
        style={{ backgroundColor: "var(--hm-n-900)" }}
      />
      <Sparkles className="w-4 h-4 text-[var(--hm-brand-400)]" />
      <span className="font-medium">{t("commandPalette.discoveryTip")}</span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label={t("common.close")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
