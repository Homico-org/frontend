'use client';

import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StepperBars } from '@/components/ui/Stepper';
import AddressPicker from '@/components/common/AddressPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { CartItem } from '@/hooks/useCart';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Lock,
  MapPin,
  Package,
  Phone,
  StickyNote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { supplierLabel } from './types';

interface QuoteItem {
  supplierKey: string;
  name: string;
  imageUrl?: string;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
}
type DeliveryMode = 'all' | 'bulk' | 'by_items';
const DELIVERY_MODES: DeliveryMode[] = ['all', 'bulk', 'by_items'];

interface Quote {
  items: QuoteItem[];
  subtotalMinor: number;
  feeMinor: number;
  deliveryMode: DeliveryMode;
  deliveryFeeMinor: number;
  /** Fee for each delivery mode for this cart. */
  deliveryOptions: Record<DeliveryMode, number>;
  /** Subtotal that unlocks free delivery (0 = disabled). */
  deliveryFreeOverMinor: number;
  totalMinor: number;
  repriced: boolean;
  unavailable: string[];
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderPlaced: () => void;
}

const fmt = (minor: number) => `${(minor / 100).toLocaleString()} ₾`;

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  onOrderPlaced,
}: CheckoutModalProps) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('all');
  const [paying, setPaying] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addr, setAddr] = useState({
    formattedAddress: '',
    phone: '',
    apartment: '',
    floor: '',
    entrance: '',
    notes: '',
  });

  const orderItemsPayload = useCallback(
    () =>
      items.map(({ product, qty }) => ({
        supplierProductId: product.id,
        qty,
        expectedUnitPriceMinor: Math.round(product.priceGel * 100),
      })),
    [items],
  );

  // Reset + prefill + fetch the authoritative quote whenever opened.
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setDeliveryMode('all');
    setAddr((a) => ({ ...a, phone: a.phone || user?.phone || '' }));
    setQuote(null);
    api
      .post<Quote>('/orders/quote', {
        items: orderItemsPayload(),
        deliveryAddress: { formattedAddress: 'x', phone: 'x' },
      })
      .then((r) => setQuote(r.data))
      .catch(() => setQuote(null));
  }, [isOpen, user?.phone, orderItemsPayload]);

  const addressValid =
    addr.formattedAddress.trim().length > 3 && addr.phone.trim().length > 5;

  const pay = async () => {
    if (!addressValid || !quote) return;
    setPaying(true);
    try {
      const { data } = await api.post<{ redirectUrl: string }>('/orders', {
        items: orderItemsPayload(),
        deliveryMode,
        deliveryAddress: {
          formattedAddress: addr.formattedAddress.trim(),
          phone: addr.phone.trim(),
          apartment: addr.apartment.trim() || undefined,
          floor: addr.floor.trim() || undefined,
          entrance: addr.entrance.trim() || undefined,
          notes: addr.notes.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
      });
      onOrderPlaced();
      // Internal target (mock / return page) -> fast client nav; external
      // gateway (Bank of Georgia) -> full redirect. Keeps `paying` true so the
      // processing view stays up until the route actually changes.
      let internalPath: string | null = null;
      try {
        const u = new URL(data.redirectUrl, window.location.origin);
        if (u.origin === window.location.origin)
          internalPath = u.pathname + u.search;
      } catch {
        if (data.redirectUrl.startsWith('/')) internalPath = data.redirectUrl;
      }
      if (internalPath) router.push(internalPath);
      else window.location.href = data.redirectUrl;
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
      setPaying(false);
    }
  };

  // Items grouped by shop for the review step.
  const byShop = (quote?.items ?? []).reduce<Record<string, QuoteItem[]>>(
    (m, it) => {
      (m[it.supplierKey] ??= []).push(it);
      return m;
    },
    {},
  );

  // Delivery fee for the chosen mode + the live total (recomputed instantly on
  // mode change; the server re-validates the mode when the order is placed).
  const deliveryFee = quote ? quote.deliveryOptions[deliveryMode] : 0;
  const total = quote
    ? quote.subtotalMinor + quote.feeMinor + deliveryFee
    : 0;

  // While the order is being created + payment intent prepared, swap the whole
  // modal for a clear processing state (and block close) so the few-second wait
  // reads as "working", not a frozen dialog. The redirect happens in pay().
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton
      preventClose={paying}
      ariaLabel={paying ? t('projects.checkoutPlacing') : undefined}
    >
      {paying ? (
        <ModalBody className="flex flex-col items-center gap-4 py-16 text-center">
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          <div>
            <p className="text-[16px] font-bold text-[var(--hm-fg-primary)]">
              {t('projects.checkoutPlacing')}
            </p>
            <p className="mt-1 text-[13px] text-[var(--hm-fg-muted)]">
              {t('projects.checkoutPlacingHint')}
            </p>
          </div>
        </ModalBody>
      ) : (
        <>
      {/* Clean editorial header (muted mono eyebrow + step title) - the
          old accent gradient + icon-in-circle read as a generic SaaS
          dialog and clashed with the warm-paper aesthetic. */}
      <div className="px-4 pt-1.5 pb-1 sm:px-6 sm:pt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hm-fg-muted)]">
          {t('header.shop')}
        </p>
        <h3 className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.02em] text-[var(--hm-fg-primary)]">
          {step === 1
            ? t('projects.checkoutStepDelivery')
            : t('projects.checkoutStepReview')}
        </h3>
      </div>

      <ModalBody className="flex flex-col gap-4 pb-0">
        <StepperBars total={2} currentIndex={step - 1} />

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            {/* Map-based location picker */}
            <AddressPicker
              value={addr.formattedAddress}
              onChange={(value, c) => {
                setAddr((a) => ({ ...a, formattedAddress: value }));
                if (c) setCoords(c);
              }}
              locale={locale as 'ka' | 'en' | 'ru'}
              label={t('projects.checkoutAddress')}
              required
            />

            <FormGroup>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {t('projects.checkoutPhone')}
                </span>
              </Label>
              <Input
                value={addr.phone}
                onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                placeholder="+995"
              />
            </FormGroup>

            <div className="grid grid-cols-3 gap-3">
              <FormGroup>
                <Label>{t('projects.checkoutApartment')}</Label>
                <Input
                  value={addr.apartment}
                  onChange={(e) => setAddr({ ...addr, apartment: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>{t('projects.checkoutFloor')}</Label>
                <Input
                  value={addr.floor}
                  onChange={(e) => setAddr({ ...addr, floor: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>{t('projects.checkoutEntrance')}</Label>
                <Input
                  value={addr.entrance}
                  onChange={(e) => setAddr({ ...addr, entrance: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" />
                  {t('projects.checkoutNotes')}
                </span>
              </Label>
              <Input
                value={addr.notes}
                onChange={(e) => setAddr({ ...addr, notes: e.target.value })}
                placeholder={t('projects.checkoutNotesPlaceholder')}
              />
            </FormGroup>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quote?.repriced && (
              <div className="flex items-start gap-2 rounded-xl bg-[var(--hm-warning-50)] p-3 text-[12px] text-[var(--hm-warning-600)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t('projects.checkoutRepriced')}
              </div>
            )}

            {/* Deliver-to recap */}
            <div className="flex items-start gap-2 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hm-brand-500)]" />
              <div className="min-w-0 text-[13px]">
                <p className="font-medium text-[var(--hm-fg-primary)]">
                  {addr.formattedAddress}
                </p>
                <p className="text-[12px] text-[var(--hm-fg-muted)]">
                  {[addr.apartment && `${t('projects.checkoutApartment')} ${addr.apartment}`, addr.phone]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            {/* Items grouped by shop */}
            {!quote ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--hm-border-subtle)]">
                {Object.entries(byShop).map(([shop, list]) => (
                  <div key={shop}>
                    <div className="bg-[var(--hm-bg-tertiary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--hm-fg-muted)]">
                      {supplierLabel(shop)}
                    </div>
                    {list.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                          {it.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              referrerPolicy="no-referrer"
                              src={storage.getOptimizedImageUrl(it.imageUrl, 'feedCard')}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--hm-fg-primary)]">
                          {it.qty} × {it.name}
                        </span>
                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                          {fmt(it.lineTotalMinor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Delivery mode - mandatory; the customer picks how it arrives */}
            {quote && quote.items.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-fg-muted)]">
                    {t('projects.deliveryWhen')}
                  </p>
                  {quote.deliveryFreeOverMinor > 0 &&
                    quote.subtotalMinor < quote.deliveryFreeOverMinor && (
                      <span className="text-[11px] font-semibold text-[var(--hm-success-600)]">
                        {t('projects.deliveryFreeHint', {
                          amount: fmt(
                            quote.deliveryFreeOverMinor - quote.subtotalMinor,
                          ),
                        })}
                      </span>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {DELIVERY_MODES.map((mode) => {
                    const active = deliveryMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDeliveryMode(mode)}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.06]'
                            : 'border-[var(--hm-border-subtle)] hover:border-[var(--hm-border-strong)]'
                        }`}
                      >
                        <span className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              active
                                ? 'border-[var(--hm-brand-500)]'
                                : 'border-[var(--hm-border-strong)]'
                            }`}
                          >
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-[var(--hm-brand-500)]" />
                            )}
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                              {t(`projects.delivery_${mode}`)}
                            </span>
                            <span className="block text-[11px] text-[var(--hm-fg-muted)]">
                              {t(`projects.delivery_${mode}_desc`)}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-0.5">
                          <span
                            className={`text-[13px] font-bold tabular-nums ${
                              quote.deliveryOptions[mode] === 0
                                ? 'text-[var(--hm-success-600)]'
                                : 'text-[var(--hm-fg-primary)]'
                            }`}
                          >
                            {quote.deliveryOptions[mode] === 0
                              ? t('projects.deliveryFree')
                              : fmt(quote.deliveryOptions[mode])}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--hm-fg-muted)]">
                            <Clock className="h-3 w-3" />
                            {t(`projects.delivery_${mode}_eta`)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price breakdown */}
            {quote && (
              <div className="rounded-xl bg-[var(--hm-bg-tertiary)] p-4 text-[13px]">
                <div className="flex justify-between text-[var(--hm-fg-muted)]">
                  <span>{t('projects.checkoutSubtotal')}</span>
                  <span className="tabular-nums">{fmt(quote.subtotalMinor)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[var(--hm-fg-muted)]">
                  <span>{t('projects.checkoutDelivery')}</span>
                  <span
                    className={`tabular-nums ${deliveryFee === 0 ? 'font-semibold text-[var(--hm-success-600)]' : ''}`}
                  >
                    {deliveryFee === 0 ? t('projects.deliveryFree') : fmt(deliveryFee)}
                  </span>
                </div>
                {quote.feeMinor > 0 && (
                  <div className="mt-1.5 flex items-center justify-between text-[var(--hm-fg-muted)]">
                    <span>{t('projects.checkoutFee')}</span>
                    <span className="tabular-nums">{fmt(quote.feeMinor)}</span>
                  </div>
                )}
                <div className="mt-2.5 flex items-baseline justify-between border-t border-[var(--hm-border-subtle)] pt-2.5">
                  <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">
                    {t('projects.checkoutTotal')}
                  </span>
                  <span className="text-[22px] font-bold tabular-nums text-[var(--hm-brand-500)]">
                    {fmt(total)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hm-fg-secondary)]">
                <Lock className="h-3.5 w-3.5 text-[var(--hm-success-600)]" />
                {t('projects.checkoutSecure')}
              </p>
              <p className="text-center text-[11px] text-[var(--hm-fg-muted)]">
                {t('projects.checkoutFeeNote')}
              </p>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 1 ? (
          <Button
            className="w-full"
            size="lg"
            disabled={!addressValid}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => setStep(2)}
          >
            {t('projects.checkoutContinue')}
          </Button>
        ) : (
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              size="lg"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setStep(1)}
            >
              {t('projects.checkoutBack')}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              loading={paying}
              disabled={!quote}
              onClick={pay}
            >
              {t('projects.checkoutPay')} · {quote ? fmt(total) : ''}
            </Button>
          </div>
        )}
      </ModalFooter>
        </>
      )}
    </Modal>
  );
}
