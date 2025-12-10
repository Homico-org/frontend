'use client';

export default function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';

  // Only show badge in non-production environments
  if (env === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        DEV
      </div>
    </div>
  );
}
