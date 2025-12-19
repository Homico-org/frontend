'use client';

import { CATEGORIES } from '@/constants/categories';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, MapPin } from 'lucide-react';
import { useState } from 'react';

// Muted terracotta color
const ACCENT_COLOR = '#C4735B';

// Georgian cities
const CITIES = [
  { value: 'tbilisi', label: 'Tbilisi', labelKa: 'თბილისი' },
  { value: 'batumi', label: 'Batumi', labelKa: 'ბათუმი' },
  { value: 'kutaisi', label: 'Kutaisi', labelKa: 'ქუთაისი' },
  { value: 'rustavi', label: 'Rustavi', labelKa: 'რუსთავი' },
  { value: 'zugdidi', label: 'Zugdidi', labelKa: 'ზუგდიდი' },
];

// Category options matching the design exactly
const CATEGORY_OPTIONS = [
  { key: 'renovation', label: 'Renovation', labelKa: 'რემონტი' },
  { key: 'interior-design', label: 'Interior Design', labelKa: 'ინტერიერის დიზაინი' },
  { key: 'plumbing', label: 'Plumbing', labelKa: 'სანტექნიკა' },
  { key: 'electrical', label: 'Electrician', labelKa: 'ელექტრიკოსი' },
  { key: 'cleaning', label: 'Cleaning', labelKa: 'დასუფთავება' },
];

interface BrowseFiltersSidebarProps {
  showRatingFilter?: boolean;
  showBudgetFilter?: boolean;
  showSearch?: boolean;
}

export default function BrowseFiltersSidebar({
  showBudgetFilter = true,
}: BrowseFiltersSidebarProps) {
  const { locale } = useLanguage();
  const {
    selectedCategory,
    setSelectedCategory,
    setSelectedSubcategory,
    selectedCity,
    setSelectedCity,
  } = useBrowseContext();

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [budgetValue, setBudgetValue] = useState(2500);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleCategoryToggle = (key: string) => {
    if (selectedCategory === key) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(key);
      setSelectedSubcategory(null);
    }
  };

  const selectedCityData = CITIES.find(c => c.value === selectedCity);
  const displayCategories: Array<{ key: string; label?: string; labelKa?: string; name?: string; nameKa?: string }> =
    showAllCategories ? CATEGORIES : CATEGORY_OPTIONS;

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="p-5 space-y-6">

        {/* Location Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {locale === 'ka' ? 'მდებარეობა' : 'Location'}
            </span>
            <MapPin className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
          </div>

          {/* City Dropdown - matching design */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              <span>{locale === 'ka' ? selectedCityData?.labelKa : selectedCityData?.label}</span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCityDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 overflow-hidden">
                {CITIES.map(city => (
                  <button
                    key={city.value}
                    onClick={() => {
                      setSelectedCity(city.value);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      selectedCity === city.value
                        ? 'bg-neutral-50 dark:bg-neutral-700 font-medium'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    } text-neutral-900 dark:text-white`}
                  >
                    {locale === 'ka' ? city.labelKa : city.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Categories Section - matching design with circle checkboxes */}
        <div>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            {locale === 'ka' ? 'კატეგორიები' : 'Categories'}
          </h3>

          <div className="space-y-2.5">
            {displayCategories.map(category => {
              const key = category.key;
              const label = locale === 'ka'
                ? (category.labelKa || category.nameKa || '')
                : (category.label || category.name || key);
              const isSelected = selectedCategory === key;

              return (
                <button
                  key={key}
                  onClick={() => handleCategoryToggle(key)}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  {/* Circle Checkbox - matching design */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? ''
                        : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400'
                    }`}
                    style={isSelected ? { borderColor: ACCENT_COLOR, backgroundColor: ACCENT_COLOR } : {}}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* See all categories link - terracotta color */}
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="mt-3 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: ACCENT_COLOR }}
          >
            {showAllCategories
              ? (locale === 'ka' ? 'ნაკლების ჩვენება' : 'Show less')
              : (locale === 'ka' ? 'ყველა კატეგორიის ნახვა' : 'See all categories')
            }
          </button>
        </div>

        {/* Budget Range Section - matching design */}
        {showBudgetFilter && (
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">
              {locale === 'ka' ? 'ბიუჯეტის დიაპაზონი' : 'Budget Range'}
            </h3>

            {/* Custom Range Slider */}
            <div className="relative">
              {/* Track background */}
              <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                {/* Filled track */}
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((budgetValue - 100) / 4900) * 100}%`,
                    backgroundColor: ACCENT_COLOR
                  }}
                />
              </div>

              {/* Slider input */}
              <input
                type="range"
                min="100"
                max="5000"
                value={budgetValue}
                onChange={(e) => setBudgetValue(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
              />

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 pointer-events-none"
                style={{
                  left: `calc(${((budgetValue - 100) / 4900) * 100}% - 8px)`,
                  borderColor: ACCENT_COLOR
                }}
              />
            </div>

            {/* Range Labels */}
            <div className="flex items-center justify-between mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              <span>100₾</span>
              <span>5000₾+</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
