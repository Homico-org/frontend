'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
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
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  StickyNote,
} from 'lucide-react';
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
interface Quote {
  items: QuoteItem[];
  subtotalMinor: number;
  feeMinor: number;
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

  const [step, setStep] = useState<1 | 2>(1);
  const [quote, setQuote] = useState<Quote | null>(null);
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
      window.location.href = data.redirectUrl;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton>
      <ModalHeader
        variant="accent"
        icon={<ShoppingBag size={20} color="#fff" />}
        title={
          step === 1
            ? t('projects.checkoutStepDelivery')
            : t('projects.checkoutStepReview')
        }
      />

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

            {/* Price breakdown */}
            {quote && (
              <div className="rounded-xl bg-[var(--hm-bg-tertiary)] p-4 text-[13px]">
                <div className="flex justify-between text-[var(--hm-fg-muted)]">
                  <span>{t('projects.checkoutSubtotal')}</span>
                  <span className="tabular-nums">{fmt(quote.subtotalMinor)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[var(--hm-fg-muted)]">
                  <span>{t('projects.checkoutFee')}</span>
                  <span className="tabular-nums">{fmt(quote.feeMinor)}</span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between border-t border-[var(--hm-border-subtle)] pt-2.5">
                  <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">
                    {t('projects.checkoutTotal')}
                  </span>
                  <span className="text-[22px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                    {fmt(quote.totalMinor)}
                  </span>
                </div>
              </div>
            )}
            <p className="text-center text-[11px] text-[var(--hm-fg-muted)]">
              {t('projects.checkoutFeeNote')}
            </p>
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
              {t('projects.checkoutPay')} · {quote ? fmt(quote.totalMinor) : ''}
            </Button>
          </div>
        )}
      </ModalFooter>
    </Modal>
  );
}
