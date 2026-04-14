'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
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
  price: number;
  isActive: boolean;
  discountTiers?: DiscountTier[];
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
}

interface SelectedService {
  serviceKey: string;
  subcategoryKey: string;
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

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-1">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
            style={
              step < current
                ? { backgroundColor: '#C4735B', color: '#fff' }
                : step === current
                ? { backgroundColor: '#C4735B', color: '#fff', boxShadow: '0 0 0 3px rgba(196,115,91,0.25)' }
                : { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }
            }
          >
            {step < current ? <Check className="w-3.5 h-3.5" /> : step}
          </div>
          {step < total && (
            <div
              className="w-8 h-0.5 rounded-full"
              style={{ backgroundColor: step < current ? '#C4735B' : 'var(--color-border)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceBookingModal({
  isOpen,
  onClose,
  professional,
}: ServiceBookingModalProps) {
  const { t, locale } = useLanguage();
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
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3 state
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 4 (success) snapshot — captured after booking is confirmed
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedHour, setConfirmedHour] = useState<number | null>(null);
  const [confirmedServices, setConfirmedServices] = useState<SelectedService[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // Build service name lookup from catalog
  const svcNameMap = useMemo(() => {
    const map: Record<string, { name: string; nameKa: string; unit: string; unitKa: string }> = {};
    for (const cat of categories) {
      for (const sub of cat.subcategories || []) {
        for (const svc of sub.services || []) {
          map[svc.key] = {
            name: svc.name,
            nameKa: svc.nameKa,
            unit: svc.unitName,
            unitKa: svc.unitNameKa,
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

  // Calendar: generate next 14 days
  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; dayLabel: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(
        locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US',
        { weekday: 'short' },
      );
      const dateLabel = d.toLocaleDateString(
        locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US',
        { day: 'numeric', month: 'short' },
      );
      days.push({ date: iso, label: dateLabel, dayLabel });
    }
    return days;
  }, [locale]);

  // Computed totals
  const totalAmount = useMemo(
    () => Object.values(selectedServices).reduce((sum, s) => sum + getLineTotal(s), 0),
    [selectedServices],
  );

  const hasSelection = Object.values(selectedServices).some((s) => s.quantity > 0);

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

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedServices({});
      setSelectedDate('');
      setTimeSlots([]);
      setSelectedHour(null);
      setNote('');
      setConfirmedDate('');
      setConfirmedHour(null);
      setConfirmedServices([]);
      setConfirmedTotal(0);
    }
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleQuantityChange(svc: ServicePricingItem, delta: number) {
    setSelectedServices((prev) => {
      const current = prev[svc.serviceKey];
      const newQty = Math.max(0, (current?.quantity ?? 0) + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[svc.serviceKey];
        return next;
      }
      return {
        ...prev,
        [svc.serviceKey]: {
          serviceKey: svc.serviceKey,
          subcategoryKey: svc.subcategoryKey,
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
          return {
            serviceKey: s.serviceKey,
            name: info?.name || s.serviceKey,
            nameKa: info?.nameKa || s.serviceKey,
            quantity: s.quantity,
            unitPrice: s.price,
            unit: info?.unit || 'piece',
            discount: getApplicableDiscount(s.discountTiers, s.quantity),
          };
        });

      if (services.length === 0) return;

      await api.post('/bookings', {
        professionalId: professional.id,
        date: selectedDate,
        startHour: selectedHour,
        endHour: selectedHour + 1,
        note: note.trim() || undefined,
        services,
        totalAmount,
      });

      // Capture snapshot before resetting state
      setConfirmedDate(selectedDate);
      setConfirmedHour(selectedHour);
      setConfirmedServices(Object.values(selectedServices));
      setConfirmedTotal(totalAmount);
      toast.success(t('booking.bookingSuccess'));
      setStep(4);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('common.error');
      toast.error(message);
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
        icon={<ShoppingCart size={18} style={{ color: '#C4735B' }} />}
        title={stepTitles[step]}
        variant="accent"
      />

      {step !== 4 && (
        <ModalBody className="pb-0">
          <StepIndicator current={step > 3 ? 3 : step} total={3} />
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
                  const name =
                    info
                      ? locale === 'ka'
                        ? info.nameKa || info.name
                        : info.name
                      : svc.serviceKey;
                  const unit =
                    info
                      ? locale === 'ka'
                        ? info.unitKa || info.unit
                        : info.unit
                      : '';
                  const qty = selectedServices[svc.serviceKey]?.quantity ?? 0;
                  const discount = getApplicableDiscount(svc.discountTiers, qty);
                  const effectivePrice = qty > 0 ? svc.price * (1 - discount / 100) : svc.price;

                  return (
                    <div
                      key={svc.serviceKey}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                      style={{
                        border: `1px solid ${qty > 0 ? 'rgba(196,115,91,0.4)' : 'var(--color-border)'}`,
                        backgroundColor:
                          qty > 0 ? 'rgba(196,115,91,0.05)' : 'var(--color-bg-secondary)',
                      }}
                    >
                      {/* Name + price */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {effectivePrice.toFixed(0)} ₾
                            {unit ? ` / ${unit}` : ''}
                          </span>
                          {discount > 0 && (
                            <span
                              className="text-xs line-through"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              {svc.price.toFixed(0)} ₾
                            </span>
                          )}
                          {discount > 0 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: '#C4735B', color: '#fff' }}
                            >
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleQuantityChange(svc, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                          }}
                          aria-label={`${t('common.remove')} ${name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className="w-6 text-center text-sm font-semibold tabular-nums"
                          style={{ color: qty > 0 ? '#C4735B' : 'var(--color-text-secondary)' }}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(svc, 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: '#C4735B',
                            color: '#fff',
                          }}
                          aria-label={`${t('common.add')} ${name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ModalBody>

          {/* Running total */}
          {hasSelection && (
            <div
              className="mx-4 sm:mx-6 mb-4 rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(196,115,91,0.08)', border: '1px solid rgba(196,115,91,0.2)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('common.total')}
              </span>
              <span className="text-base font-bold" style={{ color: '#C4735B' }}>
                {totalAmount.toFixed(2)} ₾
              </span>
            </div>
          )}

          <ModalFooter>
            <div className="flex gap-2 w-full justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!hasSelection}
                onClick={() => setStep(2)}
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
            <div className="space-y-5">
              {/* Calendar */}
              <div>
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t('booking.selectDate')}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {calendarDays.map(({ date, label, dayLabel }) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-xs shrink-0 transition-all"
                      style={
                        selectedDate === date
                          ? { backgroundColor: '#C4735B', color: '#fff' }
                          : {
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'var(--color-bg-secondary)',
                              color: 'var(--color-text-primary)',
                            }
                      }
                      aria-pressed={selectedDate === date}
                    >
                      <span className="font-medium opacity-80">{dayLabel}</span>
                      <span className="font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t('booking.selectTime')}
                  </label>

                  {loadingSlots ? (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner size="sm" color="#C4735B" />
                    </div>
                  ) : timeSlots.filter((s) => s.available).length === 0 ? (
                    <Alert variant="info" size="sm">
                      {t('booking.noAvailableSlots')}
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {timeSlots
                        .filter((s) => s.available)
                        .map((slot) => (
                          <button
                            key={slot.hour}
                            onClick={() => setSelectedHour(slot.hour)}
                            className="py-2 rounded-lg text-xs font-medium transition-all"
                            style={
                              selectedHour === slot.hour
                                ? { backgroundColor: '#C4735B', color: '#fff' }
                                : {
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                  }
                            }
                            aria-pressed={selectedHour === slot.hour}
                          >
                            {formatHour(slot.hour)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                {t('common.back')}
              </Button>
              <Button
                size="sm"
                className="flex-1"
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
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
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
                    style={{ backgroundColor: 'rgba(196,115,91,0.15)', color: '#C4735B' }}
                  >
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {professional.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedDate} · {selectedHour !== null ? `${formatHour(selectedHour)} – ${formatHour(selectedHour + 1)}` : ''}
                  </p>
                </div>
              </div>

              {/* Selected services */}
              <div className="space-y-1.5">
                {Object.values(selectedServices).map((s) => {
                  const info = svcNameMap[s.serviceKey];
                  const name =
                    info
                      ? locale === 'ka'
                        ? info.nameKa || info.name
                        : info.name
                      : s.serviceKey;
                  const discount = getApplicableDiscount(s.discountTiers, s.quantity);
                  const lineTotal = getLineTotal(s);

                  return (
                    <div
                      key={s.serviceKey}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {name}
                        <span className="ml-1 opacity-60">× {s.quantity}</span>
                        {discount > 0 && (
                          <span
                            className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: '#C4735B', color: '#fff' }}
                          >
                            -{discount}%
                          </span>
                        )}
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {lineTotal.toFixed(2)} ₾
                      </span>
                    </div>
                  );
                })}

                <div
                  className="flex items-center justify-between pt-2 mt-1 font-semibold"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span style={{ color: 'var(--color-text-primary)' }}>{t('common.total')}</span>
                  <span style={{ color: '#C4735B' }}>{totalAmount.toFixed(2)} ₾</span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'var(--color-text-secondary)' }}
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
            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                disabled={submitting}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                {t('common.back')}
              </Button>
              <Button
                size="sm"
                className="flex-1"
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
                  style={{ backgroundColor: 'rgba(196,115,91,0.12)' }}
                >
                  <Check className="w-7 h-7" style={{ color: '#C4735B' }} />
                </div>
                <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
                  {t('booking.bookingSuccess')}
                </p>
              </div>

              {/* Professional + datetime summary */}
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
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
                    style={{ backgroundColor: 'rgba(196,115,91,0.15)', color: '#C4735B' }}
                  >
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {professional.name}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <Calendar className="w-3 h-3 shrink-0" />
                    {confirmedDate}
                    {confirmedHour !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatHour(confirmedHour)} – {formatHour(confirmedHour + 1)}
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
                    ? locale === 'ka'
                      ? info.nameKa || info.name
                      : info.name
                    : s.serviceKey;
                  const lineTotal = getLineTotal(s);
                  return (
                    <div key={s.serviceKey} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {name}
                        <span className="ml-1 opacity-60">× {s.quantity}</span>
                      </span>
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                        {lineTotal.toFixed(2)} ₾
                      </span>
                    </div>
                  );
                })}
                <div
                  className="flex items-center justify-between pt-2 mt-1 font-semibold"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span style={{ color: 'var(--color-text-primary)' }}>{t('common.total')}</span>
                  <span style={{ color: '#C4735B' }}>{confirmedTotal.toFixed(2)} ₾</span>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.close')}
              </Button>
              <Button
                size="sm"
                className="flex-1"
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
