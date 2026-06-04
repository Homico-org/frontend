"use client";

import AuthGuard from "@/components/common/AuthGuard";
import BackButton from "@/components/common/BackButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/dateUtils";
import { Receipt } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentRow {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  entityType: "booking" | "project_milestone" | "premium";
  refundedAmountMinor: number;
  createdAt: string;
}

export default function PaymentsHistoryPage() {
  const { t, locale } = useLanguage();
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<PaymentRow[]>("/payments/me");
        if (active) setPayments(Array.isArray(data) ? data : []);
      } catch {
        if (active) setPayments([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const typeLabel = (e: PaymentRow["entityType"]) =>
    e === "booking"
      ? t("payments.types.booking")
      : e === "project_milestone"
        ? t("payments.types.hire")
        : t("payments.types.premium");

  const statusMeta = (
    s: string,
  ): { variant: "success" | "warning" | "danger" | "info"; label: string } => {
    if (s === "succeeded") return { variant: "success", label: t("payments.status.paid") };
    if (s === "refunded" || s === "partially_refunded")
      return { variant: "info", label: t("payments.status.refunded") };
    if (s === "failed" || s === "cancelled")
      return { variant: "danger", label: t("payments.status.failed") };
    return { variant: "warning", label: t("payments.status.pending") };
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-xl mx-auto">
          <BackButton />
          <h1
            className="text-xl sm:text-2xl font-bold mt-2 mb-1"
            style={{ color: "var(--hm-fg-primary)" }}
          >
            {t("payments.title")}
          </h1>
          <p className="text-sm mb-5" style={{ color: "var(--hm-fg-muted)" }}>
            {t("payments.subtitle")}
          </p>

          {payments === null ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
            </div>
          ) : payments.length === 0 ? (
            <Card variant="outlined">
              <CardBody>
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Receipt className="w-8 h-8" style={{ color: "var(--hm-fg-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--hm-fg-secondary)" }}>
                    {t("payments.empty")}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <Card key={p.id} variant="elevated">
                    <CardBody>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: "var(--hm-fg-primary)" }}
                          >
                            {typeLabel(p.entityType)}
                          </p>
                          <p
                            className="text-[12px] mt-0.5"
                            style={{ color: "var(--hm-fg-muted)" }}
                          >
                            {formatDate(p.createdAt, locale)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <p
                            className="text-sm font-bold tabular-nums"
                            style={{ color: "var(--hm-fg-primary)" }}
                          >
                            {formatCurrency(p.amountMinor / 100, { country: "GE" })}
                          </p>
                          <Badge variant={meta.variant} size="xs">
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
