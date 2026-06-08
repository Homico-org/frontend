'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';
import { useMyProjects } from '@/hooks/useMyProjects';
import { api } from '@/lib/api';
import { ArrowRight, ClipboardList, FolderPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const BANNER_DISMISS_KEY = 'homico:client-activation-banner-dismissed';

interface Props {
  /** `card` = full hero (empty-state). `banner` = slim, dismissible (browse). */
  variant?: 'card' | 'banner';
  /**
   * Show for any client with no projects, regardless of jobs. Use on the
   * Projects empty state, where "no project yet" is the only relevant trigger.
   * Default false = the strict "fresh client" gate (no projects AND no jobs).
   */
  ignoreJobs?: boolean;
}

/**
 * First-run activation nudge for clients. A new client who signs up and takes
 * no first action is the marketplace's biggest leak (the Traction dashboard's
 * client-activation rate). Funnels them into the two real first actions -
 * create a project (the renovation command center) or post a single job for
 * quotes. Returns null once they have activity, so the `card` variant doubles
 * as an empty state; the `banner` variant is a slim, dismissible overlay for
 * the browse page (where clients actually land after signup).
 */
export default function ClientActivationCard({
  variant = 'card',
  ignoreJobs = false,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const cl = useCountryLink();
  const isClient = isAuthenticated && user?.role === 'client';

  const projects = useMyProjects(Boolean(isClient));
  const [jobCount, setJobCount] = useState<number | null>(ignoreJobs ? 0 : null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (variant !== 'banner' || typeof window === 'undefined') return;
    setDismissed(window.localStorage.getItem(BANNER_DISMISS_KEY) === '1');
  }, [variant]);

  useEffect(() => {
    if (!isClient || ignoreJobs) return;
    let alive = true;
    api
      .get('/jobs/my-jobs')
      .then((r) => {
        if (alive) setJobCount(Array.isArray(r.data) ? r.data.length : 0);
      })
      .catch(() => {
        if (alive) setJobCount(0);
      });
    return () => {
      alive = false;
    };
  }, [isClient, ignoreJobs]);

  if (!isClient || dismissed) return null;
  // Wait for both signals; never flash for a client who already has activity.
  if (projects === null || jobCount === null) return null;
  if (projects.length > 0 || jobCount > 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  if (variant === 'banner') {
    return (
      <div
        className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3"
        style={{
          backgroundColor: 'var(--hm-bg-elevated)',
          border: '1px solid var(--hm-border-subtle)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--hm-brand-500) 12%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[var(--hm-fg-primary)]">
            {t('mySpace.activationTitle')}
          </p>
          <p className="truncate text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
            {t('mySpace.activationBannerSub')}
          </p>
        </div>
        <Link href="/projects/new" className="shrink-0">
          <Button
            variant="default"
            size="sm"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            {t('mySpace.activationStartProject')}
          </Button>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('common.close')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-black/5"
          style={{ color: 'var(--hm-fg-muted)' }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{
        backgroundColor: 'var(--hm-bg-elevated)',
        border: '1px solid var(--hm-border-subtle)',
      }}
    >
      {/* warm corner wash - one quiet vermillion moment, no icon cluster */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--hm-brand-500) 12%, transparent) 0%, transparent 70%)',
        }}
      />
      <p
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--hm-brand-500)' }}
      >
        {t('mySpace.activationEyebrow')}
      </p>
      <h2
        className="mt-1.5 text-[20px] sm:text-[24px] font-bold tracking-[-0.02em]"
        style={{ color: 'var(--hm-fg-primary)' }}
      >
        {t('mySpace.activationTitle')}
      </h2>
      <p
        className="mt-1.5 max-w-md text-[13px] leading-relaxed"
        style={{ color: 'var(--hm-fg-secondary)' }}
      >
        {t('mySpace.activationSubtitle')}
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Link href="/projects/new" className="sm:flex-1">
          <Button
            variant="default"
            className="w-full"
            leftIcon={<FolderPlus className="h-4 w-4" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {t('mySpace.activationStartProject')}
          </Button>
        </Link>
        <Link href={cl('/post-job')} className="sm:flex-1">
          <Button
            variant="outline"
            className="w-full"
            leftIcon={<ClipboardList className="h-4 w-4" />}
          >
            {t('mySpace.activationPostJob')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
