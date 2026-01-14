'use client';

import { Input } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, ChevronDown, Search, X, Briefcase } from 'lucide-react';
import { useState, useMemo } from 'react';

export type ExperienceLevel = '1-2' | '3-5' | '5-10' | '10+';

export interface SelectedService {
  key: string;
  name: string;
  nameKa: string;
  categoryKey: string;
  experience: ExperienceLevel;
}

interface StepSelectServicesProps {
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  isLoading?: boolean;
}

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; labelEn: string; labelKa: string }[] = [
  { value: '1-2', labelEn: '1-2 years', labelKa: '1-2 წელი' },
  { value: '3-5', labelEn: '3-5 years', labelKa: '3-5 წელი' },
  { value: '5-10', labelEn: '5-10 years', labelKa: '5-10 წელი' },
  { value: '10+', labelEn: '10+ years', labelKa: '10+ წელი' },
];

export default function StepSelectServices({
  selectedServices,
  onServicesChange,
}: StepSelectServicesProps) {
  const { t, locale } = useLanguage();
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Flatten all subcategories for search
  const allServices = useMemo(() => {
    const services: { key: string; name: string; nameKa: string; categoryKey: string; categoryName: string; categoryNameKa: string }[] = [];
    
    categories.forEach(category => {
      category.subcategories.forEach(sub => {
        services.push({
          key: sub.key,
          name: sub.name,
          nameKa: sub.nameKa,
          categoryKey: category.key,
          categoryName: category.name,
          categoryNameKa: category.nameKa,
        });
        
        // Also add children if any
        if (sub.children) {
          sub.children.forEach(child => {
            services.push({
              key: child.key,
              name: child.name,
              nameKa: child.nameKa,
              categoryKey: category.key,
              categoryName: category.name,
              categoryNameKa: category.nameKa,
            });
          });
        }
      });
    });
    
    return services;
  }, [categories]);

  // Filter services by search
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return allServices;
    
    const query = searchQuery.toLowerCase();
    return allServices.filter(
      s => s.name.toLowerCase().includes(query) || 
           s.nameKa.toLowerCase().includes(query) ||
           s.categoryName.toLowerCase().includes(query) ||
           s.categoryNameKa.toLowerCase().includes(query)
    );
  }, [allServices, searchQuery]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, typeof filteredServices> = {};
    
    filteredServices.forEach(service => {
      if (!groups[service.categoryKey]) {
        groups[service.categoryKey] = [];
      }
      groups[service.categoryKey].push(service);
    });
    
    return groups;
  }, [filteredServices]);

  const isSelected = (key: string) => selectedServices.some(s => s.key === key);

  const toggleService = (service: typeof allServices[0]) => {
    if (isSelected(service.key)) {
      onServicesChange(selectedServices.filter(s => s.key !== service.key));
    } else {
      onServicesChange([
        ...selectedServices,
        {
          key: service.key,
          name: service.name,
          nameKa: service.nameKa,
          categoryKey: service.categoryKey,
          experience: '3-5', // Default experience
        },
      ]);
      setExpandedService(service.key); // Expand to show experience selector
    }
  };

  const updateExperience = (key: string, experience: ExperienceLevel) => {
    onServicesChange(
      selectedServices.map(s => 
        s.key === key ? { ...s, experience } : s
      )
    );
    setExpandedService(null);
  };

  const removeService = (key: string) => {
    onServicesChange(selectedServices.filter(s => s.key !== key));
  };

  const canProceed = selectedServices.length > 0;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-[#C4735B]" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('register.whatServicesDoYouOffer')}
        </h1>
        <p className="text-neutral-500">
          {t('register.selectServicesDescription')}
        </p>
      </div>

      {/* Selected Services */}
      {selectedServices.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {selectedServices.map(service => (
              <div
                key={service.key}
                className="group relative"
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                    expandedService === service.key
                      ? 'border-[#C4735B] bg-[#C4735B]/5'
                      : 'border-[#C4735B]/30 bg-[#C4735B]/5'
                  }`}
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {locale === 'ka' ? service.nameKa : service.name}
                  </span>
                  <button
                    onClick={() => setExpandedService(expandedService === service.key ? null : service.key)}
                    className="flex items-center gap-1 text-xs text-[#C4735B] font-medium hover:text-[#A85D47]"
                  >
                    {EXPERIENCE_OPTIONS.find(e => e.value === service.experience)?.[locale === 'ka' ? 'labelKa' : 'labelEn']}
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedService === service.key ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => removeService(service.key)}
                    className="w-5 h-5 rounded-full bg-neutral-200 hover:bg-red-100 text-neutral-500 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Experience dropdown */}
                {expandedService === service.key && (
                  <div className="absolute top-full left-0 mt-1 z-10 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden min-w-[140px]">
                    {EXPERIENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateExperience(service.key, opt.value)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors ${
                          service.experience === opt.value ? 'bg-[#C4735B]/5 text-[#C4735B] font-medium' : 'text-neutral-700'
                        }`}
                      >
                        {locale === 'ka' ? opt.labelKa : opt.labelEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug info - remove later */}
      {process.env.NODE_ENV === 'development' && categories.length === 0 && !categoriesLoading && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          ⚠️ No categories loaded. Check if /categories API is working.
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('register.searchServices')}
          className="pl-11"
        />
      </div>

      {/* Services List - Grouped by Category */}
      <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-neutral-200">
        {categoriesLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#C4735B] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-400 mt-2">{t('common.loading')}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            {t('common.noResults')}
          </div>
        ) : (
          Object.entries(groupedServices).map(([categoryKey, services]) => {
            const categoryName = locale === 'ka' ? services[0].categoryNameKa : services[0].categoryName;
            return (
              <div key={categoryKey}>
                {/* Category Header */}
                <div className="sticky top-0 px-4 py-2 bg-neutral-100 border-b border-neutral-200">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {categoryName}
                  </p>
                </div>
                {/* Services in this category */}
                <div className="divide-y divide-neutral-100">
                  {services.map(service => {
                    const selected = isSelected(service.key);
                    return (
                      <button
                        key={service.key}
                        onClick={() => toggleService(service)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                          selected ? 'bg-[#C4735B]/5' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <p className={`text-sm font-medium ${selected ? 'text-[#C4735B]' : 'text-neutral-900'}`}>
                          {locale === 'ka' ? service.nameKa : service.name}
                        </p>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          selected 
                            ? 'border-[#C4735B] bg-[#C4735B]' 
                            : 'border-neutral-300'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Counter */}
      <p className="text-center text-sm text-neutral-400 mt-4">
        {selectedServices.length} {t('register.servicesSelected')}
      </p>
    </div>
  );
}
