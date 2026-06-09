'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import CatalogSearch from '@/components/shop/CatalogSearch';
import { CatalogPrefill, CatalogProduct, supplierLabel } from '@/components/shop/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

interface CatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * - 'prefill': picking returns the product to the parent (closes the modal)
   *   so it can seed the add-product form.
   * - 'direct': POSTs immediately and stays open for multi-add.
   */
  mode: 'prefill' | 'direct';
  /** Required for 'direct' mode. */
  projectId?: string;
  roomId?: string;
  stepId?: string;
  /** prefill mode: hand the chosen product up to the form. */
  onPrefill?: (prefill: CatalogPrefill) => void;
  /** direct mode: refresh the project after a successful add. */
  onSaved?: () => Promise<void> | void;
}

function toPrefill(p: CatalogProduct): CatalogPrefill {
  return {
    name: p.name,
    unitPrice: p.priceGel,
    vendor: supplierLabel(p.supplierKey),
    url: p.externalUrl,
    imageUrl: p.imageUrl,
    supplierProductId: p.id,
    supplierKey: p.supplierKey,
  };
}

export default function CatalogPickerModal({
  isOpen,
  onClose,
  mode,
  projectId,
  roomId,
  stepId,
  onPrefill,
  onSaved,
}: CatalogPickerModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const handlePick = async (p: CatalogProduct) => {
    if (mode === 'prefill') {
      onPrefill?.(toPrefill(p));
      onClose();
      return;
    }

    // direct mode: reuse the existing add-product endpoint.
    if (!projectId) return;
    setBusyId(p.id);
    try {
      const body: Record<string, unknown> = {
        name: p.name,
        qty: 1,
        unitPrice: p.priceGel,
        vendor: supplierLabel(p.supplierKey),
        url: p.externalUrl,
        imageUrl: p.imageUrl || undefined,
        // Catalog link so this row is orderable via checkout.
        supplierProductId: p.id,
        supplierKey: p.supplierKey,
        roomId: roomId || '',
      };
      // Group by shop, not the scraped leaf category - those are too granular
      // (every product would become its own one-item group).
      body.category = supplierLabel(p.supplierKey);
      if (stepId) body.stepId = stepId;
      await api.post(`/projects/${projectId}/products`, body);
      setAddedIds((prev) => new Set(prev).add(p.id));
      await onSaved?.();
      toast.success(t('projects.shopAdded'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton>
      <ModalHeader title={t('projects.catalogTitle')} />
      <ModalBody>
        <CatalogSearch
          onPick={handlePick}
          pickBusyId={busyId}
          addedIds={addedIds}
        />
      </ModalBody>
    </Modal>
  );
}
