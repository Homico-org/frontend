'use client';

import { Modal, ModalBody } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import { ArrowUpRight, Check, ExternalLink, Minus, Package, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SupplierAvatar from './SupplierAvatar';
import { CatalogProduct, isRealProductImage, supplierLabel } from './types';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: CatalogProduct, qty: number) => void;
  inCartQty?: number;
}

const fmt = (n: number) => `${n.toLocaleString()} ₾`;

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  inCartQty = 0,
}: ProductDetailModalProps) {
  const { t, pick } = useLanguage();
  const [qty, setQty] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);

  // Reset the picker whenever a different product opens.
  useEffect(() => {
    setQty(1);
    setImgFailed(false);
  }, [product?.id]);

  if (!product) return null;

  const name =
    pick({ ka: product.nameKa, en: product.name }, product.name) ||
    product.name;
  const available = product.isAvailable;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton>
      <ModalBody>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--hm-bg-tertiary)]">
            {isRealProductImage(product.imageUrl) && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                referrerPolicy="no-referrer"
                src={storage.getOptimizedImageUrl(product.imageUrl!, 'feedCard')}
                alt=""
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--hm-fg-subtle)]">
                <Package className="h-12 w-12" strokeWidth={1.4} />
                <span className="text-[12px] font-medium">
                  {supplierLabel(product.supplierKey)}
                </span>
              </span>
            )}
          </div>

          {/* Detail */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-bg-tertiary)] py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-[var(--hm-fg-secondary)]">
                <SupplierAvatar
                  supplierKey={product.supplierKey}
                  url={product.externalUrl}
                  size={18}
                />
                {supplierLabel(product.supplierKey)}
              </span>
              {product.inStock === true && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--hm-success-600)]">
                  <Check className="h-3 w-3" />
                  {t('projects.catalogInStock')}
                </span>
              )}
              {!available && (
                <span className="text-[11px] font-semibold text-[var(--hm-fg-muted)]">
                  {t('projects.catalogUnavailable')}
                </span>
              )}
            </div>

            <h2 className="mt-2.5 text-[18px] font-bold leading-snug text-[var(--hm-fg-primary)]">
              {name}
            </h2>
            {product.categoryLabel && (
              <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
                {product.categoryLabel}
              </p>
            )}

            <div className="mt-4 text-[26px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
              {fmt(product.priceGel)}
            </div>

            {/* Quantity stepper */}
            <div className="mt-4 flex items-center gap-3">
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
                <span className="w-8 text-center text-[14px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
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

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={!available}
                onClick={() => {
                  onAddToCart(product, qty);
                  onClose();
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('projects.addToCart')}
                {inCartQty > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 text-[11px] tabular-nums">
                    {inCartQty}
                  </span>
                )}
              </button>
              <div className="flex gap-2">
                <Link
                  href={`/shop/${product.id}`}
                  onClick={onClose}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hm-border)] text-[13px] font-semibold text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]"
                >
                  {t('projects.catalogFullDetails')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={product.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hm-border)] text-[13px] font-semibold text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]"
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
