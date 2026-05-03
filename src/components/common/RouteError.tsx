"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  // Don't swallow Next.js framework signals — let RedirectBoundary / NotFoundBoundary handle them.
  if (
    error?.digest?.startsWith("NEXT_REDIRECT") ||
    error?.digest === "NEXT_NOT_FOUND"
  ) {
    throw error;
  }

  const { t } = useLanguage();

  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-[var(--hm-error-100)]/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle
            className="w-7 h-7 text-[var(--hm-error-500)]"
            strokeWidth={1.75}
          />
        </div>
        <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1.5">
          {t("common.somethingWentWrong")}
        </h2>
        <p className="text-sm text-[var(--hm-fg-secondary)] mb-5">
          {t("common.errorBody")}
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] transition-colors"
          >
            {t("common.tryAgain")}
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
          >
            {t("common.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
