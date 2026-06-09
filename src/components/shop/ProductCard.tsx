'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import { Package } from 'lucide-react';
import { ReactNode, useState } from 'react';
import SupplierAvatar from './SupplierAvatar';
import { isRealProductImage, supplierLabel } from './types';

export interface ProductCardProps {
  name: string;
  imageUrl?: string;
  /** Already-formatted price (e.g. "1 700 ₾"). */
  priceLabel?: ReactNode;
  /** Shop key/url drive the floating logo tag; vendorLabel overrides the text. */
  supplierKey?: string;
  externalUrl?: string;
  vendorLabel?: string;
  inStock?: boolean;
  available?: boolean;
  /** Small line under the name (e.g. "2 × 50 ₾ · Kitchen"). */
  subline?: ReactNode;
  /** Top-right slot - defaults to an in-stock pill when `inStock` is true. */
  topRight?: ReactNode;
  /** Inline action(s) shown to the right of the price. */
  priceAction?: ReactNode;
  /** Full-width action area below the price row. */
  footer?: ReactNode;
  /** Whole-card click (also makes it keyboard-focusable). */
  onOpenDetail?: () => void;
  className?: string;
}

/**
 * The one reusable product card - an image-led tile with a floating shop logo
 * tag, optional in-stock pill, name, price and a pluggable action area. Used by
 * the shop grid/related (add-to-cart) and the project Shopping tab (status +
 * edit), so a product looks the same everywhere.
 */
export default function ProductCard({
  name,
  imageUrl,
  priceLabel,
  supplierKey,
  externalUrl,
  vendorLabel,
  inStock,
  available = true,
  subline,
  topRight,
  priceAction,
  footer,
  onOpenDetail,
  className = '',
}: ProductCardProps) {
  const { t } = useLanguage();
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = isRealProductImage(imageUrl) && !imgFailed;
  const clickable = !!onOpenDetail;
  const tagLabel =
    vendorLabel ?? (supplierKey ? supplierLabel(supplierKey) : '');
  const avatarKey = supplierKey ?? vendorLabel;

  return (
    <div
      onClick={clickable ? onOpenDetail : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail?.();
              }
            }
          : undefined
      }
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hm-border)] hover:shadow-[0_10px_28px_-12px_rgba(17,16,13,0.22)] ${
        clickable ? 'cursor-pointer' : ''
      } ${!available ? 'opacity-60' : ''} ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--hm-bg-tertiary)]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            referrerPolicy="no-referrer"
            src={storage.getOptimizedImageUrl(imageUrl!, 'feedCard')}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-[var(--hm-bg-tertiary)] to-[var(--hm-bg-page)] text-[var(--hm-fg-subtle)]">
            <Package className="h-9 w-9" strokeWidth={1.4} />
            {tagLabel && (
              <span className="text-[10px] font-medium">{tagLabel}</span>
            )}
          </span>
        )}

        {hasImage && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 via-black/5 to-transparent" />
        )}

        {/* Shop tag - dark glass, always legible */}
        {tagLabel && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(17,16,13,0.55)] py-0.5 pl-0.5 pr-2 text-[10px] font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md">
            {avatarKey && (
              <SupplierAvatar
                supplierKey={avatarKey}
                url={externalUrl}
                size={16}
              />
            )}
            {tagLabel}
          </span>
        )}

        {topRight ? (
          <span className="absolute right-2 top-2">{topRight}</span>
        ) : (
          inStock === true && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--hm-success-600)] shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
              {t('projects.catalogInStock')}
            </span>
          )
        )}
        {!available && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[rgba(17,16,13,0.55)] px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            {t('projects.catalogUnavailable')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-[2.5em] text-[13px] font-semibold leading-snug text-[var(--hm-fg-primary)]">
            {name}
          </p>
          {subline && (
            <p className="mt-1 truncate text-[11px] text-[var(--hm-fg-muted)]">
              {subline}
            </p>
          )}
        </div>

        {(priceLabel != null || priceAction) && (
          <div className="mt-auto flex items-center justify-between gap-2">
            {priceLabel != null ? (
              <span className="text-[17px] font-bold tabular-nums tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                {priceLabel}
              </span>
            ) : (
              <span />
            )}
            {priceAction}
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
