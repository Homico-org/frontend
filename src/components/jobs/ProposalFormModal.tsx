'use client';

import { Banknote, Calendar, Clock, MapPin, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces } from '@/utils/currencyUtils';
import { useCallback } from 'react';

interface JobSummary {
  title: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  category?: string;
  subcategory?: string;
  propertyType?: string;
  propertySize?: number;
  services?: { key: string; unitKey?: string; quantity: number; unitPrice: number; unit?: string }[];
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
  proposalData,
  onDataChange,
  job,
}: ProposalFormModalProps) {
  const { t, locale } = useLanguage();
  const { categories: catalogCats } = useCategories();

  const getLabel = useCallback((key: string): string => {
    for (const cat of catalogCats) {
      if (cat.key === key) return locale === 'ka' ? cat.nameKa : cat.name;
      for (const sub of cat.subcategories) {
        if (sub.key === key) return locale === 'ka' ? sub.nameKa : sub.name;
        for (const svc of sub.services || []) {
          if (svc.key === key) return locale === 'ka' ? svc.nameKa : svc.name;
        }
      }
    }
    return key;
  }, [catalogCats, locale]);

  const getUnitLabel = useCallback((serviceKey: string, unitKey?: string): string => {
    for (const cat of catalogCats) {
      for (const sub of cat.subcategories) {
        for (const svc of sub.services || []) {
          if (svc.key === serviceKey) {
            const uo = unitKey
              ? svc.unitOptions?.find(u => u.key === unitKey)
              : svc.unitOptions?.[0];
            if (uo) return locale === 'ka' ? uo.label.ka : uo.label.en;
            return locale === 'ka' ? svc.unitNameKa : svc.unitName;
          }
        }
      }
    }
    return '';
  }, [catalogCats, locale]);

  if (!isOpen) return null;

  const handlePriceChange = (value: string) => {
    const rawValue = value.replace(/[^\d.]/g, '');
    onDataChange({ ...proposalData, proposedPrice: rawValue });
  };

  const handleDurationChange = (value: string) => {
    if (value === '' || parseInt(value) >= 1) {
      onDataChange({ ...proposalData, estimatedDuration: value });
    }
  };

  const budgetText = (() => {
    if (!job) return null;
    // Services total
    if (job.services && job.services.length > 0) {
      const total = job.services.reduce((s, svc) => s + svc.unitPrice * (svc.quantity || 1), 0);
      if (total > 0) return `${formatNumberWithSpaces(total.toString())}₾`;
    }
    if (job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax) {
      return `${formatNumberWithSpaces(job.budgetMin.toString())}–${formatNumberWithSpaces(job.budgetMax.toString())}₾`;
    }
    if (job.budgetMin) return `${formatNumberWithSpaces(job.budgetMin.toString())}₾`;
    return t('common.negotiable');
  })();

  const durationUnits = [
    { value: 'days', label: locale === 'ka' ? 'დღე' : 'days' },
    { value: 'weeks', label: locale === 'ka' ? 'კვირა' : 'weeks' },
    { value: 'months', label: locale === 'ka' ? 'თვე' : 'months' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('job.submitProposal')}
            </h2>
            {job && (
              <p className="text-[12px] mt-0.5 truncate max-w-[260px]" style={{ color: 'var(--color-text-muted)' }}>
                {job.title}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Job context — compact pills */}
        {job && (
          <div className="px-5 pt-4 flex flex-wrap gap-2">
            {job.category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(196,115,91,0.1)', color: '#C4735B' }}>
                {getLabel(job.category)}
              </span>
            )}
            {budgetText && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: '#059669' }}>
                <Banknote className="w-3 h-3" />
                {budgetText}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                <MapPin className="w-3 h-3" />
                {job.location.split(',')[0]}
              </span>
            )}
          </div>
        )}

        {/* Services breakdown */}
        {job?.services && job.services.length > 0 && (
          <div className="px-5 pt-3">
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
              {job.services.map((svc, i) => {
                const qty = svc.quantity || 1;
                return (
                  <div
                    key={`${svc.key}-${i}`}
                    className="flex items-center justify-between px-3 py-2 text-[12px]"
                    style={{ borderBottom: i < job.services!.length - 1 ? '1px solid var(--color-border-subtle)' : undefined }}
                  >
                    <span style={{ color: 'var(--color-text-primary)' }}>
                      {getLabel(svc.key)}
                      <span className="ml-1" style={{ color: 'var(--color-text-muted)' }}>
                        {qty > 1 ? `${qty}×` : ''}{getUnitLabel(svc.key, svc.unitKey)}
                      </span>
                    </span>
                    {svc.unitPrice > 0 && (
                      <span className="font-bold" style={{ color: '#C4735B' }}>{svc.unitPrice * qty}₾</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 text-[12px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* Cover Letter */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {t('job.coverLetter')}
            </label>
            <Textarea
              rows={4}
              required
              value={proposalData.coverLetter}
              onChange={(e) => onDataChange({ ...proposalData, coverLetter: e.target.value })}
              placeholder={t('job.describeYourExperience')}
              className="text-sm"
            />
          </div>

          {/* Price + Duration — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Proposed Price */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                {t('common.price')} (₾)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>₾</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={proposalData.proposedPrice ? formatNumberWithSpaces(proposalData.proposedPrice) : ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder={budgetText || '0'}
                  className="w-full pl-7 pr-3 py-2.5 text-sm font-semibold rounded-xl border outline-none transition-all focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Clock className="w-3 h-3 inline mr-1" />{t('common.duration')}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={proposalData.estimatedDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="0"
                  className="w-16 px-3 py-2.5 text-sm font-semibold text-center rounded-xl border outline-none transition-all focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <div className="flex rounded-xl overflow-hidden border flex-1" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  {durationUnits.map(u => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => onDataChange({ ...proposalData, estimatedDurationUnit: u.value })}
                      className="flex-1 py-2.5 text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: proposalData.estimatedDurationUnit === u.value ? '#C4735B' : 'var(--color-bg-elevated)',
                        color: proposalData.estimatedDurationUnit === u.value ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {t('common.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
