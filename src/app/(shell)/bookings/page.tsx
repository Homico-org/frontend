'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Card, { CardBody } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs } from '@/components/ui/Tabs';
import { ConfirmModal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import type { Booking, BookingStatus } from '@/types/shared';
import SchedulePanel from '@/components/settings/SchedulePanel';
import { Calendar, Check, Clock, Settings2, User, X } from 'lucide-react';
import Link from 'next/link';

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

const STATUS_BADGE: Record<BookingStatus, { variant: 'warning' | 'success' | 'danger' | 'info'; key: string }> = {
  pending: { variant: 'warning', key: 'booking.statusPending' },
  confirmed: { variant: 'success', key: 'booking.statusConfirmed' },
  cancelled: { variant: 'danger', key: 'booking.statusCancelled' },
  completed: { variant: 'info', key: 'booking.statusCompleted' },
};

export default function BookingsPage() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  );
}

function BookingsContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [showSchedule, setShowSchedule] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const today = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    if (activeTab === 'past') {
      return b.date < today || b.status === 'completed';
    }
    // upcoming
    return (
      b.date >= today &&
      (b.status === 'pending' || b.status === 'confirmed')
    );
  });

  const updateStatus = async (bookingId: string, status: BookingStatus, reason?: string) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status,
        cancelReason: reason,
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || (b as any)._id === bookingId
            ? { ...b, status }
            : b,
        ),
      );

      if (status === 'confirmed') toast.success(t('booking.bookingConfirmed'));
      if (status === 'cancelled') toast.success(t('booking.bookingCancelled'));
      if (status === 'completed') toast.success(t('booking.bookingCompleted'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(null);
      setCancelModalId(null);
      setCancelReason('');
    }
  };

  const getOtherParty = (booking: Booking) => {
    const userId = (user as any)?._id || user?.id;
    const proId = booking.professional?._id;
    const isPro = userId === proId;
    return {
      isPro,
      other: isPro ? booking.client : booking.professional,
    };
  };

  const tabs = [
    { id: 'upcoming', label: t('booking.upcoming') },
    { id: 'past', label: t('booking.past') },
    { id: 'cancelled', label: t('booking.cancelled') },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-lg sm:text-2xl font-semibold flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Calendar size={22} style={{ color: '#C4735B' }} />
          {t('booking.title')}
        </h1>
        {user?.role === 'pro' && (
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#C4735B] bg-[#C4735B]/10 hover:bg-[#C4735B]/20 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {t('settings.availability')}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color:
                  activeTab === tab.id
                    ? '#C4735B'
                    : 'var(--color-text-secondary)',
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: '#C4735B' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="#C4735B" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar
            size={48}
            className="mx-auto mb-3 opacity-30"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <p
            className="font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('booking.noBookings')}
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('booking.noBookingsDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const bookingId = booking.id || (booking as any)._id;
            const { isPro, other } = getOtherParty(booking);
            const badge = STATUS_BADGE[booking.status];

            return (
              <Card key={bookingId} variant="elevated">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      >
                        {other?.avatar ? (
                          <img
                            src={storage.getOptimizedImageUrl(other.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User
                            size={18}
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={
                            isPro
                              ? '#'
                              : `/professionals/${other?._id}`
                          }
                          className="font-medium text-sm truncate block hover:underline"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {other?.name || '—'}
                        </Link>
                        <div
                          className="flex items-center gap-2 text-xs mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <Calendar size={12} />
                          <span>{booking.date}</span>
                          <Clock size={12} />
                          <span>
                            {formatHour(booking.startHour)} — {formatHour(booking.endHour)}
                          </span>
                        </div>
                        {booking.note && (
                          <p
                            className="text-xs mt-1 truncate"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {booking.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={badge.variant}>{t(badge.key)}</Badge>

                      {booking.status === 'pending' && isPro && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(bookingId, 'confirmed')}
                          disabled={actionLoading === bookingId}
                        >
                          {actionLoading === bookingId ? (
                            <LoadingSpinner size="xs" />
                          ) : (
                            <>
                              <Check size={14} className="mr-1" />
                              {t('booking.confirmAction')}
                            </>
                          )}
                        </Button>
                      )}

                      {booking.status === 'confirmed' && isPro && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateStatus(bookingId, 'completed')}
                          disabled={actionLoading === bookingId}
                        >
                          <Check size={14} className="mr-1" />
                          {t('booking.completeAction')}
                        </Button>
                      )}

                      {(booking.status === 'pending' ||
                        booking.status === 'confirmed') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelModalId(bookingId)}
                          disabled={actionLoading === bookingId}
                        >
                          <X size={14} className="mr-1" />
                          {t('booking.cancelAction')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <ConfirmModal
          isOpen={!!cancelModalId}
          onClose={() => {
            setCancelModalId(null);
            setCancelReason('');
          }}
          onConfirm={() => updateStatus(cancelModalId, 'cancelled', cancelReason)}
          title={t('booking.cancel')}
          confirmLabel={t('booking.cancelAction')}
          variant="accent"
        >
          <div className="space-y-3">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {t('booking.cancelReason')}
            </p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('booking.cancelReasonPlaceholder')}
              rows={3}
            />
          </div>
        </ConfirmModal>
      )}

      <SchedulePanel isOpen={showSchedule} onClose={() => setShowSchedule(false)} />
    </div>
  );
}
