'use client';

import { Modal, ModalBody } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchInput } from '@/components/ui/SearchInput';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingKeys: string[];
  /** When set, the new engagement is attached to this user-defined step. */
  stepId?: string;
  onAdded: () => Promise<void> | void;
}

export default function AddRoleModal({
  isOpen,
  onClose,
  projectId,
  existingKeys,
  stepId,
  onAdded,
}: AddRoleModalProps) {
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const filtered = categories.filter(
    (c) =>
      !existingKeys.includes(c.key) &&
      (!query ||
        pick({ en: c.name, ka: c.nameKa })
          .toLowerCase()
          .includes(query.toLowerCase())),
  );

  const addRole = async (c: (typeof categories)[number]) => {
    setBusyKey(c.key);
    try {
      await api.post(`/projects/${projectId}/engagements`, {
        roleKey: c.key,
        roleLabel: pick({ en: c.name, ka: c.nameKa }),
        stepId: stepId || undefined,
      });
      await onAdded();
      onClose();
      toast.success(t('projects.roleAdded'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalBody className="pt-7">
        <div className="mb-4 flex items-baseline gap-3">
          <span aria-hidden className="block h-px w-5 bg-[var(--hm-n-900)]" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-n-500)]">
            {t('projects.teamHeaderEyebrow')}
          </span>
        </div>
        <h2 className="mb-5 font-display text-[14px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[16px]">
          {t('projects.addRoleTitle')}
        </h2>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t('common.search')}
          className="mb-4"
        />
        <div className="grid max-h-[360px] grid-cols-2 gap-1.5 overflow-y-auto">
          {filtered.map((c) => {
            const busy = busyKey === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => addRole(c)}
                disabled={busyKey !== null}
                className="flex items-center gap-2 border border-[var(--hm-n-200)] p-2.5 text-left transition-colors hover:border-[var(--hm-n-900)] disabled:opacity-60"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color || 'var(--hm-brand-500)' }}
                />
                <span className="flex-1 truncate text-[12px] text-[var(--hm-n-900)]">
                  {pick({ en: c.name, ka: c.nameKa })}
                </span>
                {busy && (
                  <LoadingSpinner size="xs" color="var(--hm-brand-500)" />
                )}
              </button>
            );
          })}
        </div>
      </ModalBody>
    </Modal>
  );
}
