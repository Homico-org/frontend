'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
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
      <ModalHeader
        title={t('projects.addRoleTitle')}
        description={t('projects.addRoleSubtitle')}
      />
      <ModalBody>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder={t('common.search')}
          className="mb-4"
        />
        <div className="grid max-h-[380px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="col-span-full py-6 text-center text-[13px] text-[var(--hm-fg-muted)]">
              {t('projects.noServicesFound')}
            </p>
          ) : (
            filtered.map((c) => {
              const busy = busyKey === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => addRole(c)}
                  disabled={busyKey !== null}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-3 text-left transition-colors hover:border-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/[0.04] disabled:opacity-60"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{
                      backgroundColor: c.color || 'var(--hm-brand-500)',
                    }}
                  >
                    <span className="text-[12px] font-bold">
                      {pick({ en: c.name, ka: c.nameKa }).charAt(0)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                    {pick({ en: c.name, ka: c.nameKa })}
                  </span>
                  {busy && (
                    <LoadingSpinner size="xs" color="var(--hm-brand-500)" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
