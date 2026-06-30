"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateShort } from "@/utils/dateUtils";
import { ArrowLeft, Megaphone, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ContentStatus = "pending" | "in_progress" | "done";

interface QueueRow {
  id: string;
  name: string;
  email: string;
  startedAt?: string;
  expiresAt?: string;
  ready: boolean;
  contentStatus: ContentStatus;
}

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function ContentQueueContent() {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<QueueRow[]>("/payments/admin/super-pro-content");
      setRows(data);
    } catch {
      toast.error("Couldn't load the content queue");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (row: QueueRow, status: ContentStatus) => {
    const prev = row.contentStatus;
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, contentStatus: status } : x)));
    try {
      await api.patch(`/payments/admin/super-pro-content/${row.id}`, { status });
    } catch {
      toast.error("Couldn't update status");
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, contentStatus: prev } : x)));
    }
  };

  // Ready (past the 3-day refund window) + not done = needs the team's attention.
  const actionable = rows.filter((r) => r.ready && r.contentStatus !== "done").length;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <button
          onClick={() => router.push("/admin")}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </button>

        <div className="mb-2 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            <Megaphone className="h-5 w-5 text-[var(--hm-brand-500)]" /> Super Pro content
          </h1>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <p className="mb-6 text-[13px] text-[var(--hm-fg-muted)]">
          Super Pro subscribers. Once past the 3-day refund window (<span className="font-semibold text-[var(--hm-success-600)]">Ready</span>),
          prepare their Facebook / Instagram content + storytelling.
          {actionable > 0 && (
            <span className="ml-1 font-semibold text-[var(--hm-fg-primary)]">
              {actionable} waiting.
            </span>
          )}
        </p>

        {loading ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-[14px] text-[var(--hm-fg-muted)]">No Super Pro subscribers yet.</p>
        ) : (
          <div className="space-y-2.5">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--hm-fg-primary)]">{r.name || "-"}</span>
                    {r.ready ? (
                      <span className="rounded-full bg-[var(--hm-success-500)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--hm-success-600)]">
                        Ready
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--hm-warning-500)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--hm-warning-600)]">
                        In refund window
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-[var(--hm-fg-muted)]">
                    {r.email}
                    {r.startedAt ? ` · started ${formatDateShort(r.startedAt)}` : ""}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(r, opt.value)}
                      className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                        r.contentStatus === opt.value
                          ? "bg-[var(--hm-brand-500)] text-white"
                          : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperProContentPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ContentQueueContent />
    </AuthGuard>
  );
}
