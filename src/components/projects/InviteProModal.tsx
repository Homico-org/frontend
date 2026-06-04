'use client';

import { Modal, ModalBody } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchInput } from '@/components/ui/SearchInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/hooks/useCountry';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { Star, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProResult {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  avgRating?: number;
  totalReviews?: number;
}

interface InviteProModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleLabel: string;
  roleKey?: string;
  // Label on each row's action button (e.g. "Invite" or "Select").
  actionLabel?: string;
  // Called with the picked pro. For invite this fires the invite API; for
  // book the parent opens the booking modal. May be async (invite waits).
  onPick: (pro: { id: string; name: string }) => void | Promise<void>;
}

export default function InviteProModal({
  isOpen,
  onClose,
  roleLabel,
  roleKey,
  actionLabel,
  onPick,
}: InviteProModalProps) {
  const country = useCountry();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

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
      await onPick({ id: pro.id, name: pro.name });
      onClose();
    } finally {
      setInvitingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalBody className="pt-7">
        <div className="mb-4 flex items-baseline gap-3">
          <span aria-hidden className="block h-px w-5 bg-[var(--hm-n-900)]" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-n-500)]">
            {roleLabel}
          </span>
        </div>
        <h2 className="font-display text-[14px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[16px]">
          {t('projects.inviteModalTitle', { role: roleLabel })}
        </h2>
        <p className="mb-5 mt-1 text-[11px] text-[var(--hm-n-500)]">
          {t('projects.inviteModalSubtitle')}
        </p>

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
          <p className="py-10 text-center text-[12px] italic text-[var(--hm-n-500)]">
            {t('projects.noProsFound')}
          </p>
        ) : (
          <ul className="max-h-[360px] space-y-1.5 overflow-y-auto">
            {results.map((pro) => (
              <li
                key={pro.id}
                className="flex items-center gap-3 border border-[var(--hm-n-200)] p-2.5 transition-colors hover:border-[var(--hm-n-900)]"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--hm-n-100)]">
                  {pro.avatar ? (
                    <Image
                      src={storage.getOptimizedImageUrl(pro.avatar, 'avatar')}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <UserCircle className="h-full w-full text-[var(--hm-n-400)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-[var(--hm-n-900)]">
                    {pro.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--hm-n-500)]">
                    {pro.title && <span className="truncate">{pro.title}</span>}
                    {!!pro.avgRating && (
                      <span className="inline-flex shrink-0 items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-[var(--hm-warning-500)] text-[var(--hm-warning-500)]" />
                        {pro.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePick(pro)}
                  disabled={invitingId !== null}
                  className="bg-[var(--hm-n-900)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[var(--hm-brand-500)] disabled:opacity-60"
                >
                  {invitingId === pro.id ? (
                    <LoadingSpinner size="xs" color="white" />
                  ) : (
                    actionLabel ?? t('projects.invite')
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
    </Modal>
  );
}
