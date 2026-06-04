"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  // Widen src to accept `null` (common from API responses) and
  // `undefined`. The fallback handles both transparently.
  src: string | undefined | null;
  alt: string;
  /**
   * Optional rendered fallback when the image fails to load or the
   * `src` is empty. Defaults to a muted "image unavailable" tile.
   * Pass an Avatar / initials block for user photos so the failure
   * state matches the surrounding design.
   */
  fallback?: React.ReactNode;
  /**
   * Square aspect ratio shortcut. Helps avoid a CLS flash before the
   * image loads (browser knows the box size). Set to false for
   * free-form images (job photos, portfolio).
   */
  square?: boolean;
}

/**
 * Drop-in `<img>` replacement that swaps to a graceful fallback on
 * load error or missing src. The default broken-image icon makes
 * an app look unmaintained; the fallback keeps the layout intact
 * and signals "image unavailable" without screaming.
 *
 * Usage:
 * ```tsx
 * <SmartImage src={pro.avatar} alt={pro.name} square className="w-12 h-12 rounded-full" />
 * ```
 *
 * Why not Next.js `<Image>`?
 *  - Next/Image requires width/height props at compile time, which
 *    we don't always have for user-uploaded photos (sizes vary).
 *  - It also routes through the image-optimization pipeline which
 *    we explicitly disable for user content (avatars / job photos
 *    served from S3 are already optimized at upload time).
 */
export default function SmartImage({
  src,
  alt,
  fallback,
  square = false,
  className,
  loading = "lazy",
  decoding = "async",
  onError,
  ...rest
}: SmartImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state when src changes - otherwise a swapped src
  // would stay in fallback even if the new URL is valid.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const shouldFallback = !src || errored;

  if (shouldFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] ${
          square ? "aspect-square" : ""
        } ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        {fallback ?? <ImageOff className="w-1/3 h-1/3 max-w-6 max-h-6 opacity-60" />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- See doc comment above for why we don't use <Image>.
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={(e) => {
        setErrored(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
