'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Wallet,
  Star,
  Crown,
  ChevronRight,
  LayoutGrid,
  Layers,
  Package,
  Info,
  Sparkles,
  Lightbulb,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { type Room, type WorkCategories, type QualityLevel, type CalculationResult, QUALITY_MULTIPLIERS } from './types';
import { calculateFullBreakdown } from '@/utils/calculator';
import { categoryIconMap } from '@/components/tools/prices/categoryIcons';
import { type PriceCategory } from '@/data/priceDatabase';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { aiService, RenovationCalculatorResult } from '@/services/ai';
import { useLanguage } from '@/contexts/LanguageContext';

interface StepSummaryProps {
  rooms: Room[];
  workCategories: WorkCategories;
  qualityLevel: QualityLevel;
  includeMaterials: boolean;
  onQualityLevelChange: (level: QualityLevel) => void;
  onIncludeMaterialsChange: (include: boolean) => void;
  t: (key: string) => string;
}

type BreakdownView = 'category' | 'room';

type ColorVariant = 'neutral' | 'forest' | 'terracotta';

const QUALITY_OPTIONS: { level: QualityLevel; icon: typeof Wallet; color: ColorVariant }[] = [
  { level: 'economy', icon: Wallet, color: 'neutral' },
  { level: 'standard', icon: Star, color: 'forest' },
  { level: 'premium', icon: Crown, color: 'terracotta' },
];

export function StepSummary({
  rooms,
  workCategories,
  qualityLevel,
  includeMaterials,
  onQualityLevelChange,
  onIncludeMaterialsChange,
  t,
}: StepSummaryProps) {
  const { locale } = useLanguage();
  const [breakdownView, setBreakdownView] = useState<BreakdownView>('category');
  const [aiTips, setAiTips] = useState<RenovationCalculatorResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const calculation = useMemo(() => {
    return calculateFullBreakdown(rooms, workCategories, qualityLevel, includeMaterials);
  }, [rooms, workCategories, qualityLevel, includeMaterials]);

  const formatCurrency = (amount: number) => amount.toLocaleString() + '₾';

  const totalArea = rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);

  // Map quality level to renovation type
  const getRenovationType = (level: QualityLevel): 'cosmetic' | 'standard' | 'full' | 'luxury' => {
    switch (level) {
      case 'economy': return 'cosmetic';
      case 'standard': return 'standard';
      case 'premium': return 'luxury';
      default: return 'standard';
    }
  };

  // Fetch AI recommendations
  const fetchAITips = useCallback(async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const bathroomCount = rooms.filter(r => r.type === 'bathroom').length;
      const hasKitchen = rooms.some(r => r.type === 'kitchen');

      const result = await aiService.calculateRenovation({
        area: Math.round(totalArea),
        rooms: rooms.length,
        bathrooms: bathroomCount || 1,
        renovationType: getRenovationType(qualityLevel),
        includeKitchen: hasKitchen,
        includeFurniture: false,
        propertyType: 'apartment',
      }, locale);

      setAiTips(result);
    } catch (err: any) {
      console.error('AI tips error:', err);
      setAiError(t('tools.calculator.aiError'));
    } finally {
      setIsLoadingAI(false);
    }
  }, [rooms, totalArea, qualityLevel, locale, t]);

  // Fetch AI tips on mount and when key parameters change
  useEffect(() => {
    fetchAITips();
  }, []);

  return (
    <div className="space-y-5">
      {/* Quality Level */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <h3 className="text-sm font-semibold text-[var(--hm-fg-secondary)] mb-4">
          {t('tools.calculator.qualityLevel')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {QUALITY_OPTIONS.map(({ level, icon: Icon, color }) => {
            const isSelected = qualityLevel === level;
            const colorMap = {
              neutral: {
                bg: 'bg-[var(--hm-bg-tertiary)]',
                ring: 'ring-neutral-400',
                icon: 'text-[var(--hm-fg-secondary)]',
              },
              forest: {
                bg: 'bg-[var(--hm-bg-tertiary)]',
                ring: 'ring-[var(--hm-brand-500)]',
                icon: 'text-[var(--hm-fg-secondary)]',
              },
              terracotta: {
                bg: 'bg-[var(--hm-brand-50)]',
                ring: 'ring-[var(--hm-brand-500)]',
                icon: 'text-[var(--hm-brand-600)]',
              },
            };
            const colorClasses = colorMap[color];

            return (
              <button
                key={level}
                onClick={() => onQualityLevelChange(level)}
                className={`p-4 rounded-xl text-center transition-all ${
                  isSelected
                    ? `${colorClasses.bg} ring-2 ${colorClasses.ring}`
                    : 'bg-[var(--hm-bg-tertiary)]/50 hover:bg-[var(--hm-bg-tertiary)]'
                }`}
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colorClasses.icon}`} strokeWidth={1.5} />
                </div>
                <div className={`font-semibold text-sm ${isSelected ? 'text-[var(--hm-fg-primary)]' : 'text-[var(--hm-fg-secondary)]'}`}>
                  {t(`tools.calculator.${level}`)}
                </div>
                <div className="text-[10px] text-[var(--hm-fg-muted)] mt-0.5">
                  ×{QUALITY_MULTIPLIERS[level]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Include Materials Toggle */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[var(--hm-fg-secondary)]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--hm-fg-primary)]">
                {t('tools.calculator.includeMaterials')}
              </h3>
              <p className="text-sm text-[var(--hm-fg-muted)]">
                {t('tools.calculator.includeMaterialsDesc')}
              </p>
            </div>
          </div>
          <Toggle
            checked={includeMaterials}
            onChange={(e) => onIncludeMaterialsChange(e.target.checked)}
            variant="success"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
          <div className="text-sm text-[var(--hm-fg-muted)] mb-1">
            {t('tools.calculator.totalArea')}
          </div>
          <div className="text-2xl font-bold text-[var(--hm-fg-primary)] tabular-nums">
            {totalArea.toFixed(1)} <span className="text-lg font-normal">m²</span>
          </div>
        </div>
        <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
          <div className="text-sm text-[var(--hm-fg-muted)] mb-1">
            {t('tools.calculator.roomsLabel')}
          </div>
          <div className="text-2xl font-bold text-[var(--hm-fg-primary)] tabular-nums">
            {rooms.length}
          </div>
        </div>
      </div>

      {/* Breakdown View Toggle */}
      <div className="flex gap-2 p-1 bg-[var(--hm-bg-tertiary)] rounded-xl">
        <Button
          variant="ghost"
          onClick={() => setBreakdownView('category')}
          leftIcon={<Layers className="w-4 h-4" strokeWidth={1.5} />}
          className={`flex-1 h-auto py-2.5 px-4 rounded-lg text-sm font-medium ${
            breakdownView === 'category'
              ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-sm hover:bg-[var(--hm-bg-elevated)]'
              : 'text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]'
          }`}
        >
          {t('tools.calculator.byCategory')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setBreakdownView('room')}
          leftIcon={<LayoutGrid className="w-4 h-4" strokeWidth={1.5} />}
          className={`flex-1 h-auto py-2.5 px-4 rounded-lg text-sm font-medium ${
            breakdownView === 'room'
              ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-sm hover:bg-[var(--hm-bg-elevated)]'
              : 'text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]'
          }`}
        >
          {t('tools.calculator.byRoom')}
        </Button>
      </div>

      {/* Breakdown */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--hm-border-subtle)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--hm-brand-100)] flex items-center justify-center">
            <Calculator className="w-4 h-4 text-[var(--hm-brand-600)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-[var(--hm-fg-primary)]">
            {t('tools.calculator.costBreakdown')}
          </h3>
        </div>

        <div className="divide-y divide-[var(--hm-border-subtle)]">
          {breakdownView === 'category'
            ? calculation.byCategory.map((cat) => {
                const CategoryIcon = categoryIconMap[cat.category as PriceCategory];
                return (
                  <div key={cat.category} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                        <CategoryIcon className="w-4 h-4 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[var(--hm-fg-secondary)]">
                        {t(`tools.categories.${cat.category}`)}
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--hm-fg-primary)] tabular-nums">
                      {formatCurrency(Math.round(cat.subtotal))}
                    </span>
                  </div>
                );
              })
            : calculation.byRoom.map((room) => (
                <div key={room.roomId} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--hm-fg-secondary)]">
                    {t(`tools.calculator.roomTypes.${room.roomName}`) || room.roomName}
                  </span>
                  <span className="font-semibold text-[var(--hm-fg-primary)] tabular-nums">
                    {formatCurrency(Math.round(room.subtotal))}
                  </span>
                </div>
              ))}
        </div>

        {/* Total */}
        <div className="p-4 bg-[var(--hm-brand-50)] border-t border-[var(--hm-brand-200)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--hm-brand-600)]">
              {t('tools.calculator.laborCost')}
            </span>
            <span className="font-semibold text-[var(--hm-brand-700)] tabular-nums">
              {formatCurrency(calculation.totalLabor)}
            </span>
          </div>
          {includeMaterials && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--hm-brand-600)]">
                {t('tools.calculator.materialsCost')}
              </span>
              <span className="font-semibold text-[var(--hm-brand-700)] tabular-nums">
                {formatCurrency(calculation.totalMaterials)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--hm-brand-200)]">
            <span className="font-bold text-[var(--hm-brand-800)]">
              {t('tools.calculator.total')}
            </span>
            <span className="text-2xl font-bold text-[var(--hm-brand-700)] tabular-nums">
              {formatCurrency(calculation.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-[var(--hm-bg-tertiary)]/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--hm-fg-muted)]">
          <Info className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.estimateRange')}
        </div>
        <div className="text-sm font-medium text-[var(--hm-fg-secondary)] tabular-nums">
          {formatCurrency(calculation.lowEstimate)} — {formatCurrency(calculation.highEstimate)}
        </div>
      </div>

      {/* AI Tips Section */}
      <div className="bg-gradient-to-br from-[var(--hm-bg-page)] to-[var(--hm-bg-tertiary)] rounded-2xl border border-[var(--hm-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--hm-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--hm-fg-secondary)]" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-[var(--hm-n-800)]">
              {t('tools.calculator.aiTips')}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchAITips}
            disabled={isLoadingAI}
            className="bg-[var(--hm-brand-50)] hover:bg-[var(--hm-brand-100)] rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--hm-fg-secondary)] ${isLoadingAI ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </Button>
        </div>

        <div className="p-4">
          {isLoadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[var(--hm-fg-secondary)]">
                <LoadingSpinner size="md" color="var(--hm-fg-secondary)" />
                <span className="text-sm">{t('tools.calculator.loadingAI')}</span>
              </div>
            </div>
          ) : aiError ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--hm-fg-secondary)]">{aiError}</p>
              <Button
                variant="link"
                onClick={fetchAITips}
                className="mt-3 text-sm font-medium text-[var(--hm-n-700)] hover:underline"
              >
                {t('tools.calculator.tryAgain')}
              </Button>
            </div>
          ) : aiTips ? (
            <div className="space-y-4">
              {/* Timeline */}
              {aiTips.timeline && (
                <div className="flex items-start gap-3 p-3 bg-white/40 rounded-xl">
                  <Clock className="w-5 h-5 text-[var(--hm-fg-secondary)] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-[var(--hm-n-800)]">
                      {t('tools.calculator.estimatedTimeline')}
                    </p>
                    <p className="text-sm text-[var(--hm-fg-secondary)] mt-0.5">
                      {aiTips.timeline}
                    </p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {aiTips.tips && aiTips.tips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--hm-n-800)] flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.calculator.smartTips')}
                  </p>
                  <ul className="space-y-2">
                    {aiTips.tips.slice(0, 4).map((tip, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-[var(--hm-n-700)] p-2 bg-white/30 rounded-lg"
                      >
                        <span className="text-[var(--hm-fg-secondary)] mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Estimate Comparison */}
              {aiTips.totalEstimate > 0 && (
                <div className="p-3 bg-white/40 rounded-xl">
                  <p className="text-xs text-[var(--hm-fg-secondary)] mb-1">
                    {t('tools.calculator.aiEstimate')}
                  </p>
                  <p className="text-lg font-bold text-[var(--hm-n-700)] tabular-nums">
                    {formatCurrency(aiTips.totalEstimate)}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/post-job"
        className="block w-full py-4 px-6 bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white text-center font-semibold rounded-xl shadow-lg shadow-[var(--hm-brand-500)]/25 hover:shadow-[var(--hm-brand-500)]/40 transition-all"
      >
        <span className="flex items-center justify-center gap-2">
          {t('tools.calculator.getQuotes')}
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </span>
      </Link>

      <p className="text-center text-xs text-[var(--hm-fg-muted)]">
        {t('tools.calculator.disclaimer')}
      </p>
    </div>
  );
}
