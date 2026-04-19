'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Don't swallow Next.js framework signals — let RedirectBoundary / NotFoundBoundary handle them.
  // The digest field is set by the server when the page calls redirect()/notFound().
  if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.digest === 'NEXT_NOT_FOUND') {
    throw error;
  }

  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--hm-error-100)]/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-[var(--hm-error-500)]" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--hm-fg-primary)' }}>
          დაფიქსირდა შეცდომა
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--hm-fg-secondary)' }}>
          სამწუხაროდ, მოხდა შეცდომა. სცადეთ თავიდან.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--hm-brand-500)' }}
          >
            სცადეთ თავიდან
          </button>
          <a
            href="/"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
            style={{ borderColor: 'var(--hm-border-subtle)', color: 'var(--hm-fg-secondary)' }}
          >
            მთავარი
          </a>
        </div>
      </div>
    </div>
  );
}
