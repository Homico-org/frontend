'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatNumberWithSpaces } from '@/utils/currencyUtils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

export interface ProposalFormData {
  coverLetter: string;
  proposedPrice: string;
  estimatedDuration: string;
  estimatedDurationUnit: 'days' | 'weeks' | 'months';
}

export interface ProposalFormProps {
  /** Whether the form is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler */
  onSubmit: (data: ProposalFormData) => Promise<void>;
  /** Error message to display */
  error?: string;
  /** Locale for translations */
  locale?: 'en' | 'ka';
}

export default function ProposalForm({
  isOpen,
  onClose,
  onSubmit,
  error,
  locale = 'en',
}: ProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalFormData>({
    coverLetter: '',
    proposedPrice: '',
    estimatedDuration: '',
    estimatedDurationUnit: 'days',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        coverLetter: '',
        proposedPrice: '',
        estimatedDuration: '',
        estimatedDurationUnit: 'days',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value: string) => formatNumberWithSpaces(value);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
              {locale === 'ka' ? 'წინადადების გაგზავნა' : 'Submit Proposal'}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-neutral-400" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4">
            <Alert variant="error" size="sm" showIcon={false}>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {locale === 'ka' ? 'სამოტივაციო წერილი' : 'Cover Letter'}
            </label>
            <Textarea
              required
              value={formData.coverLetter}
              onChange={(e) =>
                setFormData({ ...formData, coverLetter: e.target.value })
              }
              placeholder={
                locale === 'ka'
                  ? 'წარმოადგინეთ თქვენი გამოცდილება...'
                  : 'Describe your experience...'
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {locale === 'ka' ? 'ფასი (₾)' : 'Price (₾)'}
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatPrice(formData.proposedPrice)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^\d.]/g, '');
                  setFormData({ ...formData, proposedPrice: rawValue });
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {locale === 'ka' ? 'ვადა' : 'Duration'}
              </label>
              <Input
                type="number"
                min={1}
                value={formData.estimatedDuration}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseInt(value) >= 1) {
                    setFormData({ ...formData, estimatedDuration: value });
                  }
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {locale === 'ka' ? 'ერთეული' : 'Unit'}
              </label>
              <select
                value={formData.estimatedDurationUnit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDurationUnit: e.target.value as 'days' | 'weeks' | 'months',
                  })
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/20 focus:border-[#E07B4F] transition-all cursor-pointer"
              >
                <option value="days">
                  {locale === 'ka' ? 'დღე' : 'Days'}
                </option>
                <option value="weeks">
                  {locale === 'ka' ? 'კვირა' : 'Weeks'}
                </option>
                <option value="months">
                  {locale === 'ka' ? 'თვე' : 'Months'}
                </option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              {locale === 'ka' ? 'გაგზავნა' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
