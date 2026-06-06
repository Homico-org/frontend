'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import {
  Check,
  ExternalLink,
  Minus,
  Package,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
import SupplierAvatar from './SupplierAvatar';
import { CatalogProduct, isRealProductImage, supplierLabel } from './types';

interface CatalogProductCardProps {
  product: CatalogProduct;
  onPick: (p: CatalogProduct) => void;
  busy?: boolean;
  /** Used by the project picker (added-to-list state). */
  added?: boolean;
  /** Shop cart quantity for this product (drives the inline stepper). */
  cartQty?: number;
  /** Remove one from the cart (the stepper's minus). */
  onDecrement?: (p: CatalogProduct) => void;
  /** Open the product detail view (whole card becomes clickable). */
  onOpenDetail?: (p: CatalogProduct) => void;
  /** Button label key - defaults to the project "add to list" label. */
  addLabelKey?: string;
  /** Cart mode shows an inline quantity stepper once a product is added. */
  cartMode?: boolean;
}

const fmt = (n: number) => `${n.toLocaleString()} ₾`;

export default function CatalogProductCard({
  product,
  onPick,
  busy,
  added,
  cartQty = 0,
  onDecrement,
  onOpenDetail,
  addLabelKey = 'projects.catalogAdd',
  cartMode = false,
}: CatalogProductCardProps) {
  const { t, pick } = useLanguage();
  const [imgFailed, setImgFailed] = useState(false);

  const name =
    pick({ ka: product.nameKa, en: product.name }, product.name) ||
    product.name;
  const disabled = !product.isAvailable || busy;
  const inCart = cartQty > 0;
  const clickable = !!onOpenDetail;
  const hasImage = isRealProductImage(product.imageUrl) && !imgFailed;

  // Inner actions must not bubble up to the card's open-detail handler.
  const stop =
    (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };

  return (
    <div
      onClick={clickable ? () => onOpenDetail!(product) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail!(product);
              }
            }
          : undefined
      }
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hm-border)] hover:shadow-[0_10px_28px_-12px_rgba(17,16,13,0.22)] ${
        clickable ? 'cursor-pointer' : ''
      } ${!product.isAvailable ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--hm-bg-tertiary)]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            referrerPolicy="no-referrer"
            src={storage.getOptimizedImageUrl(product.imageUrl!, 'feedCard')}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-[var(--hm-bg-tertiary)] to-[var(--hm-bg-page)] text-[var(--hm-fg-subtle)]">
            <Package className="h-9 w-9" strokeWidth={1.4} />
            <span className="text-[10px] font-medium">
              {supplierLabel(product.supplierKey)}
            </span>
          </span>
        )}

        {/* Supplier logo + name float on the image - reads like a real store */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-bg-elevated)]/92 py-0.5 pl-0.5 pr-2 text-[10px] font-semibold text-[var(--hm-fg-secondary)] shadow-sm backdrop-blur">
          <SupplierAvatar
            supplierKey={product.supplierKey}
            url={product.externalUrl}
            size={16}
          />
          {supplierLabel(product.supplierKey)}
        </span>
        {product.inStock === true && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-[var(--hm-success-500)]/92 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
            <Check className="h-2.5 w-2.5" />
            {t('projects.catalogInStock')}
          </span>
        )}
        {!product.isAvailable && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[var(--hm-bg-elevated)]/90 px-2 py-0.5 text-[10px] font-medium text-[var(--hm-fg-muted)]">
            {t('projects.catalogUnavailable')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-tight text-[var(--hm-fg-primary)]">
          {name}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
            {fmt(product.priceGel)}
          </span>
          <a
            href={product.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
          >
            {t('projects.catalogViewInShop')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {cartMode && inCart ? (
          // Modern e-commerce inline stepper: one tap per unit, no ambiguity.
          <div className="flex h-9 w-full items-center justify-between overflow-hidden rounded-lg bg-[var(--hm-brand-500)] text-white">
            <button
              type="button"
              onClick={stop(() => onDecrement?.(product))}
              aria-label="-"
              className="flex h-full w-10 items-center justify-center transition-colors hover:bg-[var(--hm-brand-600)]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-[14px] font-bold tabular-nums">{cartQty}</span>
            <button
              type="button"
              onClick={stop(() => onPick(product))}
              aria-label="+"
              className="flex h-full w-10 items-center justify-center transition-colors hover:bg-[var(--hm-brand-600)]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={stop(() => onPick(product))}
            disabled={disabled}
            className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              added
                ? 'bg-[var(--hm-success-500)]/12 text-[var(--hm-success-600)] hover:bg-[var(--hm-success-500)]/20'
                : 'bg-[var(--hm-brand-500)] text-white hover:bg-[var(--hm-brand-600)]'
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t('projects.shopAdded')}
              </>
            ) : (
              <>
                {cartMode ? (
                  <ShoppingCart className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {t(addLabelKey)}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
