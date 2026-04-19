"use client";

import { ArrowRight, Briefcase, Search } from "lucide-react";

export interface UserTypeSelectorProps {
  onSelect: (type: "client" | "pro") => void;
  locale?: "en" | "ka" | "ru";
  className?: string;
}

const translations = {
  en: {
    client: {
      title: "I need a professional",
      description: "Post a job and get proposals from verified pros",
      cta: "Get Started",
    },
    pro: {
      title: "I am a professional",
      description: "Join our network, find clients, grow your business",
      cta: "Join as Pro",
    },
  },
  ka: {
    client: {
      title: "მჭირდება სპეციალისტი",
      description: "განათავსე სამუშაო და მიიღე შეთავაზებები სპეციალისტებისგან",
      cta: "დაწყება",
    },
    pro: {
      title: "ვარ სპეციალისტი",
      description: "შემოგვიერთდი, იპოვე კლიენტები, გაზარდე შემოსავალი",
      cta: "შემოგვიერთდი",
    },
  },
  ru: {
    client: {
      title: "Мне нужен специалист",
      description: "Разместите заказ и получите предложения от проверенных специалистов",
      cta: "Начать",
    },
    pro: {
      title: "Я специалист",
      description: "Присоединяйтесь, находите клиентов, развивайте бизнес",
      cta: "Присоединиться",
    },
  },
};

export default function UserTypeSelector({
  onSelect,
  locale = "en",
  className = "",
}: UserTypeSelectorProps) {
  const t = translations[locale];

  return (
    <div className={`grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto ${className}`}>
      {/* Client */}
      <button
        onClick={() => onSelect("client")}
        className="group relative bg-[var(--hm-bg-elevated)] rounded-xl border-2 border-[var(--hm-border)] hover:border-[var(--hm-brand-500)]/40 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--hm-info-50)]/20 flex items-center justify-center mb-4">
          <Search className="w-5 h-5 text-[var(--hm-info-500)]" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[var(--hm-fg-primary)] mb-1">
          {t.client.title}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)] mb-4 leading-relaxed">
          {t.client.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hm-fg-primary)] group-hover:text-[var(--hm-brand-500)] group-hover:gap-2.5 transition-all">
          {t.client.cta}
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>

      {/* Pro */}
      <button
        onClick={() => onSelect("pro")}
        className="group relative bg-neutral-900 rounded-xl border-2 border-neutral-800 hover:border-[var(--hm-brand-500)]/60 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-[var(--hm-brand-500)]/10 active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/20 flex items-center justify-center mb-4">
          <Briefcase className="w-5 h-5 text-[var(--hm-brand-500)]" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-1">
          {t.pro.title}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)] mb-4 leading-relaxed">
          {t.pro.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hm-brand-500)] group-hover:gap-2.5 transition-all">
          {t.pro.cta}
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
}
