'use client';

import { X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { formatNumberWithSpaces } from '@/utils/currencyUtils';

interface ProposalData {
  coverLetter: string;
  proposedPrice: string;
  estimatedDuration: string;
  estimatedDurationUnit: string;
}

interface ProposalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error?: string;
  locale: string;
  proposalData: ProposalData;
  onDataChange: (data: ProposalData) => void;
}

export default function ProposalFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  locale,
  proposalData,
  onDataChange,
}: ProposalFormModalProps) {
  if (!isOpen) return null;

  const t = {
    title: locale === 'ka' ? 'წინადადების გაგზავნა' : 'Submit Proposal',
    coverLetter: locale === 'ka' ? 'სამოტივაციო წერილი' : 'Cover Letter',
    coverLetterPlaceholder: locale === 'ka' ? 'წარმოადგინეთ თქვენი გამოცდილება...' : 'Describe your experience...',
    price: locale === 'ka' ? 'ფასი (₾)' : 'Price (₾)',
    duration: locale === 'ka' ? 'ვადა' : 'Duration',
    unit: locale === 'ka' ? 'ერთეული' : 'Unit',
    days: locale === 'ka' ? 'დღე' : 'Days',
    weeks: locale === 'ka' ? 'კვირა' : 'Weeks',
    months: locale === 'ka' ? 'თვე' : 'Months',
    cancel: locale === 'ka' ? 'გაუქმება' : 'Cancel',
    submit: locale === 'ka' ? 'გაგზავნა' : 'Submit',
  };

  const handlePriceChange = (value: string) => {
    // Remove spaces and non-numeric characters except decimal point
    const rawValue = value.replace(/[^\d.]/g, '');
    onDataChange({ ...proposalData, proposedPrice: rawValue });
  };

  const handleDurationChange = (value: string) => {
    if (value === '' || parseInt(value) >= 1) {
      onDataChange({ ...proposalData, estimatedDuration: value });
    }
  };

  const formatPrice = (value: string) => formatNumberWithSpaces(value);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4">
            <Alert variant="error" size="sm">{error}</Alert>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Cover Letter */}
          <div>
            <Label>{t.coverLetter}</Label>
            <Textarea
              rows={4}
              required
              value={proposalData.coverLetter}
              onChange={(e) => onDataChange({ ...proposalData, coverLetter: e.target.value })}
              placeholder={t.coverLetterPlaceholder}
            />
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t.price}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatPrice(proposalData.proposedPrice)}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t.duration}</Label>
              <Input
                type="number"
                min={1}
                value={proposalData.estimatedDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t.unit}</Label>
              <select
                value={proposalData.estimatedDurationUnit}
                onChange={(e) => onDataChange({ ...proposalData, estimatedDurationUnit: e.target.value })}
                className="flex w-full h-11 px-4 py-2.5 text-sm rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15 transition-all cursor-pointer"
              >
                <option value="days">{t.days}</option>
                <option value="weeks">{t.weeks}</option>
                <option value="months">{t.months}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
            >
              {t.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
