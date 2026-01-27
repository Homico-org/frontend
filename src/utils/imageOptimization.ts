/**
 * Image optimization utilities for Cloudinary and other image sources
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'crop';
  gravity?: 'auto' | 'face' | 'center';
}

/**
 * Default presets for common use cases
 * Optimized for fast loading with good quality balance
 */
export const IMAGE_PRESETS = {
  // Thumbnails for cards and lists - smaller for faster loading
  thumbnail: { width: 300, height: 225, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Avatar images - small, face-focused
  avatar: { width: 80, height: 80, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const, gravity: 'face' as const },
  avatarLarge: { width: 150, height: 150, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const, gravity: 'face' as const },
  // Hero/banner images - optimized for web
  hero: { width: 1200, height: 630, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Full size optimized
  full: { quality: 'auto' as const, format: 'auto' as const },
  // Job card images - optimized for grid display (matches Cloudinary eager transform)
  jobCard: { width: 400, height: 250, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Job card small - for mobile or list view
  jobCardSmall: { width: 300, height: 188, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Feed card images
  feedCard: { width: 400, height: 300, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Portfolio images
  portfolio: { width: 600, height: 450, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
  // Portfolio thumbnail - for grid
  portfolioThumb: { width: 300, height: 225, quality: 'auto' as const, format: 'auto' as const, crop: 'fill' as const },
} as const;

/**
 * Transforms a Cloudinary URL to include optimization parameters
 *
 * Cloudinary URL format:
 * https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
 */
export function optimizeCloudinaryUrl(url: string, options: ImageTransformOptions = {}): string {
  if (!url) return '';

  // Handle data URLs - return as-is
  if (url.startsWith('data:')) return url;

  // Check if it's a Cloudinary URL
  const cloudinaryPattern = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.*)/;
  const match = url.match(cloudinaryPattern);

  if (!match) {
    // Not a Cloudinary URL - return as-is (backend URLs, external URLs, etc.)
    return url;
  }

  const [, cloudName, rest] = match;

  // Build transformation string
  const transforms: string[] = [];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.format) transforms.push(`f_${options.format}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);

  // If no transforms, return original
  if (transforms.length === 0) {
    return url;
  }

  const transformString = transforms.join(',');

  // Check if the URL already has transformations (look for patterns like w_, h_, c_, etc.)
  const hasExistingTransforms = /^v\d+\/|^[a-z]_/.test(rest);

  if (hasExistingTransforms) {
    // Insert new transforms before existing ones
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${rest}`;
  }

  // Add transforms before the public_id
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${rest}`;
}

/**
 * Get optimized image URL with a preset
 */
export function getOptimizedImageUrl(url: string, preset: keyof typeof IMAGE_PRESETS): string {
  return optimizeCloudinaryUrl(url, IMAGE_PRESETS[preset]);
}

/**
 * Get srcset for responsive images
 */
export function getImageSrcSet(url: string, widths: number[] = [320, 640, 960, 1280]): string {
  if (!url || !url.includes('cloudinary.com')) {
    return '';
  }

  return widths
    .map(w => `${optimizeCloudinaryUrl(url, { width: w, quality: 'auto', format: 'auto' })} ${w}w`)
    .join(', ');
}
