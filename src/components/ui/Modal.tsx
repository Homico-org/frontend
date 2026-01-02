'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Modal size variants
const modalVariants = cva(
  'relative w-full rounded-2xl overflow-hidden shadow-2xl animate-fade-in',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Modal header variants for different types
const headerVariants = cva('p-6 text-center', {
  variants: {
    variant: {
      default: '',
      danger: 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-b border-red-500/15',
      warning: 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-b border-yellow-500/15',
      success: 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-b border-green-500/15',
      info: 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-b border-blue-500/15',
      accent: 'bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 border-b border-[#C4735B]/15',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Icon container variants
const iconContainerVariants = cva(
  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 dark:bg-neutral-800',
        danger: 'bg-red-100 dark:bg-red-900/30',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30',
        success: 'bg-green-100 dark:bg-green-900/30',
        info: 'bg-blue-100 dark:bg-blue-900/30',
        accent: 'bg-[#C4735B]/10 dark:bg-[#C4735B]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Title color variants
const titleVariants = cva('text-xl font-bold', {
  variants: {
    variant: {
      default: 'text-neutral-900 dark:text-white',
      danger: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-500',
      success: 'text-green-600 dark:text-green-400',
      info: 'text-blue-600 dark:text-blue-400',
      accent: 'text-[#C4735B]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ModalVariant = 'default' | 'danger' | 'warning' | 'success' | 'info' | 'accent';

interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  preventClose?: boolean;
}

/**
 * Base Modal component with backdrop and close functionality
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = false,
  className,
  preventClose = false,
}: ModalProps) {
  const handleClose = useCallback(() => {
    if (!preventClose) {
      onClose();
    }
  }, [onClose, preventClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? handleClose : undefined}
      />

      {/* Modal container */}
      <div
        className={cn(modalVariants({ size }), className)}
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        {showCloseButton && !preventClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: ModalVariant;
  className?: string;
}

/**
 * Modal header with optional icon and gradient background
 */
export function ModalHeader({
  icon,
  title,
  description,
  variant = 'default',
  className,
}: ModalHeaderProps) {
  return (
    <div className={cn(headerVariants({ variant }), className)}>
      {icon && (
        <div className={iconContainerVariants({ variant })}>
          {icon}
        </div>
      )}
      <h3 className={titleVariants({ variant })}>{title}</h3>
      {description && (
        <p
          className="text-sm mt-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Modal body container
 */
export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Modal footer for actions
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex gap-3 px-6 pb-6', className)}>{children}</div>
  );
}

interface ModalActionsProps {
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  loadingLabel?: string;
  confirmDisabled?: boolean;
  variant?: ModalVariant;
  confirmIcon?: ReactNode;
  className?: string;
}

/**
 * Pre-built modal action buttons
 */
export function ModalActions({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  isLoading = false,
  loadingLabel = 'Loading...',
  confirmDisabled = false,
  variant = 'accent',
  confirmIcon,
  className,
}: ModalActionsProps) {
  const buttonColors: Record<ModalVariant, string> = {
    default: 'bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-400',
    danger: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-red-800',
    warning: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 dark:disabled:bg-yellow-800',
    success: 'bg-green-500 hover:bg-green-600 disabled:bg-green-300 dark:disabled:bg-green-800',
    info: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800',
    accent: 'bg-[#C4735B] hover:bg-[#B5624A] disabled:bg-[#C4735B]/50',
  };

  return (
    <div className={cn('flex gap-3 pt-2', className)}>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 py-3 rounded-xl font-medium transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
        style={{
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading || confirmDisabled}
        className={cn(
          'flex-1 py-3 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed',
          buttonColors[variant]
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {confirmIcon}
            {confirmLabel}
          </>
        )}
      </button>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: ModalVariant;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  confirmIcon?: ReactNode;
  children?: ReactNode;
  size?: VariantProps<typeof modalVariants>['size'];
}

/**
 * Pre-built confirmation modal
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  variant = 'accent',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  isLoading = false,
  loadingLabel = 'Loading...',
  confirmIcon,
  children,
  size = 'md',
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      preventClose={isLoading}
    >
      <ModalHeader
        icon={icon}
        title={title}
        description={description}
        variant={variant}
      />
      <ModalBody>
        {children}
        <ModalActions
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          onCancel={onClose}
          onConfirm={onConfirm}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          variant={variant}
          confirmIcon={confirmIcon}
        />
      </ModalBody>
    </Modal>
  );
}

export default Modal;
