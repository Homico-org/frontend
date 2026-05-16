"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MobileStickyBarProps {
  onIntakeOpen: () => void;
}

export default function MobileStickyBar({ onIntakeOpen }: MobileStickyBarProps) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[55] sm:hidden transition-all duration-300 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div
        className="backdrop-blur-xl border-t border-[var(--hm-border)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--hm-bg-elevated) 95%, transparent)",
        }}
      >
        {/* Dedicated short sticky-bar labels (`landing.stickyQuote`,
            `landing.stickyBrowse`). The longer fully-spelled labels used
            elsewhere ("შეთავაზების მოთხოვნა", "პროფესიონალების ნახვა")
            don't fit a half-row on narrow Georgian/Russian phones - both
            were truncating to "შე..." / "...ნახ" in the prior screenshot.
            Brief action-nouns sized for buttons (ka: "შეთავაზება",
            "ხელოსნები"; ru: "Запросить", "Мастера"; en: "Get quote",
            "See pros"). */}
        <Button
          size="sm"
          onClick={onIntakeOpen}
          className="flex-1 min-w-0 px-3"
        >
          <span className="truncate">{t("landing.stickyQuote")}</span>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="flex-1 min-w-0 px-3"
        >
          <Link href="/professionals" className="truncate">
            {t("landing.stickyBrowse")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
