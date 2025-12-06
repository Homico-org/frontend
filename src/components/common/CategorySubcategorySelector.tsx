'use client';

import { CATEGORIES, CategoryDefinition } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface CategorySubcategorySelectorProps {
  selectedCategory: string;
  selectedSubcategories: string[];
  onCategoryChange: (category: string) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
  customSpecialties?: string[];
  onCustomSpecialtiesChange?: (specialties: string[]) => void;
  showCustomSpecialties?: boolean;
  singleCategoryMode?: boolean; // If true, only one category can be selected at a time
  maxSubcategories?: number;
}

// Custom SVG icons for each category
const CategoryIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'designer':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 32V28C6 26.8954 6.89543 26 8 26H40C41.1046 26 42 26.8954 42 28V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 26V22C10 20.8954 10.8954 20 12 20H36C37.1046 20 38 20.8954 38 22V26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="6" y="32" width="36" height="6" rx="2" stroke="currentColor" strokeWidth="2.5"/>
          <path d="M10 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M38 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 12L28 16L24 20L20 16L24 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="24" cy="8" r="2" fill="currentColor"/>
        </svg>
      );
    case 'architect':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 40V16L24 6L40 16V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 40H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="14" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="28" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 40V34C20 32.8954 20.8954 32 22 32H26C27.1046 32 28 32.8954 28 34V40" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 36L20 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M8 40L12 36L16 40L12 44L8 40Z" fill="currentColor"/>
          <path d="M32 8C28.6863 8 26 10.6863 26 14C26 15.1256 26.3086 16.1832 26.8438 17.0938L18 26L22 30L30.9062 21.1562C31.8168 21.6914 32.8744 22 34 22C37.3137 22 40 19.3137 40 16C40 15.5 39.9 15 39.8 14.5L36 18L32 14L35.5 10.2C35 10.1 34.5 10 34 10C33.3 10 32.6 10.1 32 10.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 32L10 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M38 30L34 36H38L34 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 22L24 8L42 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 20V38C10 39.1046 10.8954 40 12 40H36C37.1046 40 38 39.1046 38 38V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 24C26.5 24 28.5 26 28.5 28.5C28.5 32 24 35 24 35C24 35 19.5 32 19.5 28.5C19.5 26 21.5 24 24 24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M16 16L17 18L16 20L15 18L16 16Z" fill="currentColor"/>
          <path d="M32 16L33 18L32 20L31 18L32 16Z" fill="currentColor"/>
          <circle cx="24" cy="14" r="1.5" fill="currentColor"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
};

export default function CategorySubcategorySelector({
  selectedCategory,
  selectedSubcategories,
  onCategoryChange,
  onSubcategoriesChange,
  customSpecialties = [],
  onCustomSpecialtiesChange,
  showCustomSpecialties = true,
  singleCategoryMode = true,
  maxSubcategories = 10,
}: CategorySubcategorySelectorProps) {
  const { locale } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(selectedCategory ? [selectedCategory] : [])
  );
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleCategoryExpand = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (categoryKey: string) => {
    if (singleCategoryMode) {
      if (selectedCategory === categoryKey) {
        // Deselect category and clear subcategories
        onCategoryChange('');
        onSubcategoriesChange([]);
      } else {
        // Select new category and clear previous subcategories
        onCategoryChange(categoryKey);
        onSubcategoriesChange([]);
        // Auto-expand the selected category
        setExpandedCategories(new Set([categoryKey]));
      }
    } else {
      onCategoryChange(categoryKey);
    }
  };

  const handleSubcategoryToggle = (categoryKey: string, subKey: string) => {
    // In single category mode, must have the right category selected
    if (singleCategoryMode && selectedCategory !== categoryKey) {
      handleCategorySelect(categoryKey);
      onSubcategoriesChange([subKey]);
      return;
    }

    if (selectedSubcategories.includes(subKey)) {
      onSubcategoriesChange(selectedSubcategories.filter(k => k !== subKey));
    } else if (selectedSubcategories.length < maxSubcategories) {
      onSubcategoriesChange([...selectedSubcategories, subKey]);
    }
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialtyInput.trim();
    if (trimmed && !customSpecialties.includes(trimmed) && customSpecialties.length < 5 && onCustomSpecialtiesChange) {
      onCustomSpecialtiesChange([...customSpecialties, trimmed]);
      setCustomSpecialtyInput('');
    }
  };

  const removeCustomSpecialty = (specialty: string) => {
    if (onCustomSpecialtiesChange) {
      onCustomSpecialtiesChange(customSpecialties.filter(s => s !== specialty));
    }
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSpecialty();
    }
  };

  const totalSelected = selectedSubcategories.length + customSpecialties.length;

  return (
    <div className="space-y-4">
      {/* Category cards with integrated subcategories */}
      {CATEGORIES.map((category, categoryIndex) => {
        const isSelected = selectedCategory === category.key;
        const isExpanded = expandedCategories.has(category.key) || isSelected;
        const categorySubcategoryCount = selectedSubcategories.filter(sub =>
          category.subcategories.some(s => s.key === sub)
        ).length;

        return (
          <div
            key={category.key}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 animate-fade-in ${
              isSelected
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/50'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]'
            }`}
            style={{ animationDelay: `${categoryIndex * 80}ms`, animationFillMode: 'forwards' }}
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => {
                handleCategorySelect(category.key);
                if (!isExpanded) toggleCategoryExpand(category.key);
              }}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isSelected
                  ? 'bg-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20 text-white'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
              }`}>
                <CategoryIcon type={category.icon} className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-base transition-colors ${
                    isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                  }`}>
                    {locale === 'ka' ? category.nameKa : category.name}
                  </h3>
                  {categorySubcategoryCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-white text-xs font-medium">
                      {categorySubcategoryCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-1 mt-0.5">
                  {locale === 'ka' ? category.descriptionKa : category.description}
                </p>
              </div>

              {/* Expand/Collapse & Check */}
              <div className="flex items-center gap-2">
                {/* Check indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? 'bg-[var(--color-accent)] scale-100'
                    : 'bg-[var(--color-border)] scale-75 opacity-40'
                }`}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Expand button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryExpand(category.key);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </button>

            {/* Subcategories Panel */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 pt-1">
                {/* Divider */}
                <div className="h-px bg-[var(--color-border-subtle)] mb-3" />

                {/* Subcategory label */}
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
                  {locale === 'ka' ? 'სპეციალობები' : 'Specializations'}
                </p>

                {/* Subcategories Grid */}
                <div className="flex flex-wrap gap-2">
                  {category.subcategories.map((sub, subIndex) => {
                    const isSubSelected = selectedSubcategories.includes(sub.key);
                    const canSelect = isSelected || !singleCategoryMode;

                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => handleSubcategoryToggle(category.key, sub.key)}
                        disabled={!canSelect && !isSubSelected}
                        className={`group relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 animate-fade-in ${
                          isSubSelected
                            ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20'
                            : canSelect
                              ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed'
                        }`}
                        style={{ animationDelay: `${subIndex * 30}ms`, animationFillMode: 'forwards' }}
                      >
                        <span className="flex items-center gap-1.5">
                          {isSubSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === 'ka' ? sub.nameKa : sub.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Hint when category not selected */}
                {!isSelected && singleCategoryMode && (
                  <p className="mt-3 text-xs text-[var(--color-text-muted)] italic">
                    {locale === 'ka'
                      ? 'აირჩიეთ ეს კატეგორია სპეციალობების ასარჩევად'
                      : 'Select this category to choose specializations'}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Custom Specialty Section */}
      {showCustomSpecialties && selectedCategory && (
        <div className="mt-6 animate-fade-in">
          {/* Custom specialties tags */}
          {customSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customSpecialties.map((specialty, i) => (
                <div
                  key={specialty}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{specialty}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomSpecialty(specialty)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-amber-500/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom button / Input */}
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="group w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-[var(--color-text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {locale === 'ka' ? 'დაამატე საკუთარი სპეციალობა' : 'Add your own specialty'}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {locale === 'ka' ? 'ვერ იპოვე სიაში? დაწერე შენი' : "Can't find yours? Add it here"}
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)] text-sm">
                    {locale === 'ka' ? 'უნიკალური სპეციალობა' : 'Unique specialty'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customSpecialtyInput}
                  onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                  onKeyDown={handleCustomInputKeyDown}
                  placeholder={locale === 'ka' ? 'მაგ: 3D ვიზუალიზაცია, ავეჯის რესტავრაცია...' : 'e.g. 3D Visualization, Furniture restoration...'}
                  className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                  maxLength={50}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addCustomSpecialty}
                  disabled={!customSpecialtyInput.trim() || customSpecialties.length >= 5}
                  className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {locale === 'ka' ? (
                    <>
                      <span className="font-semibold">გამოირჩიე კონკურენციიდან!</span>
                      {' '}შენი უნიკალური სპეციალობა გამოჩნდება პროფილზე.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Stand out from the crowd!</span>
                      {' '}Your unique specialty will appear on your profile.
                    </>
                  )}
                </div>
              </div>

              {customSpecialties.length >= 5 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {locale === 'ka' ? 'მაქსიმუმ 5 სპეციალობა' : 'Maximum 5 specialties'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selection summary */}
      {totalSelected > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">
                {locale === 'ka'
                  ? `არჩეულია ${totalSelected} სპეციალობა`
                  : `${totalSelected} specialt${totalSelected > 1 ? 'ies' : 'y'} selected`
                }
              </p>
              {customSpecialties.length > 0 && (
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {customSpecialties.length} {locale === 'ka' ? 'უნიკალური' : 'custom'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
