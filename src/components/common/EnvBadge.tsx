'use client';

import { Badge } from '@/components/ui/badge';

export default function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';

  // Only show badge in non-production environments
  if (env === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge variant="warning" size="sm" dot dotColor="warning" className="shadow-lg">
        DEV
      </Badge>
    </div>
  );
}
