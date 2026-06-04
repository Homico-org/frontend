'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import CancelBookingModal from '@/components/bookings/CancelBookingModal';
import RaiseDisputeModal from '@/components/bookings/RaiseDisputeModal';
import AddToProjectModal from '@/components/projects/AddToProjectModal';
import SlaDeadlineChip from '@/components/sla/SlaDeadlineChip';
import { features } from '@/config/features';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useCountryLink } from '@/hooks/useCountry';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { currencySymbol } from '@/utils/currency';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import type { Booking, BookingStatus } from '@/types/shared';
import SchedulePanel from '@/components/settings/SchedulePanel';
import { Alert } from '@/components/ui/Alert';
import { IconBadge } from '@/components/ui/IconBadge';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CreditCard,
  ImagePlus,
  MapPin,
  Settings2,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

// Each booking carries its own currency code (added 2026-05). Falling
// back to the booking's country, then to GE, keeps legacy rows readable.
function formatCurrency(amount: number, booking: Pick<Booking, 'currency' | 'country'>): string {
  const sym = booking.currency
    ? currencySymbol({ currency: booking.currency })
    : currencySymbol({ country: booking.country ?? 'GE' });
  return amount % 1 === 0 ? `${amount.toFixed(0)} ${sym}` : `${amount.toFixed(2)} ${sym}`;
}

// Catalog units come labelled as "per X" (e.g. "per m²", "per hour").
// The service row already prefixes the unit with "/", so the literal
// "per " becomes redundant - rendering it raw produces "× 4 / per m²"
// which reads as "× 4 / per per m²" in some locales where the prefix
// was double-applied. Strip the leading "per " token so a 60₾ per-m²
// line renders as "× 4 / m²".
function formatUnitLabel(unit: string | undefined | null): string {
  if (!unit) return '';
  return unit.replace(/^per[\s_]+/i, '').trim();
}

// Hand-rolled weekday + month tables for Georgian and Russian. The
// dateUtils helpers document why: Node ships with minimal ICU data and
// `Intl.DateTimeFormat('ka-GE')` silently falls back to English in
// production, which is exactly what shipped on this page before the fix.
const KA_WEEKDAY_LONG = [
  'კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი',
  'ხუთშაბათი', 'პარასკევი', 'შაბათი',
] as const;
const KA_MONTH_SHORT = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
] as const;
const RU_WEEKDAY_LONG = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
] as const;
const RU_MONTH_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
] as const;
const EN_WEEKDAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

// Parts for the calendar-style date block at the head of the card.
// Returning structured pieces (day / month / weekday) instead of a
// formatted string lets the renderer treat each as a typographic layer.
function bookingDateParts(
  isoDate: string,
  locale: 'en' | 'ka' | 'ru',
): { day: number; month: string; weekday: string } | null {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  if (locale === 'ka') {
    return {
      day: d.getDate(),
      month: KA_MONTH_SHORT[d.getMonth()],
      weekday: KA_WEEKDAY_LONG[d.getDay()],
    };
  }
  if (locale === 'ru') {
    return {
      day: d.getDate(),
      month: RU_MONTH_SHORT[d.getMonth()],
      weekday: RU_WEEKDAY_LONG[d.getDay()],
    };
  }
  return {
    day: d.getDate(),
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
    weekday: EN_WEEKDAY_LONG[d.getDay()],
  };
}


const STATUS_CONFIG: Record<
  BookingStatus,
  { strip: string; bg: string; text: string; key: string }
> = {
  pending: {
    strip: 'rgb(245, 158, 11)',
    bg: 'rgba(245, 158, 11, 0.08)',
    text: 'rgb(161, 98, 7)',
    key: 'booking.statusPending',
  },
  confirmed: {
    strip: 'rgb(16, 185, 129)',
    bg: 'rgba(16, 185, 129, 0.08)',
    text: 'rgb(6, 120, 80)',
    key: 'booking.statusConfirmed',
  },
  in_progress: {
    strip: 'rgb(59, 130, 246)',
    bg: 'rgba(59, 130, 246, 0.08)',
    text: 'rgb(30, 64, 175)',
    key: 'booking.statusInProgress',
  },
  cancelled: {
    strip: 'rgb(239, 68, 68)',
    bg: 'rgba(239, 68, 68, 0.06)',
    text: 'rgb(185, 28, 28)',
    key: 'booking.statusCancelled',
  },
  completed: {
    strip: 'rgb(107, 114, 128)',
    bg: 'rgba(107, 114, 128, 0.08)',
    text: 'rgb(75, 85, 99)',
    key: 'booking.statusCompleted',
  },
  // === Payment-aware statuses (added 2026-05) ===
  awaiting_payment: {
    strip: 'rgb(217, 119, 6)',
    bg: 'rgba(217, 119, 6, 0.08)',
    text: 'rgb(146, 64, 14)',
    key: 'booking.statusAwaitingPayment',
  },
  awaiting_client_confirmation: {
    strip: 'rgb(168, 85, 247)',
    bg: 'rgba(168, 85, 247, 0.08)',
    text: 'rgb(126, 34, 206)',
    key: 'booking.statusAwaitingClientConfirmation',
  },
  disputed: {
    strip: 'rgb(220, 38, 38)',
    bg: 'rgba(220, 38, 38, 0.08)',
    text: 'rgb(153, 27, 27)',
    key: 'booking.statusDisputed',
  },
};

type WorkflowStep = 'start' | 'complete' | null;

/* ─── Photo Upload ─── */
function PhotoUploadSection({
  label,
  photos,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  photos: string[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium" style={{ color: 'var(--hm-fg-secondary)' }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div
            key={url}
            className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
            style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
          >
            <Image src={url} alt="" fill sizes="64px" className="object-cover" unoptimized />
            <button
              onClick={() => onRemove(url)}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] transition-colors"
          style={{ borderColor: 'var(--hm-border)', color: 'var(--hm-fg-muted)' }}
        >
          {uploading ? <LoadingSpinner size="xs" /> : <ImagePlus className="w-5 h-5" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          if (inputRef.current) inputRef.current.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

/* ─── Photo Thumbnails (before/after preview) ─── */
function PhotoThumbs({ photos, label }: { photos: string[]; label: string }) {
  if (!photos || photos.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <p
        className="text-[10px] font-semibold uppercase tracking-wider shrink-0"
        style={{ color: 'var(--hm-fg-muted)' }}
      >
        {label}
      </p>
      <div className="flex">
        {photos.slice(0, 4).map((url, idx) => (
          <div
            key={url}
            className="w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-2 ring-[var(--hm-bg-elevated)]"
            style={{
              backgroundColor: 'var(--hm-bg-tertiary)',
              marginLeft: idx > 0 ? '-8px' : undefined,
              position: 'relative',
              zIndex: 4 - idx,
            }}
          >
            <Image
              src={storage.getOptimizedImageUrl(url, { width: 80, quality: 70 })}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
        {photos.length > 4 && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold ring-2 shrink-0"
            style={{
              backgroundColor: 'var(--hm-bg-tertiary)',
              color: 'var(--hm-fg-secondary)',
              marginLeft: '-8px',
              position: 'relative',
              zIndex: 0,
            }}
          >
            +{photos.length - 4}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  if (!features.bookings) notFound();
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  );
}

function BookingsContent() {
  const { t, locale, pick } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const cl = useCountryLink();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [showSchedule, setShowSchedule] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  // Booking being graduated into a project (client only).
  const [addToProjectId, setAddToProjectId] = useState<string | null>(null);
  // Dispute modal also needs to know which role the current user has on
  // this booking so it can filter the available dispute types (e.g. only
  // pros can raise "client no-show"). One state object keeps the two
  // values in sync; null means the modal is closed.
  const [disputeContext, setDisputeContext] = useState<
    { bookingId: string; role: 'client' | 'pro' } | null
  >(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState<Record<string, WorkflowStep>>({});
  const [workflowPhotos, setWorkflowPhotos] = useState<Record<string, string[]>>({});
  const [photoUploading, setPhotoUploading] = useState<string | null>(null);

  // Shared abort ref - fetchBookings is called from mount and from
  // status-change handlers as a refetch trigger. Cancelling the prior
  // request avoids racing two `GET /bookings/my` responses for the same
  // setBookings on Strict Mode remount or rapid status updates.
  const fetchBookingsAbortRef = useRef<AbortController | null>(null);
  const fetchBookings = useCallback(async () => {
    fetchBookingsAbortRef.current?.abort();
    const controller = new AbortController();
    fetchBookingsAbortRef.current = controller;
    try {
      const { data } = await api.get('/bookings/my', {
        signal: controller.signal,
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const code = (err as { code?: string })?.code;
      if (name === 'CanceledError' || code === 'ERR_CANCELED') return;
      // ignore other errors silently (matches original behavior)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Refetch whenever the notification unread count ticks up - new
  // booking requests, payment-status changes, and cancellation
  // notifications all bump it. Tracked via a ref so we only react to
  // UP-transitions, not when the user marks notifications read.
  const { unreadCount: notifUnreadCount } = useNotifications();
  const lastNotifUnreadRef = useRef(notifUnreadCount);
  useEffect(() => {
    if (notifUnreadCount > lastNotifUnreadRef.current) {
      void fetchBookings();
    }
    lastNotifUnreadRef.current = notifUnreadCount;
  }, [notifUnreadCount, fetchBookings]);

  // Refetch when the tab regains focus. Covers the cases where the
  // user paid in another tab, returned to this one, and would
  // otherwise see the pre-payment AWAITING_PAYMENT status until they
  // navigate away and back. Same pattern as /my-jobs and /my-work.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchBookings();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchBookings]);

  const today = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    if (activeTab === 'past') return b.status === 'completed' || (b.date < today && b.status !== 'pending' && b.status !== 'confirmed' && b.status !== 'in_progress' && b.status !== 'cancelled');
    // Upcoming: show all active bookings (pending/confirmed/in_progress) regardless of date
    return b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_progress';
  });

  const updateStatus = async (bookingId: string, status: BookingStatus, reason?: string) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status, cancelReason: reason });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || (b as { _id?: string })._id === bookingId
            ? { ...b, status }
            : b,
        ),
      );
      if (status === 'confirmed') toast.success(t('booking.bookingConfirmed'));
      if (status === 'cancelled') toast.success(t('booking.bookingCancelled'));
      if (status === 'completed') toast.success(t('booking.bookingCompleted'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setActionLoading(null);
      setCancelModalId(null);
      setCancelReason('');
    }
  };

  const uploadPhoto = async (bookingId: string, file: File): Promise<string | null> => {
    setPhotoUploading(bookingId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use the shared axios client so the upload goes through the auth
      // interceptor (401 refresh, base URL, global error mapping)
      // instead of the manual fetch that bypassed all of that.
      const response = await api.post<{ url?: string }>('/upload/public', formData);
      const data = response.data;
      if (data?.url) {
        return data.url.startsWith('http') || data.url.startsWith('data:')
          ? data.url
          : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPhotoUploading(null);
    }
    return null;
  };

  const handleStartWork = async (bookingId: string) => {
    const photos = workflowPhotos[bookingId] ?? [];
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/start`, { beforePhotos: photos });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || (b as { _id?: string })._id === bookingId
            ? { ...b, status: 'in_progress' as BookingStatus, beforePhotos: photos }
            : b,
        ),
      );
      setWorkflowStep((prev) => ({ ...prev, [bookingId]: null }));
      setWorkflowPhotos((prev) => ({ ...prev, [bookingId]: [] }));
      toast.success(t('booking.bookingConfirmed'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteWork = async (bookingId: string) => {
    const photos = workflowPhotos[bookingId] ?? [];
    if (photos.length === 0) {
      toast.error(t('booking.atLeastOnePhoto'));
      return;
    }
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/complete`, { afterPhotos: photos });
      // Server moves the booking to AWAITING_CLIENT_CONFIRMATION (escrow stays
      // held; client has 48h to confirm or dispute). Optimistically mirror
      // that state so the row swaps to "Waiting for client to confirm" instead
      // of jumping straight to "Completed" and then snapping back on refresh.
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || (b as { _id?: string })._id === bookingId
            ? {
                ...b,
                status: 'awaiting_client_confirmation' as BookingStatus,
                afterPhotos: photos,
              }
            : b,
        ),
      );
      setWorkflowStep((prev) => ({ ...prev, [bookingId]: null }));
      setWorkflowPhotos((prev) => ({ ...prev, [bookingId]: [] }));
      toast.success(t('booking.bookingCompleted'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const addPhoto = async (bookingId: string, file: File) => {
    const url = await uploadPhoto(bookingId, file);
    if (url) {
      setWorkflowPhotos((prev) => ({
        ...prev,
        [bookingId]: [...(prev[bookingId] ?? []), url],
      }));
    }
  };

  const removePhoto = (bookingId: string, url: string) => {
    setWorkflowPhotos((prev) => ({
      ...prev,
      [bookingId]: (prev[bookingId] ?? []).filter((u) => u !== url),
    }));
  };

  const getOtherParty = (booking: Booking) => {
    const userId = user?.id;
    const proId = booking.professional?.id || booking.professional?._id;
    const isPro = userId === proId;
    return { isPro, other: isPro ? booking.client : booking.professional };
  };

  const tabs = [
    {
      id: 'upcoming' as const,
      label: t('booking.upcoming'),
      count: bookings.filter(
        (b) =>
          b.date >= today &&
          ['pending', 'confirmed', 'in_progress'].includes(b.status),
      ).length,
    },
    {
      id: 'past' as const,
      label: t('booking.past'),
      count: bookings.filter((b) => b.date < today || b.status === 'completed').length,
    },
    {
      id: 'cancelled' as const,
      label: t('booking.cancelled'),
      count: bookings.filter((b) => b.status === 'cancelled').length,
    },
  ];

  return (
    <div className="w-full">
      {/* Tab bar + availability. On phones the "Availability" button
          was stealing tab space and clipping "ისტორია"/"გაუქმებული"
          mid-word. Compress to an icon-only square on <sm; full label
          surfaces at sm+ where the tabs have room to breathe. */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <Tabs
            variant="default"
            tabs={tabs.map((t) => ({
              id: t.id,
              label: t.label,
              badge: t.count > 0 ? t.count : undefined,
            }))}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as typeof activeTab)}
          />
        </div>
        {user?.role === 'pro' && (
          <>
            {/* Mobile: 40px square icon button - reaches iOS 44px tap
                comfort with active-scale feedback, no label crowding. */}
            <button
              type="button"
              onClick={() => setShowSchedule(true)}
              aria-label={t('settings.availability')}
              title={t('settings.availability')}
              className="sm:hidden shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 transition-all active:scale-95"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {/* sm+: full labeled button (existing desktop treatment). */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSchedule(true)}
              leftIcon={<Settings2 className="w-4 h-4" />}
              className="hidden sm:inline-flex shrink-0 text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 hover:text-[var(--hm-brand-500)]"
            >
              {t('settings.availability')}
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
        </div>
      ) : filteredBookings.length === 0 ? (
        // Empty state Tier 1: colored IconBadge instead of muted grey
        // (greyed-out icons read as broken/error state per NN/g empty-
        // state research), real headline framing the surface as an
        // invitation, brand-premium CTA. The bookings tab is one of the
        // highest-intent unconverted-user moments - waste no slot on
        // sterile "no data" messaging.
        <div className="text-center py-16 max-w-md mx-auto">
          <IconBadge
            icon={Calendar}
            variant="accent"
            size="lg"
            className="mx-auto mb-4"
          />
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--hm-fg-primary)' }}
          >
            {t('booking.noBookings')}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--hm-fg-secondary)' }}>
            {t('booking.noBookingsDescription')}
          </p>
          <Link href={cl('/professionals')}>
            <Button variant="premium" size="default" rightIcon={<ArrowRight />}>
              {t('booking.findProfessional')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const bookingId =
              booking.id || (booking as { _id?: string })._id || '';
            const { isPro, other } = getOtherParty(booking);
            const sc = STATUS_CONFIG[booking.status];
            const step = workflowStep[bookingId] ?? null;
            const photos = workflowPhotos[bookingId] ?? [];
            const services = booking.services ?? [];
            const hasPhotos =
              (booking.beforePhotos?.length ?? 0) > 0 ||
              (booking.afterPhotos?.length ?? 0) > 0;

            const isTerminal = booking.status === 'cancelled';
            // Roll up secondary actions once so the layout doesn't render an
            // empty `<div>` slot on terminal states (would still occupy
            // gap space inside `justify-between`).
            const canCancel =
              !isTerminal &&
              (booking.status === 'awaiting_payment' ||
                booking.status === 'pending' ||
                booking.status === 'confirmed');
            const canDispute =
              booking.status === 'confirmed' ||
              booking.status === 'in_progress' ||
              booking.status === 'awaiting_client_confirmation';
            const hasSecondary = canCancel || canDispute;

            // Pulse the status-dot only on live states - terminal states
            // shouldn't draw the eye and "in_progress" benefits from the
            // micro-animation that says "this is happening right now".
            const shouldPulse =
              booking.status === 'pending' ||
              booking.status === 'awaiting_payment' ||
              booking.status === 'in_progress' ||
              booking.status === 'awaiting_client_confirmation';

            return (
              <div
                key={bookingId}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-200 ${
                  isTerminal
                    ? 'opacity-60'
                    : 'hover:-translate-y-[2px] hover:shadow-lg'
                }`}
                style={{
                  backgroundColor: 'var(--hm-bg-elevated)',
                  border: '1px solid var(--hm-border-subtle)',
                  // Layered shadow stack - the close shadow grounds the
                  // card, the wider one floats it. This is the Apple /
                  // Linear premium-card formula; flat `shadow-sm` reads
                  // utilitarian by comparison.
                  boxShadow:
                    '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
                }}
              >
                {/* Status rail - an inset rounded pill instead of a flat
                    border, with a soft glow that picks up on hover. Reads
                    intentional rather than utilitarian. */}
                <span
                  aria-hidden="true"
                  className="absolute left-2 top-4 bottom-4 w-1 rounded-full transition-all duration-200 group-hover:w-[5px]"
                  style={{
                    backgroundColor: sc.strip,
                    boxShadow: `0 0 12px ${sc.strip}40`,
                  }}
                />

                {/* ── Card body ── (left padding accommodates the rail) */}
                <div className="pl-6 pr-5 pt-4 pb-3">
                  {/* Status pill at top-left - the first fixation point
                      on a bookings list ("is this thing waiting on me?")
                      lands here, not on the avatar. The pulsing dot on
                      live states is what makes the card feel "alive". */}
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        backgroundColor: sc.bg,
                        color: sc.text,
                        boxShadow: `inset 0 0 0 1px ${sc.strip}30`,
                      }}
                    >
                      <span className="relative flex items-center justify-center w-1.5 h-1.5">
                        {shouldPulse && (
                          <span
                            className="absolute inset-0 rounded-full animate-ping opacity-60"
                            style={{ backgroundColor: sc.strip }}
                          />
                        )}
                        <span
                          className="relative w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: sc.strip }}
                        />
                      </span>
                      {t(sc.key)}
                    </span>
                  </div>

                  {/* Header row: calendar-style date block + weekday +
                      time + avatar/name. The mini-calendar block is the
                      iconic premium "this is a scheduled thing" visual
                      (Airbnb trip / Calendar event / Cal.com) - it makes
                      the card read as a booking, not a notification. */}
                  {(() => {
                    const parts = bookingDateParts(
                      booking.date,
                      locale as 'en' | 'ka' | 'ru',
                    );
                    return (
                      <div className="flex items-center gap-3 mb-3">
                        {parts && (
                          <div
                            className="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0"
                            style={{
                              backgroundColor: 'var(--hm-bg-page)',
                              border: '1px solid var(--hm-border-subtle)',
                              boxShadow:
                                'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(15,23,42,0.04)',
                            }}
                          >
                            <span
                              className="text-[9px] font-bold uppercase tracking-[0.1em] leading-none mb-0.5"
                              style={{ color: sc.text }}
                            >
                              {parts.month}
                            </span>
                            <span
                              className="text-[22px] font-bold leading-none tabular-nums"
                              style={{ color: 'var(--hm-fg-primary)' }}
                            >
                              {parts.day}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold leading-tight truncate"
                            style={{ color: 'var(--hm-fg-primary)' }}
                          >
                            {parts?.weekday}
                          </p>
                          <p
                            className="text-xs tabular-nums mt-0.5"
                            style={{ color: 'var(--hm-fg-secondary)' }}
                          >
                            {formatHour(booking.startHour)}–
                            {formatHour(booking.endHour)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Who - avatar with a soft status-colored ring that
                      ties this row back to the status pill above. Tiny
                      detail, but it's the kind of considered touch that
                      separates "premium card" from "list row". */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="rounded-full shrink-0"
                      style={{
                        padding: '2px',
                        background: `linear-gradient(135deg, ${sc.strip}40, ${sc.strip}10)`,
                      }}
                    >
                      <Avatar
                        src={other?.avatar}
                        name={other?.name || ''}
                        size="sm"
                        className="ring-2 ring-[var(--hm-bg-elevated)]"
                      />
                    </div>
                    <Link
                      href={
                        isPro
                          ? '#'
                          : `/professionals/${other?.id || other?._id}`
                      }
                      className="font-medium text-sm truncate hover:underline min-w-0"
                      style={{ color: 'var(--hm-fg-primary)' }}
                    >
                      {other?.name || '-'}
                    </Link>
                  </div>

                  {/* SLA accept countdown - pro view only, only while
                      the booking is still in PENDING (paid, awaiting
                      pro confirmation). Drops out automatically once
                      the pro acts (status flips) or the deadline
                      passes (chip returns null). Gives the pro a
                      visible nudge before the cron records a miss. */}
                  {isPro &&
                    booking.status === 'pending' &&
                    booking.pendingSince && (
                      <div className="mt-2">
                        <SlaDeadlineChip
                          deadline={
                            new Date(
                              new Date(booking.pendingSince).getTime() +
                                30 * 60 * 1000,
                            )
                          }
                        />
                      </div>
                    )}

                  {/* Address */}
                  {booking.address && (
                    <div
                      className="flex items-center gap-1.5 mt-2 text-xs"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}

                  {/* Note */}
                  {booking.note && (
                    <p
                      className="text-xs mt-2 line-clamp-2 italic"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      &ldquo;{booking.note}&rdquo;
                    </p>
                  )}
                </div>

                {/* ── Inline Alert for action-required + waiting states ──
                    Action-required (awaiting-payment, disputed) get a
                    colored row per Baymard #38751 - blocked states need
                    visual weight beyond a rail signal. Waiting states
                    (pending-for-client, in_progress-for-client) get a
                    softer info alert so the card has a voice instead of
                    feeling abandoned when the user has no primary action. */}
                {booking.status === 'awaiting_payment' && !isPro && (
                  <div className="pl-6 pr-5 pb-3">
                    <Alert variant="warning" size="sm" icon={<AlertTriangle />}>
                      {t('booking.awaitingPaymentMessage')}
                    </Alert>
                  </div>
                )}
                {booking.status === 'disputed' && (
                  <div className="pl-6 pr-5 pb-3">
                    <Alert variant="error" size="sm" icon={<AlertTriangle />}>
                      {t('booking.disputedMessage')}
                    </Alert>
                  </div>
                )}
                {booking.status === 'pending' && !isPro && (
                  <div className="pl-6 pr-5 pb-3">
                    <Alert variant="info" size="sm">
                      {t('booking.awaitingProResponse')}
                    </Alert>
                  </div>
                )}
                {booking.status === 'in_progress' && !isPro && (
                  <div className="pl-6 pr-5 pb-3">
                    <Alert variant="accent" size="sm">
                      {t('booking.workInProgress')}
                    </Alert>
                  </div>
                )}

                {/* Escrow visibility - the escrow product is invisible
                    today, so the client doesn't know their payment is
                    held safely until they confirm. Surface that exactly
                    when it matters: after the pro marks the work done
                    but before the client clicks Confirm. */}
                {booking.status === 'awaiting_client_confirmation' &&
                  !isPro &&
                  booking.totalAmount != null &&
                  booking.totalAmount > 0 && (
                    <div className="pl-6 pr-5 pb-3">
                      <Alert variant="success" size="sm" icon={<ShieldCheck />}>
                        {t('booking.escrowHeldMessage', {
                          amount: formatCurrency(booking.totalAmount, booking),
                        })}
                      </Alert>
                    </div>
                  )}

                {/* ── Services ── */}
                {services.length > 0 && (
                  <div
                    className="pl-6 pr-5 pb-1"
                    style={{ borderTop: '1px solid var(--hm-border-subtle)' }}
                  >
                    {services.map((svc, idx) => {
                      const unitLabel = formatUnitLabel(svc.unit);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 text-sm"
                          style={{
                            borderTop:
                              idx > 0
                                ? '1px solid var(--hm-border-subtle)'
                                : undefined,
                          }}
                        >
                          <span style={{ color: 'var(--hm-fg-primary)' }}>
                            {pick({ en: svc.name, ka: svc.nameKa }) || svc.name}
                            {svc.quantity > 1 && (
                              <span
                                className="ml-1 tabular-nums"
                                style={{ color: 'var(--hm-fg-muted)' }}
                              >
                                &times; {svc.quantity}
                              </span>
                            )}
                            {unitLabel && (
                              <span
                                className="ml-1 text-xs"
                                style={{ color: 'var(--hm-fg-muted)' }}
                              >
                                / {unitLabel}
                              </span>
                            )}
                          </span>
                          <span
                            className="tabular-nums font-medium ml-4 shrink-0"
                            style={{ color: 'var(--hm-fg-secondary)' }}
                          >
                            {formatCurrency(svc.subtotal, booking)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Total - receipt-style row. Bumped to text-lg for
                        the amount and the divider uses a slightly thicker
                        treatment so the row reads as a real summary row
                        rather than another line item. */}
                    {booking.totalAmount != null && booking.totalAmount > 0 && (
                      <div
                        className="flex items-baseline justify-between pt-3 pb-2 mt-1"
                        style={{
                          borderTop: '1px solid var(--hm-border)',
                        }}
                      >
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--hm-fg-muted)' }}
                        >
                          {t('booking.total')}
                        </span>
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: 'var(--hm-brand-500)' }}
                        >
                          {formatCurrency(booking.totalAmount, booking)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Before/After Photos ── */}
                {hasPhotos && (
                  <div className="pl-6 pr-5 pb-3 flex gap-5">
                    <PhotoThumbs
                      photos={booking.beforePhotos ?? []}
                      label={t('booking.beforePhotos')}
                    />
                    <PhotoThumbs
                      photos={booking.afterPhotos ?? []}
                      label={t('booking.afterPhotos')}
                    />
                  </div>
                )}

                {/* ── Actions bar ──
                    Secondary actions (cancel / report-issue) go on the LEFT
                    as ghost buttons, primary on the RIGHT - matches the
                    Material/iOS dialog convention so the "commit" action
                    lands at the reading-direction terminus, and puts
                    physical distance between Cancel and the primary CTA
                    (Baymard #19: mobile mis-taps drop with >8px separation). */}
                {(hasSecondary ||
                  booking.status === 'awaiting_payment' ||
                  booking.status === 'awaiting_client_confirmation' ||
                  (booking.status === 'completed' &&
                    !isPro &&
                    !booking.hasReview) ||
                  (booking.status === 'pending' && isPro) ||
                  (booking.status === 'confirmed' &&
                    isPro &&
                    step !== 'start') ||
                  (booking.status === 'in_progress' &&
                    isPro &&
                    step !== 'complete')) && (
                  // Action bar - stacks vertically on phones so the
                  // primary CTA gets full width and the secondary ghost
                  // buttons stay above the iOS 44px comfort target.
                  // sm+ reverts to the desktop "secondary left, primary
                  // right" layout.
                  <div className="pl-6 pr-5 pb-4 pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    {/* Secondary cluster - ghost buttons, left side */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelModalId(bookingId)}
                          disabled={actionLoading === bookingId}
                        >
                          {t('booking.cancelAction')}
                        </Button>
                      )}
                      {canDispute && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDisputeContext({
                              bookingId,
                              role: isPro ? 'pro' : 'client',
                            })
                          }
                          disabled={actionLoading === bookingId}
                        >
                          {t('dispute.reportIssueButton')}
                        </Button>
                      )}
                      {/* Graduate: fold a standalone booking into a project.
                          Client-only, and only if not already attached. */}
                      {!isPro &&
                        !(booking as { projectId?: string }).projectId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddToProjectId(bookingId)}
                          >
                            {t('projects.addToProject') || 'Add to project'}
                          </Button>
                        )}
                    </div>

                    {/* Primary - exactly ONE per card (Hick's Law). */}
                    <div className="flex items-center gap-2 sm:shrink-0">
                      {/* Client: Pay now - premium variant gives the
                          accent-color filled treatment that signals "this
                          is the action worth your money" - the most urgent
                          card state. Label includes the amount so the
                          CTA reads as the answer to "what should I do
                          here?" not as a generic button. */}
                      {booking.status === 'awaiting_payment' && !isPro && (
                        <Link href={`/bookings/${bookingId}/pay`}>
                          <Button
                            variant="premium"
                            size="default"
                            leftIcon={<CreditCard />}
                          >
                            {booking.totalAmount && booking.totalAmount > 0
                              ? `${t('booking.payNow')} · ${formatCurrency(booking.totalAmount, booking)}`
                              : t('booking.payNow')}
                          </Button>
                        </Link>
                      )}

                      {/* Client: Confirm completion - the celebrated
                          one-way-door moment (equivalent to "Place order"
                          in checkout). Bigger button, success colour.
                          Amount-in-label makes the escrow release tangible. */}
                      {booking.status === 'awaiting_client_confirmation' &&
                        !isPro && (
                          <Button
                            size="default"
                            variant="success"
                            leftIcon={<Check />}
                            loading={actionLoading === bookingId}
                            onClick={async () => {
                              setActionLoading(bookingId);
                              try {
                                await api.post(
                                  `/bookings/${bookingId}/confirm-completion`,
                                );
                                toast.success(
                                  t('booking.confirmCompletionSuccess'),
                                );
                                fetchBookings();
                              } catch (err: unknown) {
                                console.error('[bookings] Action failed', err);
                                toast.error(
                                  extractApiErrorMessage(err, t('common.error')),
                                );
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                          >
                            {booking.totalAmount && booking.totalAmount > 0
                              ? `${t('booking.confirmCompletion')} · ${formatCurrency(booking.totalAmount, booking)}`
                              : t('booking.confirmCompletion')}
                          </Button>
                        )}

                      {/* Client: Leave review */}
                      {booking.status === 'completed' &&
                        !isPro &&
                        !booking.hasReview && (
                          <Link href={`/review/booking/${bookingId}`}>
                            <Button
                              variant="default"
                              size="sm"
                              leftIcon={<Star />}
                            >
                              {t('reviews.leaveReview')}
                            </Button>
                          </Link>
                        )}

                      {/* Pro: Accept pending booking - bumped to
                          default size so the most-urgent pro action
                          gets the same visual weight as the client-
                          side Pay-now / Confirm-work CTAs. */}
                      {booking.status === 'pending' && isPro && (
                        <Button
                          size="default"
                          leftIcon={<Check />}
                          loading={actionLoading === bookingId}
                          onClick={() => updateStatus(bookingId, 'confirmed')}
                          disabled={actionLoading === bookingId}
                        >
                          {t('booking.confirmAction')}
                        </Button>
                      )}

                      {/* Pro: Start Work - bumped to default for parity */}
                      {booking.status === 'confirmed' &&
                        isPro &&
                        step !== 'start' && (
                          <Button
                            size="default"
                            leftIcon={<Camera />}
                            onClick={() =>
                              setWorkflowStep((prev) => ({
                                ...prev,
                                [bookingId]: 'start',
                              }))
                            }
                            disabled={actionLoading === bookingId}
                          >
                            {t('booking.startWork')}
                          </Button>
                        )}

                      {/* Pro: Complete Work - bumped to default for parity */}
                      {booking.status === 'in_progress' &&
                        isPro &&
                        step !== 'complete' && (
                          <Button
                            size="default"
                            variant="success"
                            leftIcon={<Check />}
                            onClick={() =>
                              setWorkflowStep((prev) => ({
                                ...prev,
                                [bookingId]: 'complete',
                              }))
                            }
                            disabled={actionLoading === bookingId}
                          >
                            {t('booking.completeWork')}
                          </Button>
                        )}

                      {/* Pro: Awaiting client (passive). No CTA - the
                          pro is done. Reframes the status pill from
                          "awaiting_client_confirmation" (jargon) to a
                          plain "you're done, client to confirm" line so
                          the pro doesn't feel they need to act. */}
                      {booking.status === 'awaiting_client_confirmation' &&
                        isPro && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--hm-fg-muted)] bg-[var(--hm-bg-tertiary)]">
                            <Check className="w-3.5 h-3.5" />
                            {t('booking.awaitingClientConfirm')}
                          </span>
                        )}
                    </div>
                  </div>
                )}

                {/* ── Workflow: Start Work ── */}
                {step === 'start' && isPro && (
                  <div
                    className="pl-6 pr-5 py-4"
                    style={{
                      borderTop: '1px solid var(--hm-border-subtle)',
                      backgroundColor: 'var(--hm-bg-tertiary)',
                    }}
                  >
                    <PhotoUploadSection
                      label={t('booking.uploadBeforePhotos')}
                      photos={photos}
                      uploading={photoUploading === bookingId}
                      onUpload={(file) => addPhoto(bookingId, file)}
                      onRemove={(url) => removePhoto(bookingId, url)}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleStartWork(bookingId)}
                        disabled={actionLoading === bookingId}
                      >
                        {actionLoading === bookingId ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          t('booking.startWork')
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setWorkflowStep((prev) => ({
                            ...prev,
                            [bookingId]: null,
                          }));
                          setWorkflowPhotos((prev) => ({
                            ...prev,
                            [bookingId]: [],
                          }));
                        }}
                        disabled={actionLoading === bookingId}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Workflow: Complete Work ── */}
                {step === 'complete' && isPro && (
                  <div
                    className="pl-6 pr-5 py-4"
                    style={{
                      borderTop: '1px solid var(--hm-border-subtle)',
                      backgroundColor: 'var(--hm-bg-tertiary)',
                    }}
                  >
                    <PhotoUploadSection
                      label={t('booking.uploadAfterPhotos')}
                      photos={photos}
                      uploading={photoUploading === bookingId}
                      onUpload={(file) => addPhoto(bookingId, file)}
                      onRemove={(url) => removePhoto(bookingId, url)}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleCompleteWork(bookingId)}
                        disabled={actionLoading === bookingId || photos.length === 0}
                      >
                        {actionLoading === bookingId ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          t('booking.completeWork')
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setWorkflowStep((prev) => ({
                            ...prev,
                            [bookingId]: null,
                          }));
                          setWorkflowPhotos((prev) => ({
                            ...prev,
                            [bookingId]: [],
                          }));
                        }}
                        disabled={actionLoading === bookingId}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                    {photos.length === 0 && (
                      <p
                        className="text-xs mt-1.5"
                        style={{ color: 'var(--hm-fg-muted)' }}
                      >
                        {t('booking.atLeastOnePhoto')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal - shows policy-driven refund preview before confirming */}
      <CancelBookingModal
        bookingId={cancelModalId}
        onClose={() => {
          setCancelModalId(null);
          setCancelReason('');
        }}
        onCancelled={() => {
          // Refresh the list so the cancelled booking moves into the
          // Cancelled tab with its new paymentStatus reflected.
          fetchBookings();
        }}
      />

      {/* Dispute Modal - freezes escrow, queues for admin review */}
      <RaiseDisputeModal
        bookingId={disputeContext?.bookingId ?? null}
        raisedByRole={disputeContext?.role ?? 'client'}
        onClose={() => setDisputeContext(null)}
        onRaised={() => {
          // Booking moves to DISPUTED; refresh list so the badge updates.
          fetchBookings();
        }}
      />

      <SchedulePanel
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
      />

      {/* Graduate a standalone booking into a project */}
      {addToProjectId && (
        <AddToProjectModal
          isOpen={!!addToProjectId}
          onClose={() => setAddToProjectId(null)}
          bookingId={addToProjectId}
          onAttached={() => fetchBookings()}
        />
      )}
    </div>
  );
}
