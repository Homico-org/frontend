"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

/**
 * Landing page after the user cancels payment at the provider's hosted page.
 * The backend's cancelUrl points here (/bookings/:id/pay/cancelled); the
 * booking stays AWAITING_PAYMENT and is auto-cancelled by the 15-min timeout
 * if never paid, so we just offer a clear retry / exit instead of a 404.
 */
export default function PayCancelledPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--hm-bg-page)" }}
    >
      <Card variant="elevated" className="w-full max-w-md">
        <CardBody>
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            {/* Amber halo - cancelling is user-initiated, not an error, so
                this reads softer than the red failure state. */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(245,158,11,0.30) 0%, transparent 70%)",
                }}
                aria-hidden="true"
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(180deg, rgb(245,158,11) 0%, rgb(217,119,6) 100%)",
                  boxShadow:
                    "0 12px 32px -8px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <XCircle size={42} color="white" strokeWidth={2.25} />
              </div>
            </div>
            <div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--hm-fg-primary)" }}
              >
                {t("pay.cancelledTitle")}
              </h2>
              <p
                className="text-sm leading-relaxed max-w-xs mx-auto"
                style={{ color: "var(--hm-fg-secondary)" }}
              >
                {t("pay.cancelledBody")}
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => router.push(`/bookings/${bookingId}/pay`)}
            >
              {t("pay.tryAgain")}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/bookings")}
            >
              {t("pay.goToBookings")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
