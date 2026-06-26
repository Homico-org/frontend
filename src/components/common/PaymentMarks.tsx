import { cn } from "@/lib/utils";

/**
 * Accepted-card-brand marks (Visa + Mastercard) shown at checkout and in the
 * footer. Required by the payment provider (Flitt) before switching the
 * merchant to the live environment. Each mark sits on a white chip so it stays
 * recognizable on both light (checkout) and dark (footer) surfaces.
 */
export default function PaymentMarks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label="Visa, Mastercard">
      {/* Visa */}
      <span className="flex h-6 w-[38px] items-center justify-center rounded-[5px] border border-[var(--hm-border-subtle)] bg-white">
        <span className="text-[12px] font-bold italic leading-none tracking-tight text-[#1434CB]">
          VISA
        </span>
      </span>
      {/* Mastercard */}
      <span className="flex h-6 w-[38px] items-center justify-center rounded-[5px] border border-[var(--hm-border-subtle)] bg-white">
        <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden="true">
          <circle cx="10" cy="8" r="7" fill="#EB001B" />
          <circle cx="16" cy="8" r="7" fill="#F79E1B" />
          <path
            d="M13 2.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8Z"
            fill="#FF5F00"
          />
        </svg>
      </span>
    </div>
  );
}
