'use client';

import { Modal, ModalBody } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import {
  ArrowUpRight,
  ExternalLink,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Store,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SupplierAvatar from './SupplierAvatar';
import { CatalogProduct, isRealProductImage, supplierLabel } from './types';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  inCartQty?: number;
}

const fmt = (n: number) => `${n.toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  inCartQty = 0,
}: ProductDetailModalProps) {
  const { t, pick } = useLanguage();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  // Reset the picker whenever a different product opens.
  useEffect(() => {
    setQty(1);
    setActiveImg(0);
  }, [product?.id]);

  // A freshly-selected image gets a clean shot at loading.
  useEffect(() => {
    setImgFailed(false);
  }, [product?.id, activeImg]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const urls = product.imageUrls?.length
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];
    return urls.filter(isRealProductImage);
  }, [product]);

  if (!product) return null;

  const name =
    pick({ ka: product.nameKa, en: product.name }, product.name) ||
    product.name;
  const available = product.isAvailable;
  const cover = gallery[activeImg];
  const subtotal = product.priceGel * qty;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      showCloseButton
      ariaLabel={name}
    >
      <ModalBody className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Gallery */}
          <div className="bg-[var(--hm-bg-tertiary)]/40 p-4 sm:p-5">
            <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]">
              {cover && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  referrerPolicy="no-referrer"
                  src={storage.getOptimizedImageUrl(cover, 'feedCard')}
                  alt={name}
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--hm-fg-subtle)]">
                  <Package className="h-12 w-12" strokeWidth={1.4} />
                  <span className="text-[12px] font-medium">
                    {supplierLabel(product.supplierKey)}
                  </span>
                </span>
              )}

              {cover && !imgFailed && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
              )}

              {/* Shop tag - dark glass, always legible */}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(17,16,13,0.55)] py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md">
                <SupplierAvatar
                  supplierKey={product.supplierKey}
                  url={product.externalUrl}
                  size={18}
                />
                {supplierLabel(product.supplierKey)}
              </span>
              {product.inStock === true && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--hm-success-600)] shadow-sm backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
                  {t('projects.catalogInStock')}
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {gallery.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                      i === activeImg
                        ? 'border-[var(--hm-brand-500)] ring-2 ring-[var(--hm-brand-500)]/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      referrerPolicy="no-referrer"
                      src={storage.getOptimizedImageUrl(g, 'feedCard')}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--hm-fg-muted)]">
              {supplierLabel(product.supplierKey)}
            </p>

            <h2 className="mt-2 text-[21px] font-bold leading-snug tracking-[-0.02em] text-[var(--hm-fg-primary)]">
              {name}
            </h2>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-[30px] font-bold tabular-nums tracking-[-0.02em] text-[var(--hm-brand-500)]">
                {fmt(product.priceGel)}
              </span>
              {!available && (
                <span className="text-[12px] font-semibold text-[var(--hm-fg-muted)]">
                  {t('projects.catalogUnavailable')}
                </span>
              )}
            </div>

            {/* Meta - clean borderless rows */}
            <dl className="mt-5 space-y-2.5 border-t border-[var(--hm-border-subtle)] pt-5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex shrink-0 items-center gap-1.5 text-[var(--hm-fg-muted)]">
                  <Store className="h-3.5 w-3.5" />
                  {t('header.shop')}
                </dt>
                <dd className="inline-flex min-w-0 items-center gap-1.5 truncate font-semibold text-[var(--hm-fg-primary)]">
                  <SupplierAvatar
                    supplierKey={product.supplierKey}
                    url={product.externalUrl}
                    size={16}
                  />
                  {supplierLabel(product.supplierKey)}
                </dd>
              </div>
              {product.categoryLabel && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="inline-flex shrink-0 items-center gap-1.5 text-[var(--hm-fg-muted)]">
                    <Tag className="h-3.5 w-3.5" />
                    {t('projects.catalogCategory')}
                  </dt>
                  <dd className="min-w-0 truncate text-right font-semibold text-[var(--hm-fg-primary)]">
                    {product.categoryLabel}
                  </dd>
                </div>
              )}
            </dl>

            {/* Quantity */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-[var(--hm-fg-secondary)]">
                {t('projects.productQty')}
              </span>
              <div className="inline-flex items-center rounded-full border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="-"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-fg-primary)]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center text-[14px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="+"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-fg-primary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Line subtotal - only when it adds information */}
            {qty > 1 && (
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-[var(--hm-fg-muted)]">
                  {qty} × {fmt(product.priceGel)}
                </span>
                <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                  {fmt(subtotal)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto pt-6">
              <button
                type="button"
                disabled={!available}
                onClick={() => {
                  onAddToCart(product, qty);
                  onClose();
                }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('projects.addToCart')}
                {inCartQty > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 text-[11px] tabular-nums">
                    {inCartQty}
                  </span>
                )}
              </button>

              {/* Secondary - quiet text links, no competing buttons */}
              <div className="mt-3 flex items-center justify-center gap-1 text-[12.5px] font-semibold">
                <Link
                  href={`/shop/${product.id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-brand-500)]"
                >
                  {t('projects.catalogFullDetails')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span aria-hidden className="text-[var(--hm-border-strong)]">
                  ·
                </span>
                <a
                  href={product.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-brand-500)]"
                >
                  {t('projects.catalogViewInShop')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
