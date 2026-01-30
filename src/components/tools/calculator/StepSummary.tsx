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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          {t('tools.calculator.qualityLevel')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {QUALITY_OPTIONS.map(({ level, icon: Icon, color }) => {
            const isSelected = qualityLevel === level;
            const colorMap = {
              neutral: {
                bg: 'bg-neutral-100 dark:bg-neutral-800',
                ring: 'ring-neutral-400',
                icon: 'text-neutral-600 dark:text-neutral-400',
              },
              forest: {
                bg: 'bg-forest-50 dark:bg-forest-900/20',
                ring: 'ring-forest-500',
                icon: 'text-forest-600 dark:text-forest-400',
              },
              terracotta: {
                bg: 'bg-terracotta-50 dark:bg-terracotta-900/20',
                ring: 'ring-terracotta-500',
                icon: 'text-terracotta-600 dark:text-terracotta-400',
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
                    : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colorClasses.icon}`} strokeWidth={1.5} />
                </div>
                <div className={`font-semibold text-sm ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {t(`tools.calculator.${level}`)}
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  ×{QUALITY_MULTIPLIERS[level]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Include Materials Toggle */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {t('tools.calculator.includeMaterials')}
              </h3>
              <p className="text-sm text-neutral-500">
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
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            {t('tools.calculator.totalArea')}
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
            {totalArea.toFixed(1)} <span className="text-lg font-normal">m²</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            {t('tools.calculator.roomsLabel')}
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
            {rooms.length}
          </div>
        </div>
      </div>

      {/* Breakdown View Toggle */}
      <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <button
          onClick={() => setBreakdownView('category')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            breakdownView === 'category'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.byCategory')}
        </button>
        <button
          onClick={() => setBreakdownView('room')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            breakdownView === 'room'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.byRoom')}
        </button>
      </div>

      {/* Breakdown */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {t('tools.calculator.costBreakdown')}
          </h3>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {breakdownView === 'category'
            ? calculation.byCategory.map((cat) => {
                const CategoryIcon = categoryIconMap[cat.category as PriceCategory];
                return (
                  <div key={cat.category} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <CategoryIcon className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t(`tools.categories.${cat.category}`)}
                      </span>
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {formatCurrency(Math.round(cat.subtotal))}
                    </span>
                  </div>
                );
              })
            : calculation.byRoom.map((room) => (
                <div key={room.roomId} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t(`tools.calculator.roomTypes.${room.roomName}`) || room.roomName}
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatCurrency(Math.round(room.subtotal))}
                  </span>
                </div>
              ))}
        </div>

        {/* Total */}
        <div className="p-4 bg-terracotta-50 dark:bg-terracotta-900/20 border-t border-terracotta-200 dark:border-terracotta-800/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-terracotta-600 dark:text-terracotta-400">
              {t('tools.calculator.laborCost')}
            </span>
            <span className="font-semibold text-terracotta-700 dark:text-terracotta-300 tabular-nums">
              {formatCurrency(calculation.totalLabor)}
            </span>
          </div>
          {includeMaterials && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-terracotta-600 dark:text-terracotta-400">
                {t('tools.calculator.materialsCost')}
              </span>
              <span className="font-semibold text-terracotta-700 dark:text-terracotta-300 tabular-nums">
                {formatCurrency(calculation.totalMaterials)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-terracotta-200 dark:border-terracotta-800/30">
            <span className="font-bold text-terracotta-800 dark:text-terracotta-200">
              {t('tools.calculator.total')}
            </span>
            <span className="text-2xl font-bold text-terracotta-700 dark:text-terracotta-300 tabular-nums">
              {formatCurrency(calculation.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Info className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.estimateRange')}
        </div>
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
          {formatCurrency(calculation.lowEstimate)} — {formatCurrency(calculation.highEstimate)}
        </div>
      </div>

      {/* AI Tips Section */}
      <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/20 dark:to-forest-800/10 rounded-2xl border border-forest-200 dark:border-forest-800/30 overflow-hidden">
        <div className="p-4 border-b border-forest-200 dark:border-forest-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-forest-200 dark:bg-forest-900/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-forest-600 dark:text-forest-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-forest-800 dark:text-forest-200">
              {t('tools.calculator.aiTips')}
            </h3>
          </div>
          <button
            onClick={fetchAITips}
            disabled={isLoadingAI}
            className="p-2 rounded-lg bg-forest-200/50 dark:bg-forest-900/30 hover:bg-forest-200 dark:hover:bg-forest-900/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-forest-600 dark:text-forest-400 ${isLoadingAI ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-4">
          {isLoadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-forest-600 dark:text-forest-400">
                <RefreshCw className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                <span className="text-sm">{t('tools.calculator.loadingAI')}</span>
              </div>
            </div>
          ) : aiError ? (
            <div className="text-center py-6">
              <p className="text-sm text-forest-600 dark:text-forest-400">{aiError}</p>
              <button
                onClick={fetchAITips}
                className="mt-3 text-sm font-medium text-forest-700 dark:text-forest-300 hover:underline"
              >
                {t('tools.calculator.tryAgain')}
              </button>
            </div>
          ) : aiTips ? (
            <div className="space-y-4">
              {/* Timeline */}
              {aiTips.timeline && (
                <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-neutral-900/40 rounded-xl">
                  <Clock className="w-5 h-5 text-forest-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-forest-800 dark:text-forest-200">
                      {t('tools.calculator.estimatedTimeline')}
                    </p>
                    <p className="text-sm text-forest-600 dark:text-forest-400 mt-0.5">
                      {aiTips.timeline}
                    </p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {aiTips.tips && aiTips.tips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-forest-800 dark:text-forest-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
                    {t('tools.calculator.smartTips')}
                  </p>
                  <ul className="space-y-2">
                    {aiTips.tips.slice(0, 4).map((tip, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-forest-700 dark:text-forest-300 p-2 bg-white/40 dark:bg-neutral-900/30 rounded-lg"
                      >
                        <span className="text-forest-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Estimate Comparison */}
              {aiTips.totalEstimate > 0 && (
                <div className="p-3 bg-white/60 dark:bg-neutral-900/40 rounded-xl">
                  <p className="text-xs text-forest-600 dark:text-forest-400 mb-1">
                    {t('tools.calculator.aiEstimate')}
                  </p>
                  <p className="text-lg font-bold text-forest-700 dark:text-forest-300 tabular-nums">
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
        className="block w-full py-4 px-6 bg-terracotta-500 hover:bg-terracotta-600 text-white text-center font-semibold rounded-xl shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all"
      >
        <span className="flex items-center justify-center gap-2">
          {t('tools.calculator.getQuotes')}
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </span>
      </Link>

      <p className="text-center text-xs text-neutral-400">
        {t('tools.calculator.disclaimer')}
      </p>
    </div>
  );
}
