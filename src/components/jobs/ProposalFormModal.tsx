'use client';

import { Banknote, Briefcase, MapPin, Ruler, X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import Select from '@/components/common/Select';
import { formatNumberWithSpaces } from '@/utils/currencyUtils';

import { useLanguage } from "@/contexts/LanguageContext";

interface JobSummary {
  title: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  category?: string;
  subcategory?: string;
  propertyType?: string;
  propertySize?: number;
}

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
  job?: JobSummary;
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
  job,
}: ProposalFormModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const texts = {
    title: t('job.submitProposal'),
    coverLetter: t('job.coverLetter'),
    coverLetterPlaceholder: t('job.describeYourExperience'),
    price: t('common.price'),
    duration: t('common.duration'),
    unit: t('job.unit'),
    days: t('common.days'),
    weeks: t('job.weeks'),
    months: t('common.months'),
    cancel: t('common.cancel'),
    submit: t('common.submit'),
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

  // Format budget display
  const formatBudget = () => {
    if (!job) return null;
    if (job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax) {
      return `${formatNumberWithSpaces(job.budgetMin.toString())} - ${formatNumberWithSpaces(job.budgetMax.toString())} ₾`;
    }
    if (job.budgetMin) {
      return `${formatNumberWithSpaces(job.budgetMin.toString())} ₾`;
    }
    if (job.budgetMax) {
      return `${formatNumberWithSpaces(job.budgetMax.toString())} ₾`;
    }
    return t('common.negotiable');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
              {texts.title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Job Summary Card */}
        {job && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-3 line-clamp-2">
              {job.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Budget */}
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-[10px] uppercase tracking-wide">{t('common.budget')}</p>
                  <p className="font-semibold text-neutral-700 dark:text-neutral-200">{formatBudget()}</p>
                </div>
              </div>

              {/* Location */}
              {job.location && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase tracking-wide">{t('common.location')}</p>
                    <p className="font-medium text-neutral-700 dark:text-neutral-200 capitalize">{job.location}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {(job.category || job.subcategory) && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase tracking-wide">{locale === 'ka' ? 'კატეგორია' : 'Category'}</p>
                    <p className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[100px]">{job.subcategory || job.category}</p>
                  </div>
                </div>
              )}

              {/* Property Size */}
              {job.propertySize && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase tracking-wide">{locale === 'ka' ? 'ფართი' : 'Size'}</p>
                    <p className="font-medium text-neutral-700 dark:text-neutral-200">{job.propertySize} {locale === 'ka' ? 'მ²' : 'm²'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            <Label>{texts.coverLetter}</Label>
            <Textarea
              rows={4}
              required
              value={proposalData.coverLetter}
              onChange={(e) => onDataChange({ ...proposalData, coverLetter: e.target.value })}
              placeholder={texts.coverLetterPlaceholder}
            />
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{texts.price}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatPrice(proposalData.proposedPrice)}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{texts.duration}</Label>
              <Input
                type="number"
                min={1}
                value={proposalData.estimatedDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{texts.unit}</Label>
              <Select
                value={proposalData.estimatedDurationUnit}
                onChange={(value) => onDataChange({ ...proposalData, estimatedDurationUnit: value })}
                options={[
                  { value: 'days', label: texts.days },
                  { value: 'weeks', label: texts.weeks },
                  { value: 'months', label: texts.months },
                ]}
              />
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
              {texts.cancel}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
            >
              {texts.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
