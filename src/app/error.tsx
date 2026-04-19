'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--hm-error-100)]/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[var(--hm-error-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
