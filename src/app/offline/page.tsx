export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--hm-bg-page)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--hm-border-subtle)] bg-white/70 backdrop-blur p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--hm-fg-primary)]">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-[var(--hm-fg-secondary)]">
          Check your internet connection and try again.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href=""
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-700)] transition-colors"
          >
            Retry
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold border border-[var(--hm-border)] text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)]/60 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

