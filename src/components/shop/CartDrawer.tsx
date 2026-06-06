'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import { CartItem } from '@/hooks/useCart';
import { ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supplierLabel } from './types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  onAddToProject: () => void;
  onCheckout: () => void;
  busy?: boolean;
}

const fmt = (n: number) => `${n.toLocaleString()} ₾`;

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  setQty,
  remove,
  clear,
  onAddToProject,
  onCheckout,
  busy,
}: CartDrawerProps) {
  const { t, pick } = useLanguage();

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0" style={{ zIndex: 'var(--hm-z-modal)' }}>
      <div
        className="absolute inset-0 animate-fade-backdrop"
        style={{ backgroundColor: 'rgba(21,17,12,0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('projects.cartTitle')}
        className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col bg-[var(--hm-bg-page)] shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hm-border-subtle)] px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-[16px] font-bold text-[var(--hm-fg-primary)]">
            <ShoppingCart className="h-5 w-5 text-[var(--hm-brand-500)]" />
            {t('projects.cartTitle')}
            {items.length > 0 && (
              <span className="rounded-full bg-[var(--hm-bg-tertiary)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--hm-fg-muted)]">
                {items.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
              <ShoppingCart className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[var(--hm-fg-primary)]">
                {t('projects.cartEmpty')}
              </p>
              <p className="mt-1 text-[13px] text-[var(--hm-fg-muted)]">
                {t('projects.cartEmptyHint')}
              </p>
            </div>
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--hm-brand-500)] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)]"
            >
              {t('header.shop')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {items.map(({ product, qty }) => {
              const name =
                pick({ ka: product.nameKa, en: product.name }, product.name) ||
                product.name;
              return (
                <div
                  key={product.id}
                  className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        referrerPolicy="no-referrer"
                        src={storage.getOptimizedImageUrl(
                          product.imageUrl,
                          'feedCard',
                        )}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-tight text-[var(--hm-fg-primary)]">
                      {name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--hm-fg-muted)]">
                      {supplierLabel(product.supplierKey)} ·{' '}
                      {fmt(product.priceGel)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-[var(--hm-border)]">
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty - 1)}
                          aria-label="-"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)] active:bg-[var(--hm-bg-tertiary)]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty + 1)}
                          aria-label="+"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)] active:bg-[var(--hm-bg-tertiary)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                        {fmt(product.priceGel * qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        aria-label={t('common.delete')}
                        className="rounded-md p-1 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={clear}
              className="mt-2 px-2 text-[12px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
            >
              {t('projects.cartClear')}
            </button>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--hm-border-subtle)] px-5 py-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-[var(--hm-fg-muted)]">
                {t('projects.cartTotal')}
              </span>
              <span className="text-[22px] font-bold tabular-nums text-[var(--hm-brand-500)]">
                {fmt(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('projects.checkoutCta')}
              <span className="tabular-nums">· {fmt(total)}</span>
            </button>
            <button
              type="button"
              onClick={onAddToProject}
              disabled={busy}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--hm-border)] text-[13px] font-semibold text-[var(--hm-fg-primary)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {t('projects.cartAddToProject')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
