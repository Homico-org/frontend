'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { type Room, type WorkCategories, type QualityLevel, type CalculationResult, QUALITY_MULTIPLIERS } from './types';
import { calculateFullBreakdown } from '@/utils/calculator';
import { categoryIconMap } from '@/components/tools/prices/categoryIcons';
import { type PriceCategory } from '@/data/priceDatabase';
import { Toggle } from '@/components/ui/Toggle';

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
  const [breakdownView, setBreakdownView] = useState<BreakdownView>('category');

  const calculation = useMemo(() => {
    return calculateFullBreakdown(rooms, workCategories, qualityLevel, includeMaterials);
  }, [rooms, workCategories, qualityLevel, includeMaterials]);

  const formatCurrency = (amount: number) => amount.toLocaleString() + '₾';

  const totalArea = rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);

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
