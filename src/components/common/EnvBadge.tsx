'use client';

import { Badge } from '@/components/ui/badge';

export default function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';

  // Only show badge in non-production environments
  if (env === 'production') {
    return null;
  }

  // Moved from `bottom-4 left-4` to `top-16 left-4` (just below the header)
  // because the previous position overlapped the mobile sticky CTA bar on
  // landing - the badge sat on top of the "Request a quote" button and
  // mangled the first few characters of the label. Top-left on mobile keeps
  // it out of every floating-bottom element's path (sticky CTA, AI chat
  // FAB, mobile bottom nav).
  return (
    <div className="fixed top-16 left-4 z-[60] pointer-events-none">
      <Badge variant="warning" size="sm" dot dotColor="warning" className="shadow-lg pointer-events-auto">
        DEV
      </Badge>
    </div>
  );
}
