'use client';

import { useState } from 'react';
import { supplierLabel, supplierLogoFromUrl } from './types';

interface SupplierAvatarProps {
  supplierKey: string;
  /** A product URL from this shop - yields an always-accurate favicon. */
  url?: string;
  size?: number;
  className?: string;
}

/**
 * Small "company image" for a shop: the supplier's favicon when we know the
 * domain, otherwise a tinted monogram. Both render at a fixed square size so
 * chips and cards line up.
 */
export default function SupplierAvatar({
  supplierKey,
  url,
  size = 18,
  className = '',
}: SupplierAvatarProps) {
  const [failed, setFailed] = useState(false);
  const label = supplierLabel(supplierKey);
  const logo = supplierLogoFromUrl(url, supplierKey);

  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-[5px] bg-white object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[var(--hm-brand-500)]/12 font-bold text-[var(--hm-brand-500)] ${className}`}
    >
      {(label[0] || '?').toUpperCase()}
    </span>
  );
}
