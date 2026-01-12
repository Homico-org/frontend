/**
 * Utility functions for rating display and formatting
 */

/**
 * Format a rating number for display
 * @param rating - The rating value (0-5)
 * @param defaultValue - Default value if rating is invalid
 * @returns Formatted rating string (e.g., "4.8")
 */
export function formatRating(
  rating: number | undefined | null,
  defaultValue = '5.0'
): string {
  if (rating === undefined || rating === null || rating <= 0) {
    return defaultValue;
  }
  return rating.toFixed(1);
}

/**
 * Check if a rating should be displayed (has actual reviews)
 * @param rating - The rating value
 * @param reviewCount - Number of reviews
 * @returns Whether to show the rating
 */
export function hasValidRating(
  rating: number | undefined | null,
  reviewCount?: number
): boolean {
  return (rating !== undefined && rating !== null && rating > 0) ||
         (reviewCount !== undefined && reviewCount > 0);
}

/**
 * Get rating label based on value
 * @param rating - The rating value (0-5)
 * @param locale - Language locale
 * @returns Human-readable rating label
 */
export function getRatingLabel(
  rating: number,
  locale: 'en' | 'ka' | 'ru' = 'en'
): string {
  const labels = {
    excellent: { en: 'Excellent', ka: 'შესანიშნავი', ru: 'Отлично' },
    veryGood: { en: 'Very Good', ka: 'ძალიან კარგი', ru: 'Очень хорошо' },
    good: { en: 'Good', ka: 'კარგი', ru: 'Хорошо' },
    fair: { en: 'Fair', ka: 'საშუალო', ru: 'Нормально' },
    poor: { en: 'Poor', ka: 'ცუდი', ru: 'Плохо' },
  };

  if (rating >= 4.5) return labels.excellent[locale];
  if (rating >= 4.0) return labels.veryGood[locale];
  if (rating >= 3.0) return labels.good[locale];
  if (rating >= 2.0) return labels.fair[locale];
  return labels.poor[locale];
}

/**
 * Calculate percentage for rating distribution bars
 * @param count - Number of reviews with this rating
 * @param total - Total number of reviews
 * @returns Percentage (0-100)
 */
export function calculateRatingPercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * Format review count for display
 * @param count - Number of reviews
 * @param locale - Language locale
 * @returns Formatted string (e.g., "128 reviews" or "128 შეფასება")
 */
export function formatReviewCount(
  count: number | undefined,
  locale: 'en' | 'ka' | 'ru' = 'en'
): string {
  if (!count || count === 0) {
    if (locale === 'ka') return 'შეფასებები არ არის';
    if (locale === 'ru') return 'Нет отзывов';
    return 'No reviews';
  }

  if (locale === 'ka') {
    return `${count} შეფასება`;
  }
  if (locale === 'ru') {
    return `${count} отзыв${count !== 1 ? 'ов' : ''}`;
  }

  return `${count} review${count !== 1 ? 's' : ''}`;
}

/**
 * Format review count in compact form
 * @param count - Number of reviews
 * @returns Compact string (e.g., "(128)")
 */
export function formatReviewCountCompact(count: number | undefined): string {
  if (!count || count === 0) return '';
  return `(${count})`;
}

/**
 * Get star fill percentage for partial stars
 * @param rating - The rating value
 * @param starIndex - Index of the star (0-4)
 * @returns Fill percentage (0-100)
 */
export function getStarFillPercentage(rating: number, starIndex: number): number {
  const fullStars = Math.floor(rating);
  const partialFill = (rating - fullStars) * 100;

  if (starIndex < fullStars) return 100;
  if (starIndex === fullStars) return partialFill;
  return 0;
}
