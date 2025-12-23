'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';

interface CategoriesStepProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
}

export default function CategoriesStep({
  selectedCategories,
  selectedSubcategories,
  onCategoriesChange,
  onSubcategoriesChange,
}: CategoriesStepProps) {
  const { locale } = useLanguage();

  const isComplete = selectedCategories.length > 0 && selectedSubcategories.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {locale === 'ka' ? 'სერვისები' : 'Services'}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          {locale === 'ka' ? 'რა სერვისებს სთავაზობ?' : 'What services do you provide?'}
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
          {locale === 'ka'
            ? 'აირჩიე შენი ძირითადი პროფესია და კონკრეტული უნარები'
            : 'Select your primary profession and the specific skills you offer to clients'}
        </p>
      </div>

      {/* Category Selection Card */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
              {locale === 'ka' ? '1. აირჩიე მთავარი კატეგორია' : '1. Choose Main Category'}
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'მაქსიმუმ 4 კატეგორია' : 'Maximum 4 categories'}
            </p>
          </div>
          {selectedCategories.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#E07B4F]/10 text-[#E07B4F]">
              {selectedCategories.length} {locale === 'ka' ? 'არჩეული' : 'selected'}
            </span>
          )}
        </div>

        <CategorySubcategorySelector
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
          onCategoriesChange={onCategoriesChange}
          onSubcategoriesChange={onSubcategoriesChange}
          singleCategoryMode={false}
          maxCategories={4}
          maxSubcategories={10}
        />
      </div>

      {/* Skills Summary Card */}
      {selectedSubcategories.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                {locale === 'ka'
                  ? `${selectedSubcategories.length} უნარი არჩეულია`
                  : `${selectedSubcategories.length} skill${selectedSubcategories.length > 1 ? 's' : ''} selected`}
              </h4>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                {locale === 'ka'
                  ? 'კლიენტები შეძლებენ გიპოვონ ამ უნარების მიხედვით'
                  : 'Clients will be able to find you by these skills'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guidance Card */}
      <div className="bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 rounded-2xl p-5 border border-[#E07B4F]/10">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#E07B4F]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-[#E07B4F] mb-1">
              {locale === 'ka' ? 'როგორ ავირჩიო სწორად?' : 'How to choose correctly?'}
            </h4>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-[#E07B4F] mt-0.5">•</span>
                {locale === 'ka'
                  ? 'აირჩიე მხოლოდ ის სერვისები რომლებსაც რეალურად ასრულებ'
                  : 'Select only services you actually perform'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E07B4F] mt-0.5">•</span>
                {locale === 'ka'
                  ? 'მეტი უნარი = მეტი ხილვადობა ძიებაში'
                  : 'More skills = more visibility in search'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E07B4F] mt-0.5">•</span>
                {locale === 'ka'
                  ? 'შეგიძლია მოგვიანებით დაამატო ან წაშალო'
                  : 'You can add or remove them later'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
