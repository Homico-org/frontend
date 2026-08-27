"use client";

import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Return URL after a cleaning-booking payment. This page is opened inside the
 * mobile app's in-app browser, which has no app locale/auth context, so it is
 * fully self-contained: no providers, no API calls. It just confirms the charge
 * landed and tells the user to return to the app - the app itself verifies the
 * payment (reconcile) when the browser is dismissed and only then creates the
 * booking. The language rides on the ?lang= query set by the backend.
 */

const COPY: Record<string, { title: string; body: string }> = {
  en: {
    title: "Payment received",
    body: "You can return to the Homico app now.",
  },
  ka: {
    title: "გადახდა მიღებულია",
    body: "დაბრუნდით Homico-ს აპლიკაციაში.",
  },
  ru: {
    title: "Оплата получена",
    body: "Вернитесь в приложение Homico.",
  },
};

function ReturnContent() {
  const search = useSearchParams();
  const lang = search.get("lang") || "ka";
  const copy = COPY[lang] || COPY.ka;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "var(--hm-bg-page, #FAFAF7)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "20px",
          maxWidth: "360px",
        }}
      >
        <div
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgb(34,197,94) 0%, rgb(22,163,74) 100%)",
          }}
        >
          <CheckCircle size={44} color="#FFFFFF" strokeWidth={2.25} />
        </div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--hm-fg-primary, #11100D)",
            margin: 0,
          }}
        >
          {copy.title}
        </h1>
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.5,
            color: "var(--hm-fg-secondary, #807D75)",
            margin: 0,
          }}
        >
          {copy.body}
        </p>
      </div>
    </div>
  );
}

export default function BookingReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnContent />
    </Suspense>
  );
}
