"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import { ArrowLeft, RefreshCw, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Purchase {
  id: string;
  buyerName: string;
  buyerEmail: string;
  tier: string;
  tierLabel: string;
  amount: number;
  currency: string;
  promoCode: string | null;
  status: string;
  refunded: boolean;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-[var(--hm-success-500)]/15 text-[var(--hm-success-600)]",
  pending: "bg-[var(--hm-warning-500)]/15 text-[var(--hm-warning-600)]",
  failed: "bg-[var(--hm-error-500)]/15 text-[var(--hm-error-500)]",
  refunded: "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]",
};

function PurchasesContent() {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Purchase[]>("/payments/admin/premium-purchases");
      setRows(data);
    } catch {
      toast.error("Couldn't load purchases");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const succeeded = rows.filter((r) => r.status === "succeeded" && !r.refunded);
  const revenue = succeeded.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <button
          onClick={() => router.push("/admin")}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            <ShoppingBag className="h-5 w-5 text-[var(--hm-brand-500)]" /> Premium purchases
          </h1>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <div className="mb-6 flex gap-8">
          <div>
            <p className="text-[22px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
              {succeeded.length}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
              active purchases
            </p>
          </div>
          <div>
            <p className="text-[22px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
              ₾{revenue.toLocaleString()}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
              collected
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">No purchases yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--hm-border-subtle)]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Buyer</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Promo</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--hm-border-subtle)]">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--hm-fg-primary)]">{r.buyerName || "-"}</span>
                      <span className="block text-[11px] text-[var(--hm-fg-muted)]">{r.buyerEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-secondary)]">{r.tierLabel}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--hm-fg-secondary)]">
                      {r.currency === "GEL" ? "₾" : ""}
                      {r.amount}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--hm-fg-muted)]">
                      {r.promoCode || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLE[r.refunded ? "refunded" : r.status] || STATUS_STYLE.pending
                        }`}
                      >
                        {r.refunded ? "refunded" : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-muted)]">
                      {formatDateTimeShort(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PremiumPurchasesPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <PurchasesContent />
    </AuthGuard>
  );
}
