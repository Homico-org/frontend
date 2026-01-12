'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreditCard, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import PaymentMethodCard, { EmptyPaymentMethods, type PaymentMethod } from './PaymentMethodCard';

interface PaymentSettingsProps {
  onOpenAddCardModal: () => void;
}

export default function PaymentSettings({ onOpenAddCardModal }: PaymentSettingsProps) {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [isAuthenticated, fetchPaymentMethods]);

  const handleSetDefaultCard = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods/${id}/default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPaymentMethods(prev =>
          prev.map(m => ({ ...m, isDefault: m.id === id }))
        );
        setMessage({ type: 'success', text: t('settings.defaultCardUpdated') });
      }
    } catch {
      setMessage({ type: 'error', text: t('settings.errorUpdatingCard') });
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
        setMessage({ type: 'success', text: t('settings.cardDeleted') });
      }
    } catch {
      setMessage({ type: 'error', text: t('settings.errorDeletingCard') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
            {t('settings.paymentMethods')}
          </h2>
          <p className="text-sm mt-1 text-neutral-500">
            {t('settings.manageYourSavedCards')}
          </p>
        </div>
        <Button
          onClick={onOpenAddCardModal}
          leftIcon={<CreditCard className="w-4 h-4" />}
        >
          {t('settings.addCard')}
        </Button>
      </div>

      {message && (
        <Alert
          variant={message.type === 'success' ? 'success' : 'error'}
          dismissible
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-sm text-neutral-400">
            {t('common.loading')}
          </span>
        </div>
      ) : paymentMethods.length === 0 ? (
        <EmptyPaymentMethods
          locale={locale as 'en' | 'ka' | 'ru'}
          onAddCard={onOpenAddCardModal}
        />
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              locale={locale as 'en' | 'ka' | 'ru'}
              onSetDefault={handleSetDefaultCard}
              onDelete={handleDeleteCard}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <Card className="p-4 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <IconBadge icon={Shield} variant="info" size="md" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {t('settings.securePayments')}
            </p>
            <p className="text-xs mt-1 text-blue-600/70 dark:text-blue-400/70">
              {t('settings.yourCardInformationIsEncrypted')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

