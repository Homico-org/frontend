'use client';

import { Modal, ModalBody } from '@/components/ui/Modal';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchInput } from '@/components/ui/SearchInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/hooks/useCountry';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { BadgeCheck, Briefcase, MapPin, Star, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProResult {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  avgRating?: number;
  totalReviews?: number;
  yearsExperience?: number;
  basePrice?: number;
  currency?: string;
  verificationStatus?: string;
  city?: string;
}

export interface InviteSchedule {
  scheduledStart?: string;
  period?: string;
}

interface InviteProModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleLabel: string;
  roleKey?: string;
  // Label on each row's action button (e.g. "Invite" or "Select").
  actionLabel?: string;
  // Show the start-date / period fields (invite flow, not booking).
  showSchedule?: boolean;
  // Called with the picked pro + the chosen schedule. For invite this fires
  // the invite API; for book the parent opens the booking modal.
  onPick: (
    pro: { id: string; name: string },
    schedule?: InviteSchedule,
  ) => void | Promise<void>;
}

export default function InviteProModal({
  isOpen,
  onClose,
  roleLabel,
  roleKey,
  actionLabel,
  showSchedule = false,
  onPick,
}: InviteProModalProps) {
  const country = useCountry();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [period, setPeriod] = useState('');

  // Debounced search. Seeds with the role category on open so the client
  // sees relevant pros before typing.
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '10');
      params.append('country', country);
      if (query) params.append('search', query);
      else if (roleKey) params.append('category', roleKey);
      api
        .get(`/users/pros?${params.toString()}`, { signal: controller.signal })
        .then((res) => setResults((res.data?.data as ProResult[]) || []))
        .catch((err: { name?: string }) => {
          if (err?.name === 'CanceledError') return;
          setResults([]);
        })
        .finally(() => setIsLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query, roleKey, country]);

  const handlePick = async (pro: ProResult) => {
    setInvitingId(pro.id);
    try {
      await onPick(
        { id: pro.id, name: pro.name },
        showSchedule
          ? { scheduledStart: startDate || undefined, period: period || undefined }
          : undefined,
      );
      onClose();
    } finally {
      setInvitingId(null);
    }
  };

  if (!isOpen) return null;

  const money = (p: ProResult) => {
    if (p.basePrice == null) return null;
    const n = Math.round(p.basePrice).toLocaleString('en-US').replace(/,/g, ' ');
    return t('projects.proPriceFrom', { price: n });
  };
  const isVerified = (p: ProResult) =>
    p.verificationStatus === 'verified' || p.verificationStatus === 'approved';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton disableHistory>
      <ModalBody className="pt-7">
        <div className="mb-3 flex items-baseline gap-3">
          <span aria-hidden className="block h-px w-5 bg-[var(--hm-brand-500)]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
            {roleLabel}
          </span>
        </div>
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
          {t('projects.inviteModalTitle', { role: roleLabel })}
        </h2>
        <p className="mb-5 mt-1 text-[13px] text-[var(--hm-fg-muted)]">
          {t('projects.inviteModalSubtitle')}
        </p>

        {/* Schedule - when the work should start */}
        {showSchedule && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-3 sm:grid-cols-2">
            <FormGroup>
              <Label>{t('projects.inviteStartDate')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>{t('projects.invitePeriod')}</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder={t('projects.invitePeriodHint')}
              />
            </FormGroup>
          </div>
        )}

        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t('projects.searchPros')}
          inputSize="lg"
          className="mb-3"
        />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" color="var(--hm-brand-500)" />
          </div>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-[var(--hm-fg-muted)]">
            {t('projects.noProsFound')}
          </p>
        ) : (
          <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
            {results.map((pro) => {
              const price = money(pro);
              return (
                <li
                  key={pro.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-3 transition-colors hover:border-[var(--hm-brand-500)]/40"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                    {pro.avatar ? (
                      <Image
                        src={storage.getOptimizedImageUrl(pro.avatar, 'avatar')}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <UserCircle className="h-full w-full text-[var(--hm-fg-muted)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                        {pro.name}
                      </span>
                      {isVerified(pro) && (
                        <BadgeCheck
                          className="h-4 w-4 shrink-0 text-[var(--hm-brand-500)]"
                          aria-label={t('projects.proVerified')}
                        />
                      )}
                    </div>
                    {pro.title && (
                      <div className="truncate text-[12px] text-[var(--hm-fg-muted)]">
                        {pro.title}
                      </div>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--hm-fg-secondary)]">
                      {!!pro.avgRating && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[var(--hm-warning-500)] text-[var(--hm-warning-500)]" />
                          <span className="font-semibold text-[var(--hm-fg-primary)]">
                            {pro.avgRating.toFixed(1)}
                          </span>
                          {!!pro.totalReviews && (
                            <span className="text-[var(--hm-fg-muted)]">
                              ({pro.totalReviews})
                            </span>
                          )}
                        </span>
                      )}
                      {price && (
                        <span className="font-medium text-[var(--hm-fg-primary)]">
                          {price}
                        </span>
                      )}
                      {!!pro.yearsExperience && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-[var(--hm-fg-muted)]" />
                          {t('projects.proYearsShort', {
                            count: pro.yearsExperience,
                          })}
                        </span>
                      )}
                      {pro.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[var(--hm-fg-muted)]" />
                          {pro.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePick(pro)}
                    disabled={invitingId !== null}
                    className="shrink-0 rounded-full bg-[var(--hm-brand-500)] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:opacity-60"
                  >
                    {invitingId === pro.id ? (
                      <LoadingSpinner size="xs" color="white" />
                    ) : (
                      actionLabel ?? t('projects.invite')
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ModalBody>
    </Modal>
  );
}
