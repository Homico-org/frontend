"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import { ArrowLeft, Plus, RefreshCw, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type DiscountType = "amount_off" | "percent_off" | "fixed_price";

interface PromoCode {
  // The api client normalizes Mongo's _id to `id` on every response
  // (see lib/api.ts transformIds), so the list objects carry `id`, not `_id`.
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  applicableTiers: string[];
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  note?: string;
  createdAt?: string;
}

const DISCOUNT_LABEL: Record<DiscountType, string> = {
  amount_off: "₾ off",
  percent_off: "% off",
  fixed_price: "fixed ₾",
};

function PromoCodesContent() {
  const toast = useToast();
  const router = useRouter();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "fixed_price" as DiscountType,
    value: 200,
    tier: "elite",
    maxUses: 0,
    expiresAt: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PromoCode[]>("/payments/admin/promo-codes");
      setCodes(data);
    } catch {
      toast.error("Couldn't load promo codes");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.code.trim()) {
      toast.error("Enter a code");
      return;
    }
    setSaving(true);
    try {
      await api.post("/payments/admin/promo-codes", {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        value: Number(form.value),
        applicableTiers: form.tier === "all" ? [] : [form.tier],
        maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || undefined,
        note: form.note || undefined,
      });
      toast.success("Promo code created");
      setForm((f) => ({ ...f, code: "", note: "" }));
      await load();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Couldn't create code";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: PromoCode) => {
    try {
      await api.patch(`/payments/admin/promo-codes/${c.id}`, { active: !c.active });
      setCodes((prev) =>
        prev.map((p) => (p.id === c.id ? { ...p, active: !c.active } : p)),
      );
    } catch {
      toast.error("Couldn't update code");
    }
  };

  const field = "h-10 rounded-lg border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)] outline-none focus:border-[var(--hm-brand-500)]";

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <button
          onClick={() => router.push("/admin")}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </button>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            <Tag className="h-5 w-5 text-[var(--hm-brand-500)]" /> Promo codes
          </h1>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Create */}
        <div className="mb-8 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5">
          <p className="mb-4 text-[13px] font-semibold text-[var(--hm-fg-primary)]">New code</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className={`${field} uppercase`}
              placeholder="CODE (e.g. SUPER200)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <select
              className={field}
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
            >
              <option value="fixed_price">Fixed price (₾)</option>
              <option value="amount_off">Amount off (₾)</option>
              <option value="percent_off">Percent off (%)</option>
            </select>
            <input
              className={field}
              type="number"
              placeholder="Value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
            <select
              className={field}
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
            >
              <option value="elite">Super Pro only</option>
              <option value="pro">Pro only</option>
              <option value="all">All plans</option>
            </select>
            <input
              className={field}
              type="number"
              placeholder="Max uses (0 = unlimited)"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
            />
            <input
              className={field}
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <input
              className={`${field} sm:col-span-2 lg:col-span-3`}
              placeholder="Note (optional)"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <Button className="mt-4" onClick={create} loading={saving}>
            <Plus className="h-4 w-4" /> Create code
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">Loading...</p>
        ) : codes.length === 0 ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">No promo codes yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Discount</th>
                  <th className="px-4 py-2.5 font-medium">Plans</th>
                  <th className="px-4 py-2.5 font-medium">Used</th>
                  <th className="px-4 py-2.5 font-medium">Expires</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--hm-border-subtle)]">
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--hm-fg-primary)]">
                      {c.code}
                      {c.note && (
                        <span className="block font-sans text-[11px] font-normal text-[var(--hm-fg-muted)]">
                          {c.note}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-secondary)]">
                      {c.value} {DISCOUNT_LABEL[c.discountType]}
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-secondary)]">
                      {c.applicableTiers.length
                        ? c.applicableTiers.map((tr) => (tr === "elite" ? "Super Pro" : "Pro")).join(", ")
                        : "All"}
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-secondary)]">
                      {c.usedCount}
                      {c.maxUses > 0 ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[var(--hm-fg-muted)]">
                      {c.expiresAt ? formatDateTimeShort(c.expiresAt) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(c)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          c.active
                            ? "bg-[var(--hm-success-500)]/15 text-[var(--hm-success-600)]"
                            : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]"
                        }`}
                      >
                        {c.active ? "Active" : "Off"}
                      </button>
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

export default function PromoCodesPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <PromoCodesContent />
    </AuthGuard>
  );
}
