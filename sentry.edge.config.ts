// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://24acdb28b6224d4db3fb752b96e3436d@o4510603263475712.ingest.de.sentry.io/4510603264000080",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  });
}
