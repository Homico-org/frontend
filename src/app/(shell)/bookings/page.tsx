'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import { features } from '@/config/features';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { formatDate } from '@/utils/dateUtils';
import type { Booking, BookingStatus } from '@/types/shared';
import SchedulePanel from '@/components/settings/SchedulePanel';
import {
  Calendar,
  Camera,
  Check,
  Clock,
  ImagePlus,
  MapPin,
  Settings2,
  Star,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

function formatCurrency(amount: number): string {
  return amount % 1 === 0 ? `${amount.toFixed(0)} ₾` : `${amount.toFixed(2)} ₾`;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [showSchedule, setShowSchedule] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState<Record<string, WorkflowStep>>({});
  const [workflowPhotos, setWorkflowPhotos] = useState<Record<string, string[]>>({});
  const [photoUploading, setPhotoUploading] = useState<string | null>(null);

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
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/public`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = (await response.json()) as { url?: string };
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
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || (b as { _id?: string })._id === bookingId
            ? { ...b, status: 'completed' as BookingStatus, afterPhotos: photos }
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
      {/* Tab bar + availability */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSchedule(true)}
            leftIcon={<Settings2 className="w-4 h-4" />}
            className="text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 hover:text-[var(--hm-brand-500)]"
          >
            {t('settings.availability')}
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar
            size={48}
            className="mx-auto mb-3 opacity-30"
            style={{ color: 'var(--hm-fg-muted)' }}
          />
          <p className="font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
            {t('booking.noBookings')}
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--hm-fg-secondary)' }}>
            {t('booking.noBookingsDescription')}
          </p>
          <Link href="/professionals">
            <Button variant="default" size="default" className="bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white border-0">
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

            return (
              <div
                key={bookingId}
                className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md shadow-sm border-t-2"
                style={{
                  backgroundColor: 'var(--hm-bg-elevated)',
                  borderTopColor: sc.strip,
                }}
              >
                {/* ── Header ── */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar + name + meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={other?.avatar}
                        name={other?.name || ''}
                        size="md"
                        className="ring-2 ring-black/5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={
                              isPro
                                ? '#'
                                : `/professionals/${other?.id || other?._id}`
                            }
                            className="font-bold text-base leading-tight truncate hover:underline"
                            style={{ color: 'var(--hm-fg-primary)' }}
                          >
                            {other?.name || '—'}
                          </Link>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              color: 'var(--hm-fg-muted)',
                              backgroundColor: 'var(--hm-bg-tertiary)',
                            }}
                          >
                            {isPro ? t('booking.client') : t('booking.pro')}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5 mt-1 text-sm"
                          style={{ color: 'var(--hm-fg-secondary)' }}
                        >
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(
                              booking.date,
                              locale as 'en' | 'ka' | 'ru',
                            )}
                          </span>
                          <span style={{ color: 'var(--hm-border)' }}>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatHour(booking.startHour)}–
                            {formatHour(booking.endHour)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status — dot + colored text, no background */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: sc.strip }}
                      />
                      <span className="text-xs font-semibold" style={{ color: sc.text }}>
                        {t(sc.key)}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  {booking.address && (
                    <div
                      className="flex items-center gap-1.5 mt-2.5 text-sm"
                      style={{ color: 'var(--hm-fg-secondary)' }}
                    >
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}

                  {/* Note */}
                  {booking.note && (
                    <p
                      className="text-sm mt-2 line-clamp-2 italic"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      &ldquo;{booking.note}&rdquo;
                    </p>
                  )}
                </div>

                {/* ── Services ── */}
                {services.length > 0 && (
                  <div className="px-5 pb-1">
                    {services.map((svc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 text-sm"
                        style={{
                          borderTop: idx > 0 ? '1px solid var(--hm-border-subtle)' : undefined,
                        }}
                      >
                        <span style={{ color: 'var(--hm-fg-primary)' }}>
                          {pick({ en: svc.name, ka: svc.nameKa }) || svc.name}
                          {svc.quantity > 1 && (
                            <span
                              className="ml-1"
                              style={{ color: 'var(--hm-fg-muted)' }}
                            >
                              &times; {svc.quantity}
                            </span>
                          )}
                          {svc.unit && (
                            <span
                              className="ml-1 text-xs"
                              style={{ color: 'var(--hm-fg-muted)' }}
                            >
                              / {svc.unit}
                            </span>
                          )}
                        </span>
                        <span
                          className="tabular-nums font-medium ml-4 shrink-0"
                          style={{ color: 'var(--hm-fg-secondary)' }}
                        >
                          {formatCurrency(svc.subtotal)}
                        </span>
                      </div>
                    ))}

                    {/* Total row */}
                    {booking.totalAmount != null && booking.totalAmount > 0 && (
                      <div
                        className="flex items-center justify-between py-2.5 mt-0.5 mb-2"
                        style={{ borderTop: '1px solid var(--hm-border-subtle)' }}
                      >
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--hm-fg-secondary)' }}
                        >
                          {t('booking.total')}
                        </span>
                        <span
                          className="text-base font-bold tabular-nums"
                          style={{ color: 'var(--hm-brand-500)' }}
                        >
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Before/After Photos ── */}
                {hasPhotos && (
                  <div className="px-5 pb-3 flex gap-5">
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

                {/* ── Actions bar ── */}
                <div className="px-5 pb-3 flex items-center justify-end gap-3">
                  {/* Review CTA */}
                  {booking.status === 'completed' &&
                    !isPro &&
                    !booking.hasReview && (
                      <Link
                        href={`/review/booking/${bookingId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                        style={{ color: 'var(--hm-brand-500)' }}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {t('reviews.leaveReview')}
                      </Link>
                    )}

                  {/* Cancel — ghost text only */}
                  {(booking.status === 'pending' ||
                    booking.status === 'confirmed' ||
                    booking.status === 'in_progress') && (
                    <button
                      onClick={() => setCancelModalId(bookingId)}
                      disabled={actionLoading === bookingId}
                      className="text-sm font-medium transition-colors disabled:opacity-40"
                      style={{ color: 'var(--hm-fg-muted)' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = 'rgb(239,68,68)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color =
                          'var(--hm-fg-muted)')
                      }
                    >
                      {t('booking.cancelAction')}
                    </button>
                  )}

                  {/* Pro: Confirm pending */}
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

                  {/* Pro: Start Work */}
                  {booking.status === 'confirmed' &&
                    isPro &&
                    step !== 'start' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setWorkflowStep((prev) => ({
                            ...prev,
                            [bookingId]: 'start',
                          }))
                        }
                        disabled={actionLoading === bookingId}
                      >
                        <Camera size={14} className="mr-1" />
                        {t('booking.startWork')}
                      </Button>
                    )}

                  {/* Pro: Complete Work */}
                  {booking.status === 'in_progress' &&
                    isPro &&
                    step !== 'complete' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() =>
                          setWorkflowStep((prev) => ({
                            ...prev,
                            [bookingId]: 'complete',
                          }))
                        }
                        disabled={actionLoading === bookingId}
                      >
                        <Check size={14} className="mr-1" />
                        {t('booking.completeWork')}
                      </Button>
                    )}
                </div>

                {/* ── Workflow: Start Work ── */}
                {step === 'start' && isPro && (
                  <div
                    className="px-5 py-4"
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
                    className="px-5 py-4"
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
            <p style={{ color: 'var(--hm-fg-secondary)' }}>
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

      <SchedulePanel
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
      />
    </div>
  );
}
