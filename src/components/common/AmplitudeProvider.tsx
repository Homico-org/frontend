"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  identifyAmplitudeUser,
  initAmplitude,
  resetAmplitudeUser,
} from "@/lib/amplitude";
import { useEffect, useRef } from "react";

/**
 * Mounts inside ClientLayout. Responsibilities:
 *   1. Initialize the Amplitude SDK exactly once per browser session.
 *   2. Watch the auth state and call identify/reset as users log in/out.
 *
 * This is a "headless" component - it renders nothing. Lives separate from
 * the SDK wrapper itself so the lib file stays pure (no React imports) and
 * can be reused from non-React contexts (e.g. service workers, tests).
 */
export default function AmplitudeProvider() {
  const { user, isAuthValidated } = useAuth();
  // Track the previous identified user id so we don't re-identify on every
  // render. We only act when the identity *changes* (login, logout, or
  // switching accounts).
  const lastIdentifiedRef = useRef<string | null>(null);

  // One-time SDK init. Effect runs on mount; the SDK wrapper itself is
  // idempotent so duplicate calls (from Fast Refresh, strict-mode double
  // mount) are harmless.
  useEffect(() => {
    initAmplitude();
  }, []);

  // Identity sync. Waits until AuthContext has finished validating its
  // stored token - otherwise we'd briefly identify based on stale
  // localStorage data, then reset on validation failure (noisy events).
  useEffect(() => {
    if (!isAuthValidated) return;

    const currentId = user?.id ?? null;
    if (lastIdentifiedRef.current === currentId) return;

    if (user) {
      identifyAmplitudeUser({
        id: user.id,
        uid: user.uid,
        role: user.role,
        city: user.city,
      });
    } else {
      // Was identified before, now nobody. Reset device id so subsequent
      // events on a shared device don't get attributed to the prior user.
      if (lastIdentifiedRef.current !== null) {
        resetAmplitudeUser();
      }
    }

    lastIdentifiedRef.current = currentId;
  }, [user, isAuthValidated]);

  return null;
}
