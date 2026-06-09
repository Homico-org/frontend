"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

/**
 * Landing page when the client cancels the hire payment at the provider.
 * The backend cancelUrl points here; the proposal stays pending (un-hired)
 * until paid, so we offer retry (back to the proposals list) / exit.
 */
export default function JobPayCancelledPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
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
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(180deg, rgb(245,158,11) 0%, rgb(217,119,6) 100%)" }}
            >
              <XCircle size={42} color="white" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--hm-fg-primary)" }}>
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
              onClick={() => router.push(`/my-jobs/${jobId}/proposals`)}
            >
              {t("pay.tryAgain")}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push(`/jobs/${jobId}`)}>
              {t("pay.goToJob")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
