"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // global-error runs OUTSIDE the providers tree (the root layout
  // itself crashed) so we can't read i18n, theme, or brand tokens
  // from React context. Everything below is intentionally
  // self-contained: English copy, inline styles, no dependencies on
  // any other component in the tree. This is the safety net of the
  // safety net - keep it minimal.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#FFFCF7",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#0F172A",
        }}
      >
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(239, 78, 36, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}
            aria-hidden
          >
            !
          </div>
          <h1
            style={{
              fontFamily:
                "'Fraunces', 'Noto Serif Georgian', Georgia, serif",
              fontSize: 28,
              lineHeight: 1.2,
              fontWeight: 500,
              margin: "0 0 8px",
            }}
          >
            Something broke on our side
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "#64748B",
              margin: "0 0 24px",
            }}
          >
            We&apos;ve been notified and are looking into it. You can try
            again, or head back to the homepage.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#EF4E24",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                fontSize: 14,
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
          {error?.digest && (
            <p
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "#94A3B8",
                fontFamily:
                  "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              Ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
