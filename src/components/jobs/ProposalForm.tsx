'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

const ACCENT = '#C4735B';

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

  const formatPrice = (value: string) => {
    if (!value) return '';
    return Number(value).toLocaleString('en-US').replace(/,/g, ' ');
  };

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
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-body text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {locale === 'ka' ? 'სამოტივაციო წერილი' : 'Cover Letter'}
            </label>
            <textarea
              rows={4}
              required
              value={formData.coverLetter}
              onChange={(e) =>
                setFormData({ ...formData, coverLetter: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
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
              <input
                type="text"
                inputMode="numeric"
                value={formatPrice(formData.proposedPrice)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^\d.]/g, '');
                  setFormData({ ...formData, proposedPrice: rawValue });
                }}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {locale === 'ka' ? 'ვადა' : 'Duration'}
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDuration: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
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
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-body text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {isSubmitting
                ? '...'
                : locale === 'ka'
                  ? 'გაგზავნა'
                  : 'Submit'}
            </button>
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
