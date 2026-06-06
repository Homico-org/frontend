'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Check, ExternalLink, Minus, Plus } from 'lucide-react';
import ProductCard from './ProductCard';
import { CatalogProduct } from './types';

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

/**
 * Catalog-specific wrapper over the shared <ProductCard>: feeds the shop
 * product's fields in and supplies the add-to-cart / add-to-list actions.
 */
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
  const name =
    pick({ ka: product.nameKa, en: product.name }, product.name) ||
    product.name;
  const disabled = !product.isAvailable || busy;
  const inCart = cartQty > 0;

  // Inner actions must not bubble up to the card's open-detail handler.
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const priceAction = cartMode ? (
    inCart ? (
      // Compact pill stepper - one tap per unit
      <div className="inline-flex h-9 items-center overflow-hidden rounded-full bg-[var(--hm-brand-500)] text-white shadow-sm">
        <button
          type="button"
          onClick={stop(() => onDecrement?.(product))}
          aria-label="-"
          className="flex h-9 w-8 items-center justify-center transition-colors hover:bg-[var(--hm-brand-600)]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[1.1rem] text-center text-[13px] font-bold tabular-nums">
          {cartQty}
        </span>
        <button
          type="button"
          onClick={stop(() => onPick(product))}
          aria-label="+"
          className="flex h-9 w-8 items-center justify-center transition-colors hover:bg-[var(--hm-brand-600)]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : (
      // Quiet by default, fills vermillion on hover - no orange wall
      <button
        type="button"
        onClick={stop(() => onPick(product))}
        disabled={disabled}
        aria-label={t('projects.addToCart')}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--hm-border-strong)] text-[var(--hm-fg-primary)] transition-all hover:scale-105 hover:border-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    )
  ) : (
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
  );

  // The project picker keeps an explicit labelled add button.
  const footer = !cartMode ? (
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
          <Plus className="h-3.5 w-3.5" />
          {t(addLabelKey)}
        </>
      )}
    </button>
  ) : undefined;

  return (
    <ProductCard
      name={name}
      imageUrl={product.imageUrl}
      priceLabel={fmt(product.priceGel)}
      supplierKey={product.supplierKey}
      externalUrl={product.externalUrl}
      inStock={product.inStock}
      available={product.isAvailable}
      onOpenDetail={onOpenDetail ? () => onOpenDetail(product) : undefined}
      priceAction={priceAction}
      footer={footer}
    />
  );
}
