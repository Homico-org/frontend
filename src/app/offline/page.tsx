export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg-app)] dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Check your internet connection and try again.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href=""
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#C4735B] hover:bg-[#A85D4A] transition-colors"
          >
            Retry
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

