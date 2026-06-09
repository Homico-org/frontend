'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { ArrowRight, Calendar, Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Party {
  _id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
}
interface AdminBooking {
  _id: string;
  status: string;
  paymentStatus?: string;
  date: string;
  startHour: number;
  endHour: number;
  totalAmount?: number;
  totalAmountMinor?: number;
  professional?: Party | string;
  client?: Party | string;
  services?: { name: string; quantity: number }[];
  createdAt: string;
}
interface BookingStats {
  total: number;
  awaitingPayment: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  disputed: number;
  gmvMinor: number;
}

const fmt = (m?: number) => `${Math.round((m ?? 0) / 100).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

const STATUS_FILTERS = [
  '',
  'awaiting_payment',
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
];

const STATUS_TONE: Record<string, string> = {
  awaiting_payment: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  awaiting_client_confirmation: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-neutral-200 text-neutral-600',
  disputed: 'bg-red-100 text-red-700',
};

const party = (p?: Party | string): Party =>
  typeof p === 'object' && p ? p : {};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setBookings(null);
    api
      .get<{ bookings: AdminBooking[] }>('/admin/bookings', {
        params: { status: statusFilter || undefined, search: search || undefined, limit: 50 },
      })
      .then((r) => setBookings(r.data.bookings || []))
      .catch(() => setBookings([]));
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get<BookingStats>('/admin/bookings/stats')
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-1 text-[24px] font-bold text-[var(--hm-fg-primary)]">Bookings</h1>
        <p className="mb-4 text-[13px] text-[var(--hm-fg-muted)]">
          Every booking across the marketplace - both parties, money, and status.
        </p>

        {/* Stats strip */}
        {stats && (
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Paid GMV', value: fmt(stats.gmvMinor) },
              { label: 'Confirmed', value: stats.confirmed },
              { label: 'Disputed', value: stats.disputed },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-3"
              >
                <p className="text-[11px] text-[var(--hm-fg-muted)]">{s.label}</p>
                <p className="mt-0.5 text-[18px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Search + status filters */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client or pro name / phone"
          className="mb-3 w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 py-2 text-[13px] text-[var(--hm-fg-primary)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                  : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
              }`}
            >
              {s ? s.replace(/_/g, ' ') : 'All'}
            </button>
          ))}
        </div>

        {bookings === null ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-[var(--hm-fg-muted)]">No bookings.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {bookings.map((b) => {
              const pro = party(b.professional);
              const client = party(b.client);
              return (
                <div
                  key={b._id}
                  className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_TONE[b.status] || 'bg-neutral-100 text-neutral-600'}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                      {fmt(b.totalAmountMinor ?? (b.totalAmount ?? 0) * 100)}
                    </span>
                  </div>

                  {/* client -> pro */}
                  <div className="mt-2.5 flex items-center gap-2 text-[13px]">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Avatar src={client.avatar} name={client.name} size="xs" />
                      <span className="truncate font-medium text-[var(--hm-fg-primary)]">{client.name || 'Client'}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--hm-fg-muted)]" />
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Avatar src={pro.avatar} name={pro.name} size="xs" />
                      <span className="truncate font-medium text-[var(--hm-fg-primary)]">{pro.name || 'Pro'}</span>
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--hm-fg-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {b.date} · {b.startHour}:00-{b.endHour}:00
                    </span>
                    {pro.phone && (
                      <a href={`tel:${pro.phone}`} className="inline-flex items-center gap-1 hover:text-[var(--hm-brand-500)]">
                        <Phone className="h-3.5 w-3.5" /> {pro.phone}
                      </a>
                    )}
                    {b.paymentStatus && <span>· {b.paymentStatus.replace(/_/g, ' ')}</span>}
                    {b.services?.length ? (
                      <span className="truncate">· {b.services.map((s) => s.name).join(', ')}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
