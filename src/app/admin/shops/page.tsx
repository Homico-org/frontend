'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import { Ban, Check, Clock, Store } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SellerShop {
  key: string;
  name: string;
  status: 'pending' | 'approved' | 'suspended';
  legalName?: string;
  productCount?: number;
  ownerUserId?: string;
  createdAt?: string;
}

const STATUS_STYLE: Record<SellerShop['status'], string> = {
  pending: 'bg-[var(--hm-warning-500)]/[0.12] text-[var(--hm-warning-600)]',
  approved: 'bg-[var(--hm-success-500)]/[0.12] text-[var(--hm-success-600)]',
  suspended: 'bg-[var(--hm-error-500)]/[0.12] text-[var(--hm-error-500)]',
};

/**
 * Admin moderation for self-serve shops (Phase B). A shop signs up as 'pending'
 * (hidden from the public catalog); an admin approves it to go live, or
 * suspends a bad actor.
 */
function AdminShopsInner() {
  const toast = useToast();
  const [shops, setShops] = useState<SellerShop[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<SellerShop[]>('/supplier-catalog/admin/shops');
      setShops(data || []);
    } catch {
      setShops([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (key: string, status: SellerShop['status']) => {
    setBusyKey(key);
    try {
      await api.post(`/supplier-catalog/admin/shops/${key}/status`, { status });
      setShops((prev) =>
        (prev || []).map((s) => (s.key === key ? { ...s, status } : s)),
      );
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed'));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-primary)]">
          <Store className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            Seller shops
          </h1>
          <p className="text-[13px] text-[var(--hm-fg-muted)]">
            Approve or suspend self-serve shops.
          </p>
        </div>
      </header>

      {shops === null ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-12 text-center text-[14px] text-[var(--hm-fg-muted)]">
          No seller shops yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--hm-border-subtle)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {shops.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                    {s.name}
                  </p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[s.status]}`}>
                    {s.status === 'pending' && <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />}
                    {s.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--hm-fg-muted)]">
                  {s.legalName ? `${s.legalName} · ` : ''}
                  {s.productCount ?? 0} products
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.status !== 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => setStatus(s.key, 'approved')}
                    disabled={busyKey === s.key}
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                  >
                    Approve
                  </Button>
                )}
                {s.status !== 'suspended' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(s.key, 'suspended')}
                    disabled={busyKey === s.key}
                    leftIcon={<Ban className="h-3.5 w-3.5" />}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminShopsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminShopsInner />
    </AuthGuard>
  );
}
