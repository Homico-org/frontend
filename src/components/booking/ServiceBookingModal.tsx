'use client';

import AddressPicker from '@/components/common/AddressPicker';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { StepperBars } from '@/components/ui/Stepper';
import { Textarea } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { currencySymbol } from '@/utils/currency';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscountTier {
  minQuantity: number;
  percent: number;
}

interface ServicePricingItem {
  serviceKey: string;
  subcategoryKey: string;
  unitKey?: string;
  price: number;
  isActive: boolean;
  discountTiers?: DiscountTier[];
  // Range-mode pricing (added 2026-05). When set, treat `price` as the
  // midpoint and surface the explicit `priceMin - priceMax` to the customer.
  priceMin?: number;
  priceMax?: number;
}

export interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: {
    id: string;
    name: string;
    avatar?: string;
    servicePricing: ServicePricingItem[];
  };
  /**
   * Service/subcategory keys to preselect in step 1 when the modal opens -
   * used when booking straight from a service-filtered listing so the cart
   * starts on the service the user was browsing. Matched against each active
   * service's `serviceKey` or `subcategoryKey`.
   */
  initialServiceKeys?: string[];
}

interface SelectedService {
  serviceKey: string;
  subcategoryKey: string;
  unitKey?: string;
  price: number;
  quantity: number;
  discountTiers?: DiscountTier[];
}

interface TimeSlot {
  hour: number;
  available: boolean;
}

type Step = 1 | 2 | 3 | 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Hand-rolled weekday + month tables for Georgian and Russian. Node ships
// with minimal ICU data, so `toLocaleDateString('ka-GE')` silently falls
// back to English in production - same fix that landed on the bookings
// list page. Keep these mirrored if the bookings page version changes.
const KA_WEEKDAY_SHORT = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'] as const;
const KA_MONTH_SHORT = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
] as const;
const RU_WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
const RU_MONTH_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
] as const;

function calendarDayParts(
  d: Date,
  locale: 'en' | 'ka' | 'ru',
): { day: number; month: string; weekday: string } {
  if (locale === 'ka') {
    return {
      day: d.getDate(),
      month: KA_MONTH_SHORT[d.getMonth()],
      weekday: KA_WEEKDAY_SHORT[d.getDay()],
    };
  }
  if (locale === 'ru') {
    return {
      day: d.getDate(),
      month: RU_MONTH_SHORT[d.getMonth()],
      weekday: RU_WEEKDAY_SHORT[d.getDay()],
    };
  }
  return {
    day: d.getDate(),
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
  };
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

function getApplicableDiscount(tiers: DiscountTier[] | undefined, quantity: number): number {
  if (!tiers || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  const tier = sorted.find((t) => quantity >= t.minQuantity);
  return tier?.percent ?? 0;
}

function getLineTotal(item: SelectedService): number {
  const discount = getApplicableDiscount(item.discountTiers, item.quantity);
  const discountedPrice = item.price * (1 - discount / 100);
  return discountedPrice * item.quantity;
}

// ─── Sub-components ───────────────────────────────────────────────────────────


// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceBookingModal({
  isOpen,
  onClose,
  professional,
  initialServiceKeys,
}: ServiceBookingModalProps) {
  const { t, pick, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const { categories } = useCategories();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedService>>({});

  // Step 2 state
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDate = useMemo(
    () => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    [],
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1); // booking length in hours (start -> start + duration)
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Per-day availability summary for the next 14 days. Pre-fetched on
  // step 2 mount so unavailable days can be greyed out and made
  // unclickable instead of forcing the user to discover by clicking.
  // `null` while the bulk request is in flight.
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean> | null>(null);

  // Step 3 state. The address is sent through to the backend's
  // CreateBookingDto.address field - capped at 500 chars there, so
  // we cap here too (slightly under) to avoid a server-side reject
  // on the user's last keystroke. Previously the modal exposed only
  // the freeform note, leaving the pro to dig the address out of
  // the note text - which is exactly what clients complained about.
  const [note, setNote] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 4 (success) snapshot — captured after booking is confirmed
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedHour, setConfirmedHour] = useState<number | null>(null);
  const [confirmedServices, setConfirmedServices] = useState<SelectedService[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // Build service name + unit option lookup from catalog
  const svcNameMap = useMemo(() => {
    const map: Record<string, { name: string; nameKa: string; unit: string; unitKa: string; unitOptions?: { key: string; label: { en: string; ka: string } }[] }> = {};
    for (const cat of categories) {
      for (const sub of cat.subcategories || []) {
        for (const svc of sub.services || []) {
          map[svc.key] = {
            name: svc.name,
            nameKa: svc.nameKa,
            unit: svc.unitName,
            unitKa: svc.unitNameKa,
            unitOptions: svc.unitOptions?.map(uo => ({ key: uo.key, label: { en: uo.label.en, ka: uo.label.ka } })),
          };
        }
      }
    }
    return map;
  }, [categories]);

  const activeServices = useMemo(
    () => professional.servicePricing.filter((s) => s.isActive && s.price > 0),
    [professional.servicePricing],
  );

  // Calendar: generate the next 14 days, split into typographic parts
  // (day number / month / weekday) so the renderer can lay them out as
  // a calendar-block instead of a flat label - matches the design
  // language of the bookings list card.
  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; month: string; weekday: string; isToday: boolean }[] = [];
    const lang = (pick({ ka: 'ka', ru: 'ru', en: 'en' }, 'en') as 'en' | 'ka' | 'ru');
    const todayIso = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const parts = calendarDayParts(d, lang);
      days.push({ date: iso, ...parts, isToday: iso === todayIso });
    }
    return days;
  }, [pick]);

  // Computed totals
  const totalAmount = useMemo(
    () => Object.values(selectedServices).reduce((sum, s) => sum + getLineTotal(s), 0),
    [selectedServices],
  );

  const hasSelection = Object.values(selectedServices).some((s) => s.quantity > 0);

  // Bookable hours for the chosen day. The backend marks slots available
  // purely by schedule + existing bookings, so for *today* it still returns
  // hours that have already passed - drop those so a user can't book a time
  // in the past.
  const availableSlots = useMemo(() => {
    const isToday = selectedDate === today;
    const nowHour = new Date().getHours();
    return timeSlots.filter((s) => s.available && (!isToday || s.hour > nowHour));
  }, [timeSlots, selectedDate, today]);

  // ── Multi-hour duration ──────────────────────────────────────────────────────
  const MAX_DURATION = 4;
  const availableHourSet = useMemo(
    () => new Set(availableSlots.map((s) => s.hour)),
    [availableSlots],
  );

  // Longest run of consecutive free hours - caps the offered durations so we
  // never let the user pick a length that can't fit anywhere in the day.
  const maxRun = useMemo(() => {
    const hours = [...availableHourSet].sort((a, b) => a - b);
    let best = 0;
    let run = 0;
    let prev = Number.NEGATIVE_INFINITY;
    for (const h of hours) {
      run = h === prev + 1 ? run + 1 : 1;
      if (run > best) best = run;
      prev = h;
    }
    return best;
  }, [availableHourSet]);

  // Start hours where every hour in [start, start + duration) is free.
  const selectableStartSlots = useMemo(
    () =>
      availableSlots.filter((s) => {
        for (let i = 0; i < duration; i++) {
          if (!availableHourSet.has(s.hour + i)) return false;
        }
        return true;
      }),
    [availableSlots, availableHourSet, duration],
  );

  // Keep the chosen duration within what the day can actually fit.
  useEffect(() => {
    if (maxRun >= 1 && duration > maxRun) setDuration(maxRun);
  }, [maxRun, duration]);

  // Drop a previously-selected start hour if the new duration no longer fits.
  useEffect(() => {
    if (selectedHour === null) return;
    for (let i = 0; i < duration; i++) {
      if (!availableHourSet.has(selectedHour + i)) {
        setSelectedHour(null);
        return;
      }
    }
  }, [duration, availableHourSet, selectedHour]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true);
      setSelectedHour(null);
      try {
        const { data } = await api.get(
          `/bookings/pro/${professional.id}/availability?date=${date}`,
        );
        setTimeSlots(Array.isArray(data) ? data : []);
      } catch {
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [professional.id],
  );

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  // Pre-fetch per-day availability summary the first time the user
  // reaches step 2. Cached in state for the modal session so clicking
  // back to step 1 and forward again doesn't refetch.
  useEffect(() => {
    if (step !== 2 || availabilityMap !== null) return;
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 13 * 86400000).toISOString().split('T')[0];
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ date: string; hasSlots: boolean }[]>(
          `/bookings/pro/${professional.id}/availability/range?from=${from}&to=${to}`,
        );
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        if (Array.isArray(data)) {
          for (const row of data) map[row.date] = row.hasSlots;
        }
        setAvailabilityMap(map);
      } catch {
        // On error, fall back to "everything looks available" - user
        // will discover unavailable dates the old way (one click each).
        if (!cancelled) setAvailabilityMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, availabilityMap, professional.id]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedServices({});
      setAvailabilityMap(null);
      setSelectedDate('');
      setTimeSlots([]);
      setSelectedHour(null);
      setDuration(1);
      setNote('');
      setAddress('');
      setConfirmedDate('');
      setConfirmedHour(null);
      setConfirmedServices([]);
      setConfirmedTotal(0);
    }
  }, [isOpen]);

  // Preselect services passed from the entry point (e.g. booking straight
  // from a service-filtered listing card) so the cart opens populated on
  // the service the user was browsing.
  useEffect(() => {
    if (!isOpen || !initialServiceKeys || initialServiceKeys.length === 0) return;
    const wanted = new Set(initialServiceKeys);
    setSelectedServices((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Record<string, SelectedService> = {};
      for (const s of activeServices) {
        if (wanted.has(s.serviceKey) || (s.subcategoryKey && wanted.has(s.subcategoryKey))) {
          const key = s.unitKey ? `${s.serviceKey}:${s.unitKey}` : s.serviceKey;
          next[key] = {
            serviceKey: s.serviceKey,
            subcategoryKey: s.subcategoryKey,
            unitKey: s.unitKey,
            price: s.price,
            quantity: 1,
            discountTiers: s.discountTiers,
          };
        }
      }
      return next;
    });
  }, [isOpen, initialServiceKeys, activeServices]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // Composite key for multi-unit: serviceKey:unitKey
  function svcKey(svc: { serviceKey: string; unitKey?: string }) {
    return svc.unitKey ? `${svc.serviceKey}:${svc.unitKey}` : svc.serviceKey;
  }

  function handleQuantityChange(svc: ServicePricingItem, delta: number) {
    const key = svcKey(svc);
    setSelectedServices((prev) => {
      const current = prev[key];
      const newQty = Math.max(0, (current?.quantity ?? 0) + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          serviceKey: svc.serviceKey,
          subcategoryKey: svc.subcategoryKey,
          unitKey: svc.unitKey,
          price: svc.price,
          quantity: newQty,
          discountTiers: svc.discountTiers,
        },
      };
    });
  }

  async function handleConfirm() {
    if (!selectedDate || selectedHour === null) return;
    setSubmitting(true);
    try {
      const services = Object.values(selectedServices)
        .filter((s) => s.quantity > 0)
        .map((s) => {
          const info = svcNameMap[s.serviceKey];
          const unitOpt = s.unitKey && info?.unitOptions
            ? info.unitOptions.find(u => u.key === s.unitKey)
            : null;
          return {
            serviceKey: s.serviceKey,
            unitKey: s.unitKey,
            name: info?.name || s.serviceKey,
            nameKa: info?.nameKa || s.serviceKey,
            quantity: s.quantity,
            unitPrice: s.price,
            unit: unitOpt ? unitOpt.label.en : (info?.unit || 'piece'),
            discount: getApplicableDiscount(s.discountTiers, s.quantity),
          };
        });

      if (services.length === 0) return;

      // Post-payments rework: backend now returns a payment redirect URL
      // alongside the booking. The booking sits in AWAITING_PAYMENT until
      // the user actually pays, with a 15-min timeout that auto-cancels
      // if abandoned. Older backends still return the bare booking
      // document - both shapes are accepted so this client keeps working
      // while prod is mid-deploy. If neither yields an ID, surface an
      // error instead of redirecting to `/bookings/undefined/pay`.
      const { data } = await api.post<unknown>('/bookings', {
        professionalId: professional.id,
        date: selectedDate,
        startHour: selectedHour,
        endHour: selectedHour + duration,
        note: note.trim() || undefined,
        address: address.trim() || undefined,
        services,
        totalAmount,
      });
      const r = data as {
        booking?: { _id?: string; id?: string };
        paymentRedirectUrl?: string;
        _id?: string;
        id?: string;
      };
      const bookingId = r.booking?._id ?? r.booking?.id ?? r._id ?? r.id;
      if (!bookingId) {
        // Loud-fail in the console so a future "I clicked book
        // and nothing happened" report has evidence past the
        // 3-second toast fade. Kept narrow - only the unexpected-
        // shape path logs.
        console.error('[ServiceBookingModal] No bookingId in response', data);
        toast.error(t('common.error'));
        return;
      }

      // Close the modal first so the user doesn't see a confused state
      // briefly during the navigation.
      onClose();
      // Take the user STRAIGHT to the payment provider's URL. Previously
      // we routed to `/bookings/<id>/pay` first, which is just a
      // pre-redirect summary screen with another "Pay now" button - the
      // user reads that as "the modal closed but I'm not on the booking
      // flow", because the screen needs ANOTHER click before payment.
      //
      // `paymentRedirectUrl` from the backend is the canonical "where
      // payment happens" URL (mock-confirm in dev, BoG hosted page in
      // prod). `window.location.href` is a hard navigation - more
      // reliable than router.push when called from a closing modal,
      // since router.push can race with the unmount. The /bookings/.../pay
      // page is still useful for users returning via the back button or
      // retrying a failed payment - we just don't force them through it
      // for the happy path. No-payment fallback stays on the bookings
      // list.
      if (r.paymentRedirectUrl) {
        window.location.href = r.paymentRedirectUrl;
      } else {
        // No redirect URL in the response - still take the user to THIS
        // booking's pay page (it's created AWAITING_PAYMENT) so they can pay,
        // instead of dropping them on the bookings list with no clear step.
        router.push(`/bookings/${bookingId}/pay`);
      }
      return;
    } catch (err: unknown) {
      // NestJS returns validation errors as `message: string[]` -
      // the shared helper joins arrays + falls through to fallback.
      // Console log keeps the evidence after the toast fades.
      console.error('[ServiceBookingModal] Booking submit failed', err);
      toast.error(extractApiErrorMessage(err, t('common.error')));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Avatar ───────────────────────────────────────────────────────────────────

  const avatarUrl = professional.avatar
    ? storage.getOptimizedImageUrl(professional.avatar, { width: 48, height: 48 })
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  const stepTitles: Record<Step, string> = {
    1: t('booking.selectServices'),
    2: t('booking.pickDateTime'),
    3: t('booking.confirmBooking'),
    4: t('booking.bookingSuccess'),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton>
      <ModalHeader
        icon={
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(180deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 100%)',
              boxShadow: '0 4px 12px -2px rgba(239,78,36,0.45)',
            }}
          >
            <ShoppingCart size={22} color="#fff" />
          </span>
        }
        title={stepTitles[step]}
        variant="accent"
      />

      {step !== 4 && (
        <ModalBody className="pb-0">
          <StepperBars total={3} currentIndex={(step > 3 ? 3 : step) - 1} />
        </ModalBody>
      )}

      {/* ── Step 1: Select Services ── */}
      {step === 1 && (
        <>
          <ModalBody>
            <div className="space-y-2">
              {activeServices.length === 0 ? (
                <Alert variant="info" size="sm">
                  {t('common.noResults')}
                </Alert>
              ) : (
                activeServices.map((svc) => {
                  const info = svcNameMap[svc.serviceKey];
                  const name = info
                    ? pick({ en: info.name, ka: info.nameKa || info.name })
                    : svc.serviceKey;
                  // Unit label: use unitKey to find specific option, or fall back to primary
                  const unitOpt = svc.unitKey && info?.unitOptions
                    ? info.unitOptions.find(u => u.key === svc.unitKey)
                    : null;
                  const unit = unitOpt
                    ? pick({ en: unitOpt.label.en, ka: unitOpt.label.ka })
                    : info
                      ? pick({ en: info.unit, ka: info.unitKa || info.unit })
                      : '';
                  const key = svcKey(svc);
                  const qty = selectedServices[key]?.quantity ?? 0;
                  const discount = getApplicableDiscount(svc.discountTiers, qty);
                  const effectivePrice = qty > 0 ? svc.price * (1 - discount / 100) : svc.price;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl p-3.5 transition-all duration-150"
                      style={
                        qty > 0
                          ? {
                              border: '1px solid rgba(239,78,36,0.35)',
                              background:
                                'linear-gradient(180deg, rgba(239,78,36,0.07) 0%, rgba(239,78,36,0.02) 100%)',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                            }
                          : {
                              border: '1px solid var(--hm-border-subtle)',
                              backgroundColor: 'var(--hm-bg-elevated)',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                            }
                      }
                    >
                      {/* Name + price */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--hm-fg-primary)' }}
                        >
                          {name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[13px] tabular-nums"
                            style={{ color: 'var(--hm-fg-secondary)' }}
                          >
                            <span className="font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                              {effectivePrice.toFixed(0)} {currencySymbol()}
                            </span>
                            {unit ? (
                              <span style={{ color: 'var(--hm-fg-muted)' }}> / {unit}</span>
                            ) : null}
                          </span>
                          {discount > 0 && (
                            <span
                              className="text-xs line-through tabular-nums"
                              style={{ color: 'var(--hm-fg-muted)' }}
                            >
                              {svc.price.toFixed(0)} {currencySymbol()}
                            </span>
                          )}
                          {discount > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background:
                                  'linear-gradient(180deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 100%)',
                                color: '#fff',
                                boxShadow: '0 1px 3px rgba(239,78,36,0.4)',
                              }}
                            >
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity controls - sized to 36px squares
                          (was 28px) so finger taps land reliably on
                          phones. Apple HIG comfort minimum is 44px, but
                          the inline service-row layout can't accommodate
                          that without forcing the row to wrap; 36px is
                          the responsible compromise here (clearly larger
                          than the 28px miss-tap zone the audit flagged). */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleQuantityChange(svc, -1)}
                          disabled={qty === 0}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:bg-[var(--hm-bg-tertiary)] active:scale-95"
                          style={{
                            border: '1px solid var(--hm-border)',
                            backgroundColor: 'var(--hm-bg-elevated)',
                            color: 'var(--hm-fg-primary)',
                          }}
                          aria-label={`${t('common.remove')} ${name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className="w-7 text-center text-base font-bold tabular-nums"
                          style={{
                            color: qty > 0 ? 'var(--hm-brand-500)' : 'var(--hm-fg-muted)',
                          }}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(svc, 1)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--hm-brand-500)',
                            color: '#fff',
                          }}
                          aria-label={`${t('common.add')} ${name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ModalBody>

          {/* Running total - sticky receipt row with the same accent
              gradient + inset highlight the date/time pills use. Total
              gets the brand-orange weight; label is small-caps muted to
              read as a summary row, not another line item. */}
          {hasSelection && (
            <div
              className="mx-4 sm:mx-6 mb-4 rounded-xl px-4 py-3 flex items-baseline justify-between"
              style={{
                background:
                  'linear-gradient(180deg, rgba(239,78,36,0.10) 0%, rgba(239,78,36,0.04) 100%)',
                border: '1px solid rgba(239,78,36,0.25)',
              }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: 'var(--hm-fg-muted)' }}
              >
                {t('common.total')}
              </span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: 'var(--hm-brand-500)' }}
              >
                {totalAmount.toFixed(2)} {currencySymbol()}
              </span>
            </div>
          )}

          <ModalFooter>
            {/* Mobile: stack so both buttons hit 44px tap target.
                sm+: row, primary on the right. */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
              <Button
                variant="ghost"
                size="default"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="premium"
                size="default"
                disabled={!hasSelection}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto"
              >
                {t('common.continue')}
              </Button>
            </div>
          </ModalFooter>
        </>
      )}

      {/* ── Step 2: Pick Date & Time ── */}
      {step === 2 && (
        <>
          <ModalBody>
            <div className="space-y-6">
              {/* Calendar: each day is a mini calendar block (weekday +
                  month + big day number) matching the bookings card
                  language. The selected pill uses an accent gradient +
                  shadow for the "this is the choice" weight. */}
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3 flex items-center gap-1.5"
                  style={{ color: 'var(--hm-fg-muted)' }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t('booking.selectDate')}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {calendarDays.map(({ date, day, month, weekday, isToday }) => {
                    const selected = selectedDate === date;
                    // Treat as available while the bulk request is in
                    // flight (availabilityMap === null) so the strip
                    // doesn't flash a wall of disabled chips during the
                    // 100-300ms load. Once data arrives, a date with
                    // `hasSlots: false` is treated as disabled.
                    const isDisabled =
                      availabilityMap !== null &&
                      availabilityMap[date] === false;
                    return (
                      <button
                        key={date}
                        onClick={() => {
                          if (isDisabled) return;
                          setSelectedDate(date);
                        }}
                        disabled={isDisabled}
                        title={isDisabled ? t('booking.dateUnavailable') : undefined}
                        className={`group relative flex flex-col items-center justify-center w-[68px] h-[78px] rounded-2xl shrink-0 transition-all duration-150 ${
                          isDisabled
                            ? 'cursor-not-allowed'
                            : selected
                              ? 'shadow-lg -translate-y-[1px]'
                              : 'hover:-translate-y-[1px] hover:shadow-md'
                        }`}
                        style={
                          isDisabled
                            ? {
                                border: '1px dashed var(--hm-border)',
                                backgroundColor: 'var(--hm-bg-page)',
                                color: 'var(--hm-fg-muted)',
                                opacity: 0.55,
                              }
                            : selected
                              ? {
                                  background:
                                    'linear-gradient(180deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 100%)',
                                  color: '#fff',
                                  boxShadow:
                                    '0 8px 20px -4px rgba(239,78,36,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                                }
                              : {
                                  border: '1px solid var(--hm-border-subtle)',
                                  backgroundColor: 'var(--hm-bg-elevated)',
                                  color: 'var(--hm-fg-primary)',
                                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                                }
                        }
                        aria-pressed={selected}
                        aria-disabled={isDisabled}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.1em] leading-none mb-1"
                          style={{
                            color: isDisabled
                              ? 'var(--hm-fg-muted)'
                              : selected
                                ? 'rgba(255,255,255,0.85)'
                                : 'var(--hm-brand-500)',
                          }}
                        >
                          {month}
                        </span>
                        <span
                          className={`text-[22px] font-bold leading-none tabular-nums ${
                            isDisabled ? 'line-through' : ''
                          }`}
                        >
                          {day}
                        </span>
                        <span
                          className="text-[10px] font-medium leading-none mt-1.5"
                          style={{
                            color: isDisabled
                              ? 'var(--hm-fg-muted)'
                              : selected
                                ? 'rgba(255,255,255,0.8)'
                                : 'var(--hm-fg-muted)',
                          }}
                        >
                          {weekday}
                        </span>
                        {isToday && !selected && !isDisabled && (
                          <span
                            className="absolute bottom-1.5 w-1 h-1 rounded-full"
                            style={{ backgroundColor: 'var(--hm-brand-500)' }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Helper line - only surfaces once data is loaded and
                    at least one day in the range is unavailable. Quietly
                    explains the dashed/struck-through pills so the user
                    doesn't think they're broken. */}
                {availabilityMap !== null &&
                  calendarDays.some(({ date }) => availabilityMap[date] === false) && (
                    <p
                      className="mt-2 text-[11px]"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      {t('booking.dashedDaysUnavailable')}
                    </p>
                  )}
              </div>

              {/* Time Slots: 4-up grid with a soft inner-shadow on the
                  selected slot - more refined than the flat orange
                  swatch. */}
              {selectedDate && (
                <div>
                  <label
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3 flex items-center gap-1.5"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t('booking.selectTime')}
                  </label>

                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" color="var(--hm-brand-500)" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <Alert variant="info" size="sm">
                      {t('booking.noAvailableSlots')}
                    </Alert>
                  ) : (
                    <>
                      {/* Duration picker - how many consecutive hours to book.
                          Options beyond the longest free run are disabled. */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                          style={{ color: 'var(--hm-fg-muted)' }}
                        >
                          {t('booking.duration')}
                        </span>
                        <div className="flex gap-1.5">
                          {Array.from({ length: MAX_DURATION }, (_, i) => i + 1).map((d) => {
                            const disabledOpt = maxRun > 0 && d > maxRun;
                            const active = duration === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={disabledOpt}
                                onClick={() => setDuration(d)}
                                aria-pressed={active}
                                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                                  disabledOpt ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                                style={
                                  active
                                    ? {
                                        background: 'var(--hm-brand-500)',
                                        color: '#fff',
                                        border: '1px solid transparent',
                                      }
                                    : {
                                        backgroundColor: 'var(--hm-bg-elevated)',
                                        border: '1px solid var(--hm-border-subtle)',
                                        color: 'var(--hm-fg-primary)',
                                      }
                                }
                              >
                                {t('booking.hoursShort', { count: d })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {selectableStartSlots
                        .map((slot) => {
                          const selected = selectedHour === slot.hour;
                          return (
                            <button
                              key={slot.hour}
                              onClick={() => setSelectedHour(slot.hour)}
                              className={`py-2.5 rounded-xl text-sm font-semibold tabular-nums transition-all duration-150 ${
                                selected
                                  ? '-translate-y-[1px]'
                                  : 'hover:-translate-y-[1px] hover:border-[var(--hm-brand-400)]'
                              }`}
                              style={
                                selected
                                  ? {
                                      background:
                                        'linear-gradient(180deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 100%)',
                                      color: '#fff',
                                      boxShadow:
                                        '0 6px 14px -3px rgba(239,78,36,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                                      border: '1px solid transparent',
                                    }
                                  : {
                                      backgroundColor: 'var(--hm-bg-elevated)',
                                      border: '1px solid var(--hm-border-subtle)',
                                      color: 'var(--hm-fg-primary)',
                                      boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                                    }
                              }
                              aria-pressed={selected}
                            >
                              {formatHour(slot.hour)}
                            </button>
                          );
                        })}
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            {/* Mobile: stack with primary on top. sm+: keep Back narrow
                on the left + primary flex-1 on the right (existing
                desktop layout). */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
              <Button
                variant="ghost"
                size="default"
                onClick={() => setStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {t('common.back')}
              </Button>
              <Button
                variant="premium"
                size="default"
                className="w-full sm:flex-1"
                disabled={!selectedDate || selectedHour === null}
                onClick={() => setStep(3)}
              >
                {t('common.continue')}
              </Button>
            </div>
          </ModalFooter>
        </>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <>
          <ModalBody>
            <div className="space-y-4">
              {/* Pro summary */}
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  border: '1px solid var(--hm-border)',
                  backgroundColor: 'var(--hm-bg-page)',
                }}
              >
                {avatarUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={avatarUrl}
                      alt={professional.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(239,78,36,0.15)', color: 'var(--hm-brand-500)' }}
                  >
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {professional.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--hm-fg-secondary)' }}>
                    {selectedDate} · {selectedHour !== null ? `${formatHour(selectedHour)} - ${formatHour(selectedHour + duration)}` : ''}
                  </p>
                </div>
              </div>

              {/* Selected services */}
              <div className="space-y-1.5">
                {Object.values(selectedServices).map((s) => {
                  const info = svcNameMap[s.serviceKey];
                  const name = info
                    ? pick({ en: info.name, ka: info.nameKa || info.name })
                    : s.serviceKey;
                  const unitOpt = s.unitKey && info?.unitOptions
                    ? info.unitOptions.find(u => u.key === s.unitKey)
                    : null;
                  const unitLabel = unitOpt
                    ? pick({ en: unitOpt.label.en, ka: unitOpt.label.ka })
                    : '';
                  const discount = getApplicableDiscount(s.discountTiers, s.quantity);
                  const lineTotal = getLineTotal(s);

                  return (
                    <div
                      key={svcKey(s)}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: 'var(--hm-fg-secondary)' }}>
                        {name}
                        {unitLabel && <span className="ml-1 text-[10px] opacity-50">({unitLabel})</span>}
                        <span className="ml-1 opacity-60">× {s.quantity}</span>
                        {discount > 0 && (
                          <span
                            className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--hm-brand-500)', color: '#fff' }}
                          >
                            -{discount}%
                          </span>
                        )}
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: 'var(--hm-fg-primary)' }}
                      >
                        {lineTotal.toFixed(2)} {currencySymbol()}
                      </span>
                    </div>
                  );
                })}

                <div
                  className="flex items-center justify-between pt-2 mt-1 font-semibold"
                  style={{ borderTop: '1px solid var(--hm-border)' }}
                >
                  <span style={{ color: 'var(--hm-fg-primary)' }}>{t('common.total')}</span>
                  <span style={{ color: 'var(--hm-brand-500)' }}>{totalAmount.toFixed(2)} {currencySymbol()}</span>
                </div>
              </div>

              {/* Address. Sent through to the backend in the
                  `address` field of CreateBookingDto. Previously
                  this had no UI surface, forcing clients to bury
                  the street + apt in the note and pros to dig it
                  out manually. Capped at 480 here (under the
                  backend's 500-char limit) so the user never types
                  past validation and gets a confusing reject. */}
              <div>
                <AddressPicker
                  value={address}
                  onChange={(val) => setAddress(val.slice(0, 480))}
                  locale={locale}
                  label={t('booking.address')}
                />
              </div>

              {/* Note */}
              <div>
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'var(--hm-fg-secondary)' }}
                  htmlFor="booking-note"
                >
                  {t('booking.addNote')}
                </label>
                <Textarea
                  id="booking-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('booking.notePlaceholder')}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            {/* Mobile: stack so each button hits 44px. sm+: Back left,
                primary flex-1 right (matches the other step footers). */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
              <Button
                variant="ghost"
                size="default"
                onClick={() => setStep(2)}
                disabled={submitting}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {t('common.back')}
              </Button>
              <Button
                variant="premium"
                size="default"
                className="w-full sm:flex-1"
                onClick={handleConfirm}
                loading={submitting}
                disabled={submitting}
              >
                {t('booking.confirmBooking')}
              </Button>
            </div>
          </ModalFooter>
        </>
      )}
      {/* ── Step 4: Success ── */}
      {step === 4 && (
        <>
          <ModalBody>
            <div className="space-y-4">
              {/* Success icon */}
              <div className="flex flex-col items-center py-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(239,78,36,0.12)' }}
                >
                  <Check className="w-7 h-7" style={{ color: 'var(--hm-brand-500)' }} />
                </div>
                <p className="text-sm font-semibold text-center" style={{ color: 'var(--hm-fg-primary)' }}>
                  {t('booking.bookingSuccess')}
                </p>
              </div>

              {/* Professional + datetime summary */}
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  border: '1px solid var(--hm-border)',
                  backgroundColor: 'var(--hm-bg-page)',
                }}
              >
                {avatarUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={avatarUrl}
                      alt={professional.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(239,78,36,0.15)', color: 'var(--hm-brand-500)' }}
                  >
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                    {professional.name}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--hm-fg-secondary)' }}>
                    <Calendar className="w-3 h-3 shrink-0" />
                    {confirmedDate}
                    {confirmedHour !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatHour(confirmedHour)} - {formatHour(confirmedHour + 1)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Services breakdown */}
              <div className="space-y-1.5">
                {confirmedServices.map((s) => {
                  const info = svcNameMap[s.serviceKey];
                  const name = info
                    ? pick({ en: info.name, ka: info.nameKa || info.name })
                    : s.serviceKey;
                  const unitOpt = s.unitKey && info?.unitOptions
                    ? info.unitOptions.find(u => u.key === s.unitKey)
                    : null;
                  const unitLabel = unitOpt
                    ? pick({ en: unitOpt.label.en, ka: unitOpt.label.ka })
                    : '';
                  const lineTotal = getLineTotal(s);
                  return (
                    <div key={svcKey(s)} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--hm-fg-secondary)' }}>
                        {name}
                        {unitLabel && <span className="ml-1 text-[10px] opacity-50">({unitLabel})</span>}
                        <span className="ml-1 opacity-60">× {s.quantity}</span>
                      </span>
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--hm-fg-primary)' }}>
                        {lineTotal.toFixed(2)} {currencySymbol()}
                      </span>
                    </div>
                  );
                })}
                <div
                  className="flex items-center justify-between pt-2 mt-1 font-semibold"
                  style={{ borderTop: '1px solid var(--hm-border)' }}
                >
                  <span style={{ color: 'var(--hm-fg-primary)' }}>{t('common.total')}</span>
                  <span style={{ color: 'var(--hm-brand-500)' }}>{confirmedTotal.toFixed(2)} {currencySymbol()}</span>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
              <Button
                variant="ghost"
                size="default"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                {t('common.close')}
              </Button>
              <Button
                size="default"
                className="w-full sm:flex-1"
                onClick={() => { onClose(); router.push('/bookings'); }}
              >
                {t('booking.viewBookings')}
              </Button>
            </div>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
