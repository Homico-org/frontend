'use client';

import { useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardholderName?: string;
  bankName?: string;
  maskedIban?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentMethodCardProps {
  /** Payment method data */
  method: PaymentMethod;
  /** Handler for setting as default */
  onSetDefault?: (id: string) => void;
  /** Handler for deletion */
  onDelete?: (id: string) => Promise<void>;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
  locale = 'en',
  className = '',
}: PaymentMethodCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(method.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get brand color
  const getBrandColor = () => {
    switch (method.cardBrand) {
      case 'Visa':
        return '#1A1F71';
      case 'Mastercard':
        return '#EB001B';
      case 'Amex':
        return '#006FCF';
      default:
        return '#6B7280';
    }
  };

  // Get brand label
  const getBrandLabel = () => {
    switch (method.cardBrand) {
      case 'Visa':
        return 'VISA';
      case 'Mastercard':
        return 'MC';
      case 'Amex':
        return 'AMEX';
      default:
        return 'CARD';
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: method.isDefault ? '2px solid #E07B4F' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Card Brand Icon */}
        <div
          className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: getBrandColor(),
            color: 'white',
          }}
        >
          {getBrandLabel()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              •••• {method.cardLast4}
            </span>
            {method.isDefault && (
              <Badge variant="premium" size="xs">
                {locale === 'ka' ? 'მთავარი' : 'Default'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {method.cardholderName && (
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {method.cardholderName}
              </span>
            )}
            {method.cardExpiry && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {locale === 'ka' ? 'ვადა' : 'Exp'}: {method.cardExpiry}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!method.isDefault && onSetDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {locale === 'ka' ? 'მთავარად დაყენება' : 'Set Default'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" color="#ef4444" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Empty state component
export interface EmptyPaymentMethodsProps {
  onAddCard?: () => void;
  locale?: 'en' | 'ka';
  className?: string;
}

export function EmptyPaymentMethods({
  onAddCard,
  locale = 'en',
  className = '',
}: EmptyPaymentMethodsProps) {
  return (
    <div className={`text-center py-10 sm:py-12 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
        <CreditCard
          className="h-8 w-8"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      </div>
      <p
        className="text-sm sm:text-base font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {locale === 'ka' ? 'ბარათები არ არის დამატებული' : 'No cards added yet'}
      </p>
      <p
        className="text-sm mt-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {locale === 'ka' ? 'დაამატეთ ბარათი სწრაფი გადახდისთვის' : 'Add a card for faster checkout'}
      </p>
      {onAddCard && (
        <button
          onClick={onAddCard}
          className="mt-4 px-6 py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl transition-all flex items-center gap-2 mx-auto"
        >
          <CreditCard className="w-4 h-4" />
          {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
        </button>
      )}
    </div>
  );
}
