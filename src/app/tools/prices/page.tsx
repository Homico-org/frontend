'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database, Info, Search } from 'lucide-react';
import {
  priceDatabase,
  type PriceCategory,
  type PriceItem,
} from '@/data/priceDatabase';

// UI Components
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPills, type FilterPillOption } from '@/components/ui/FilterPills';
import { Badge } from '@/components/ui/badge';

// Tools Components
import { PriceCard } from '@/components/tools/prices/PriceCard';
import { categoryIconMap } from '@/components/tools/prices/categoryIcons';
import EmptyState from '@/components/common/EmptyState';

// All categories for filter
const CATEGORIES: PriceCategory[] = [
  'demolition',
  'electrical',
  'plumbing',
  'heating',
  'walls',
  'flooring',
  'ceiling',
  'painting',
  'tiling',
  'doors_windows',
];

export default function PricesPage() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PriceCategory | 'all'>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Build category filter options with counts and icons
  const categoryOptions: FilterPillOption[] = useMemo(() => {
    return CATEGORIES.map((category) => ({
      key: category,
      label: t(`tools.categories.${category}`),
      count: priceDatabase.filter((item) => item.category === category).length,
      icon: categoryIconMap[category],
    }));
  }, [t]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let items = priceDatabase;

    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = locale === 'ka' ? item.nameKa : item.nameEn;
        return (
          name.toLowerCase().includes(query) ||
          item.workType.toLowerCase().includes(query)
        );
      });
    }

    return items;
  }, [selectedCategory, searchQuery, locale]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredItems };
    }

    const groups: Record<PriceCategory, PriceItem[]> = {} as Record<PriceCategory, PriceItem[]>;
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems, selectedCategory]);

  const handleToggleItem = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0a0a0a]">
      {/* Page Header */}
      <PageHeader
        icon={Database}
        iconVariant="success"
        title={t('tools.prices.title')}
        subtitle={t('tools.prices.subtitle')}
        backHref="/tools"
        backLabel={t('tools.back')}
        rightContent={
          <Badge variant="secondary" size="sm" className="hidden sm:inline-flex">
            {t('tools.prices.updated')}
          </Badge>
        }
      >
        {/* Search Input */}
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={t('tools.prices.searchPlaceholder')}
          variant="forest"
        />
      </PageHeader>

      {/* Category Filter Pills */}
      <div className="sticky top-0 z-20 bg-cream-50/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <FilterPills
              options={categoryOptions}
              value={selectedCategory}
              onChange={(key) => setSelectedCategory(key as PriceCategory | 'all')}
              showAll
              allLabel={t('tools.prices.allCategories')}
              allCount={priceDatabase.length}
              activeVariant="forest"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-neutral-500">
              {filteredItems.length} {t('tools.prices.items')}
            </span>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-[#4A7C59] dark:text-[#6B9B7A] hover:underline"
              >
                {t('tools.prices.clearFilter')}
              </button>
            )}
          </div>

          {/* Price List */}
          {filteredItems.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => {
                if (!items || items.length === 0) return null;

                const CategoryIcon = categoryIconMap[category as PriceCategory];
                const categoryName = t(`tools.categories.${category}`);

                return (
                  <section key={category}>
                    {/* Category Header - Only show when viewing all categories */}
                    {selectedCategory === 'all' && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E07B4F]/10 dark:bg-[#E07B4F]/20 flex items-center justify-center">
                          <CategoryIcon
                            className="w-4 h-4 text-[#E07B4F] dark:text-[#E8956A]"
                            strokeWidth={1.5}
                          />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {categoryName}
                        </h2>
                        <span className="text-sm text-neutral-400">
                          ({items.length})
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2">
                      {items.map((item) => (
                        <PriceCard
                          key={item.id}
                          item={item}
                          expanded={expandedItem === item.id}
                          onToggle={() => handleToggleItem(item.id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={t('tools.prices.noResults')}
              description={t('tools.prices.tryDifferentSearch')}
              actionLabel={t('tools.prices.clearFilter')}
              onAction={handleClearFilters}
              variant="simple"
              size="md"
            />
          )}

          {/* Footer Note */}
          <div className="mt-8 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-0.5">
                  {t('tools.prices.pricesNote')}
                </p>
                <p className="text-xs text-neutral-500">
                  {t('tools.prices.noteDetail')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
