'use client';

import { Badge } from '@/components/ui/badge';

export default function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';

  // Only show badge in non-production environments
  if (env === 'production') {
    return null;
  }

  // Positioning history:
  // - `bottom-4 left-4`: overlapped the landing sticky CTA "Request a
  //   quote" button on mobile, mangled the label.
  // - `top-16 left-4`: overlapped the mobile page header icon + title
  //   on inner pages (/bookings showed `[DEV][📅] ჩემი ჯავშნები`
  //   visually colliding).
  // - Current: `bottom-20 left-2` on mobile / `top-16 left-4` on lg+.
  //   On mobile sits between the chat FAB (bottom-right) and the
  //   bottom-nav (bottom-anchored), in the empty left-side gutter so
  //   nothing it could collide with lives there. Desktop keeps the
  //   original placement since no header collision exists there.
  return (
    <div className="fixed bottom-20 left-2 lg:bottom-auto lg:top-16 lg:left-4 z-[60] pointer-events-none">
      <Badge variant="warning" size="sm" dot dotColor="warning" className="shadow-lg pointer-events-auto">
        DEV
      </Badge>
    </div>
  );
}
