/**
 * Amplitude wrapper - thin, typed, side-effect-isolated.
 *
 * Uses `@amplitude/unified`, which bundles Analytics + Session Replay in a
 * single SDK. Session replay is captured at 100% sample rate today; dial
 * back to e.g. 0.1 in this file when traffic justifies it.
 *
 * Why a wrapper instead of using @amplitude/unified directly?
 *  - Single place to swap the analytics provider later without rippling
 *    changes through every caller.
 *  - One place to enforce the EU server zone (data residency for our
 *    Georgia/EU users - matches our existing Mixpanel api-eu setup).
 *  - One place to gate on the API key being present, so component code
 *    doesn't have to repeat "is analytics configured" checks.
 *  - Lets us add a no-op fallback when SSR runs this module on the server.
 */

import * as amplitude from "@amplitude/unified";
import type { UserRole } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

// Idempotency: AmplitudeProvider mounts on every navigation in dev (React
// strict mode double-renders + Fast Refresh). We don't want to call init()
// twice or autocapture will double-fire.
let initialized = false;

/**
 * Initialize Amplitude (Analytics + Session Replay) exactly once per
 * browser session. Safe to call multiple times - subsequent calls are
 * no-ops.
 *
 * Note: `initAll` returns a Promise (session replay init is async), but
 * analytics is sync-ready immediately after the call returns. We don't
 * await - callers can `track()` right away and queued events flush once
 * replay finishes initializing.
 */
export function initAmplitude(): void {
  if (typeof window === "undefined") return; // SSR - skip
  if (initialized) return;
  if (!API_KEY) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "[amplitude] NEXT_PUBLIC_AMPLITUDE_API_KEY not set - analytics disabled.",
      );
    }
    return;
  }

  void amplitude.initAll(API_KEY, {
    // Top-level: applies to BOTH analytics and session replay so events
    // and replays land in the same region as the Amplitude project.
    // NOTE: This MUST match the region of the Amplitude project itself
    // (visible at top of Amplitude UI URL: app.amplitude.com = US,
    // app.eu.amplitude.com = EU). Mismatch silently drops every event.
    serverZone: "US",
    analytics: {
      // Autocapture parity with Amplitude's "no-code" CDN snippet:
      // pageviews + sessions + attribution + forms + file downloads +
      // element clicks AS WELL AS the three behavioral signals their
      // snippet enables - network failures, Core Web Vitals per page,
      // and frustration interactions (rage clicks, dead clicks, etc).
      // Everything below is opt-in; trim if any feels noisy.
      autocapture: {
        attribution: true,
        pageViews: true,
        sessions: true,
        formInteractions: true,
        fileDownloads: true,
        elementInteractions: true,
        // Failed XHR/fetch requests - surfaces broken APIs in real user
        // sessions without us having to instrument every call site.
        networkTracking: true,
        // Core Web Vitals per page (LCP, INP, CLS). Real-user perf data
        // beats synthetic Lighthouse runs for prioritization.
        webVitals: true,
        // UX-pain signals: rage-click on the same element, click on
        // something that does nothing, click immediately before an
        // error, frantic mouse movement. Best leading indicators of
        // confusing UI.
        frustrationInteractions: {
          rageClicks: true,
          deadClicks: true,
          errorClicks: true,
          thrashedCursor: true,
        },
      },
      // Pull config (e.g. sample rates) from the Amplitude dashboard at
      // boot instead of hardcoding here. Lets us tune session-replay
      // rate without a redeploy.
      fetchRemoteConfig: true,
      minIdLength: 1,
      // In dev, log every event the SDK queues so we can verify events
      // fire without opening the Amplitude UI. Production stays quiet.
      logLevel:
        process.env.NODE_ENV === "development"
          ? amplitude.Types.LogLevel.Debug
          : amplitude.Types.LogLevel.Warn,
    },
    sessionReplay: {
      // 1.0 = capture 100% of sessions. Heavy on storage at scale; reduce
      // (e.g. 0.1 for 10%) once you have meaningful volume. Input fields
      // are masked by default - no extra config needed for PII safety.
      sampleRate: 1,
    },
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(
      "[amplitude] initialized (analytics + session replay). deviceId=",
      amplitude.getDeviceId(),
    );
  }

  initialized = true;
}

/**
 * Tie subsequent events to a known Homico user. Call this immediately after
 * login completes - Amplitude will merge prior anonymous activity into the
 * identified user so the pre-signup funnel is preserved.
 */
export function identifyAmplitudeUser(user: {
  id: string;
  uid?: number;
  role: UserRole;
  city?: string;
}): void {
  if (typeof window === "undefined" || !initialized) return;

  // Use Homico's internal user id as Amplitude's userId. UID (the numeric
  // public id) goes on as a user property so we can pivot by it without
  // exposing the Mongo ObjectId in dashboards if we don't want to.
  amplitude.setUserId(user.id);

  const identify = new amplitude.Identify();
  identify.set("role", user.role);
  if (user.uid !== undefined) identify.set("uid", user.uid);
  if (user.city) identify.set("city", user.city);
  amplitude.identify(identify);
}

/**
 * Forget the current user binding on logout. Subsequent events fire under a
 * fresh anonymous device id - so we don't accidentally attribute a different
 * person's actions to the user who just signed out on a shared device.
 */
export function resetAmplitudeUser(): void {
  if (typeof window === "undefined" || !initialized) return;
  amplitude.reset();
}

/**
 * Returns the SDK's current device id, or null when analytics is disabled
 * (SSR, no API key, or pre-init). Forwarded to the backend via the
 * `X-Amplitude-Device-Id` header so server-side events stitch to the same
 * browser session - otherwise client events and server events show up as
 * two separate anonymous users in Amplitude.
 */
export function getAmplitudeDeviceId(): string | null {
  if (typeof window === "undefined" || !initialized) return null;
  return amplitude.getDeviceId() ?? null;
}

/**
 * Fire a typed event. Event names are snake_case strings, matching
 * `AnalyticsEvent` from useAnalytics so we have a single vocabulary across
 * GA, Amplitude, and (during the parallel period) Mixpanel.
 *
 * `properties` accepts the same shape useAnalytics already builds - we don't
 * pass undefined values to Amplitude (it gets cranky about them).
 */
export function trackAmplitudeEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === "undefined" || !initialized) return;

  const cleanProps = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, v]) => v !== undefined),
      )
    : undefined;

  amplitude.track(eventName, cleanProps);
}
