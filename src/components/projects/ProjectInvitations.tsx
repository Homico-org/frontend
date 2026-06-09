'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useCountryLink } from '@/hooks/useCountry';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { ArrowRight, Check, MapPin, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface InvitationItem {
  projectId: string;
  projectTitle?: string;
  projectLocation?: string;
  projectCover?: string;
  clientName?: string;
  clientAvatar?: string;
  engagement: {
    id: string;
    roleLabel: string;
    roleKey?: string;
    scope?: string;
    budget?: number;
    phase?: string;
  };
}

/**
 * Pro-side inbox of pending project engagement invites.
 * Renders nothing when there are no invitations so it can be
 * dropped into any "my work" surface without taking layout space.
 */
export function ProjectInvitations() {
  const { t } = useLanguage();
  const toast = useToast();
  const cl = useCountryLink();
  const [items, setItems] = useState<InvitationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyEng, setBusyEng] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/projects/my-invitations');
      setItems((res.data as InvitationItem[]) || []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (
    inv: InvitationItem,
    action: 'accept' | 'decline',
  ) => {
    setBusyEng(inv.engagement.id);
    try {
      await api.post(
        `/projects/${inv.projectId}/engagements/${inv.engagement.id}/${action}`,
      );
      setItems((prev) =>
        prev.filter((i) => i.engagement.id !== inv.engagement.id),
      );
      toast.success(
        action === 'accept'
          ? t('projects.inviteAcceptedTitle')
          : t('projects.inviteDeclinedTitle'),
      );
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('projects.tryAgain');
      toast.error(t('projects.tryAgain'), message);
    } finally {
      setBusyEng(null);
    }
  };

  if (!loaded || items.length === 0) return null;

  return (
    <section className="mb-6 flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span aria-hidden className="block h-px w-5 bg-[var(--hm-n-900)]" />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-n-500)]">
          {t('projects.myInvitationsTitle')}
        </span>
        <span className="font-mono text-[9px] font-semibold tabular-nums text-[var(--hm-brand-500)]">
          {String(items.length).padStart(2, '0')}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((inv) => {
          const busy = busyEng === inv.engagement.id;
          return (
            <li
              key={`${inv.projectId}:${inv.engagement.id}`}
              className="flex flex-col gap-3 rounded-[12px] border border-[var(--hm-n-200)] bg-[var(--hm-bg-elevated)] p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Project cover */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[var(--hm-n-100)]">
                {inv.projectCover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={storage.getOptimizedImageUrl(inv.projectCover, 'feedCard')}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--hm-n-500)]">
                  {inv.engagement.roleLabel}
                </div>
                <Link
                  href={cl(`/projects/${inv.projectId}?tab=team`)}
                  className="block truncate font-display text-[12px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] hover:text-[var(--hm-brand-500)]"
                >
                  {inv.projectTitle || t('projects.openProject')}.
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-[var(--hm-n-500)]">
                  {inv.clientName && <span>{inv.clientName}</span>}
                  {inv.projectLocation && (
                    <>
                      {inv.clientName && (
                        <span aria-hidden className="inline-block h-[2px] w-[2px] rounded-full bg-[var(--hm-n-300)]" />
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {inv.projectLocation}
                      </span>
                    </>
                  )}
                  {inv.engagement.budget != null && inv.engagement.budget > 0 && (
                    <>
                      <span aria-hidden className="inline-block h-[2px] w-[2px] rounded-full bg-[var(--hm-n-300)]" />
                      <span className="font-mono tabular-nums text-[var(--hm-n-900)]">
                        {inv.engagement.budget.toLocaleString('en-US').replace(/,/g, ' ')} ₾
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => respond(inv, 'decline')}
                  className="inline-flex items-center gap-1 border border-[var(--hm-n-200)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--hm-n-700)] transition-colors hover:border-[var(--hm-error-500)] hover:text-[var(--hm-error-500)] disabled:opacity-60"
                >
                  <X className="h-2.5 w-2.5" strokeWidth={3} />
                  {t('projects.declineInvite')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => respond(inv, 'accept')}
                  className="inline-flex items-center gap-1 bg-[var(--hm-n-900)] px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-500)] disabled:opacity-60"
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  {busy ? '...' : t('projects.acceptInvite')}
                </button>
                <Link
                  href={cl(`/projects/${inv.projectId}?tab=team`)}
                  aria-label={t('projects.openProject')}
                  className="hidden h-[26px] w-[26px] items-center justify-center text-[var(--hm-n-400)] transition-colors hover:text-[var(--hm-n-900)] sm:inline-flex"
                >
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
