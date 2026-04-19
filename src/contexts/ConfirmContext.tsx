'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '@/components/ui/Modal';

type ModalVariant = 'default' | 'danger' | 'warning' | 'success' | 'info' | 'accent';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    pendingRef.current?.resolve(false);
    setPending(null);
  }, []);

  const handleConfirm = useCallback(() => {
    pendingRef.current?.resolve(true);
    setPending(null);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        isOpen={pending !== null}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={pending?.title ?? ''}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        variant={pending?.variant ?? 'danger'}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextType['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx.confirm;
}
