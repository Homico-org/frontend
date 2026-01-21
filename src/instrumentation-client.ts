// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function isJavaObjectGonePostMessageError(input: unknown): boolean {
  const text =
    typeof input === "string"
      ? input
      : input instanceof Error
        ? input.message
        : "";

  return (
    text.includes("Error invoking postMessage: Java object is gone") ||
    text.includes("Java object is gone")
  );
}

// Only initialize Sentry in production
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://24acdb28b6224d4db3fb752b96e3436d@o4510603263475712.ingest.de.sentry.io/4510603264000080",

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Define how likely Replay events are sampled.
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // This is a common WebView-bridge failure when the site is loaded inside an Android WebView
    // and the underlying Java-side object has been torn down. It's not actionable from the web app,
    // so we drop it to avoid noisy "Unhandled" issues.
    ignoreErrors: [/Error invoking postMessage: Java object is gone/i],
    beforeSend(event, hint) {
      if (isJavaObjectGonePostMessageError(hint?.originalException)) {
        return null;
      }

      const exceptionMessages =
        event.exception?.values?.map((v) => v.value).filter(Boolean) ?? [];
      if (exceptionMessages.some((m) => isJavaObjectGonePostMessageError(m))) {
        return null;
      }

      if (isJavaObjectGonePostMessageError(event.message)) {
        return null;
      }

      return event;
    },

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  });
}

export const onRouterTransitionStart = process.env.NODE_ENV === "production"
  ? Sentry.captureRouterTransitionStart
  : () => {};
