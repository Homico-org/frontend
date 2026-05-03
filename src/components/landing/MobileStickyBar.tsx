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
      className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-all duration-300 ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div
        className="backdrop-blur-xl border-t border-[var(--hm-border)] px-4 py-3 flex gap-2"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--hm-bg-elevated) 95%, transparent)",
        }}
      >
        <Button
          size="sm"
          onClick={onIntakeOpen}
          className="flex-1"
        >
          {t("concierge.requestQuote")}
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="flex-1"
        >
          <Link href="/professionals">{t("landing.browsePros")}</Link>
        </Button>
      </div>
    </div>
  );
}
