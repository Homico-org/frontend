'use client';

import { cn } from '@/lib/utils';
import {
  StatusPill,
  type StatusPillVariant,
  type StatusPillSize,
} from '@/components/ui/StatusPill';

/**
 * Trust badges shown on a pro's card and profile. All auto-derived from data
 * the pro already carries (no extra tracking), so they're always fresh and
 * give a client a reason to hire *before* reviews exist - the trust substitute
 * the marketplace needs at this stage.
 *
 * `featured` is the only admin-granted one (set server-side); the rest are
 * computed here.
 */
export interface ProBadgeInput {
  verificationStatus?: string | null;
  avgRating?: number;
  totalReviews?: number;
  completedJobs?: number;
  isPremium?: boolean;
  /** Admin-curated, hand-picked pro (server-set). */
  isFeatured?: boolean;
}

// Thresholds kept in one place so they're easy to tune as the marketplace grows.
const TOP_RATED_MIN_RATING = 4.8;
const TOP_RATED_MIN_REVIEWS = 5;
const EXPERIENCED_MIN_JOBS = 10;

/**
 * Returns the badges that apply, highest trust-signal first, capped at `max`
 * so cards don't get cluttered. "New" only appears when there's nothing else
 * to show (a pro with no track record yet) - it sets expectation, not a demerit.
 */
export function deriveProBadges(
  pro: ProBadgeInput,
  max = 3,
): StatusPillVariant[] {
  const rating = pro.avgRating ?? 0;
  const reviews = pro.totalReviews ?? 0;
  const jobs = pro.completedJobs ?? 0;

  const out: StatusPillVariant[] = [];
  if (pro.isFeatured) out.push('featured');
  if (pro.verificationStatus === 'verified') out.push('verified');
  if (rating >= TOP_RATED_MIN_RATING && reviews >= TOP_RATED_MIN_REVIEWS)
    out.push('topRated');
  if (jobs >= EXPERIENCED_MIN_JOBS) out.push('experienced');
  if (pro.isPremium) out.push('premium');
  if (reviews === 0 && jobs === 0 && out.length === 0) out.push('new');

  return out.slice(0, max);
}

interface ProBadgesProps {
  pro: ProBadgeInput;
  locale?: 'en' | 'ka' | 'ru';
  size?: StatusPillSize;
  /** Max badges to render (default 3). */
  max?: number;
  /** Skip these variants (e.g. ones a surface already renders elsewhere). */
  exclude?: StatusPillVariant[];
  className?: string;
}

export default function ProBadges({
  pro,
  locale,
  size = 'sm',
  max = 3,
  exclude,
  className,
}: ProBadgesProps) {
  let badges = deriveProBadges(pro, max + (exclude?.length ?? 0));
  if (exclude?.length) badges = badges.filter((b) => !exclude.includes(b));
  badges = badges.slice(0, max);
  if (badges.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {badges.map((variant) => (
        <StatusPill key={variant} variant={variant} size={size} locale={locale} />
      ))}
    </div>
  );
}
