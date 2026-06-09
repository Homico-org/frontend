'use client';

import { useEffect, useState } from 'react';
import { supplierLabel, supplierLogoFile, supplierLogoFromUrl } from './types';

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
  const label = supplierLabel(supplierKey);
  // Official high-res logo file first; favicon second; monogram last.
  const file = supplierLogoFile(supplierKey);
  const favicon = supplierLogoFromUrl(url, supplierKey);
  const sources = [file, favicon].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const logo = sources[idx];

  // Reset to the best source when the shop changes.
  useEffect(() => setIdx(0), [file, favicon]);

  // Every shop logo renders as a uniform white badge with a hairline edge, so
  // they line up and stay legible on both light and dark grounds (logos are
  // designed for light backgrounds).
  const tile = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-white shadow-[inset_0_0_0_1px_rgba(17,16,13,0.10)] ${className}`;

  // A bundled logo file is high-res, so render it full-size. Favicons top out
  // around 32px, so cap those so big tiles (the shop cards) never upscale a
  // small icon into a blur - the extra space becomes clean app-icon padding.
  const isFile = !!file && idx === 0;
  const logoPx = isFile
    ? Math.round(size * 0.82)
    : Math.min(Math.round(size * 0.82), 32);

  if (logo) {
    return (
      <span aria-hidden style={{ width: size, height: size }} className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          style={{ width: logoPx, height: logoPx }}
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`${tile} font-bold text-[var(--hm-brand-500)]`}
    >
      {(label[0] || '?').toUpperCase()}
    </span>
  );
}
