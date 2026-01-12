'use client';

import { CategorySelector } from '@/components/categories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Input } from '@/components/ui/input';
import { Briefcase, Plus, X } from 'lucide-react';
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import type { FormData } from '../hooks/useRegistration';

interface Category {
  key: string;
  name: string;
  nameKa: string;
  subcategories: Array<{
    key: string;
    name: string;
    nameKa: string;
  }>;
}

export interface CategoryStepProps {
  locale: string;
  categories: Category[];
  formData: FormData;
  handleCategoryToggle: (categoryKey: string) => void;
  handleSubcategoryToggle: (subcategoryKey: string) => void;
  customServices: string[];
  setCustomServices: React.Dispatch<React.SetStateAction<string[]>>;
  newCustomService: string;
  setNewCustomService: (value: string) => void;
}

export default function StepCategory({
  locale,
  categories,
  formData,
  handleCategoryToggle,
  handleSubcategoryToggle,
  customServices,
  setCustomServices,
  newCustomService,
  setNewCustomService,
}: CategoryStepProps) {
  const { t } = useLanguage();
  const addCustomService = () => {
    if (newCustomService.trim() && customServices.length < 5) {
      setCustomServices(prev => [...prev, newCustomService.trim()]);
      setNewCustomService('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
          {t('register.whatServicesDoYouProvide')}
        </h1>
        <p className="text-sm text-neutral-500">
          {t('register.selectYourProfessionAndSkills')}
        </p>
      </div>

      {/* Category & Subcategory Selection */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          1. {t('register.categorySkills')} <span className="text-[#C4735B]">*</span>
        </h2>
        <CategorySelector
          mode="multi"
          selectedCategories={formData.selectedCategories}
          selectedSubcategories={formData.selectedSubcategories}
          onCategoriesChange={(cats) => {
            // Sync with existing toggle logic
            const added = cats.filter(c => !formData.selectedCategories.includes(c));
            const removed = formData.selectedCategories.filter(c => !cats.includes(c));
            added.forEach(handleCategoryToggle);
            removed.forEach(handleCategoryToggle);
          }}
          onSubcategoriesChange={(subs) => {
            // Sync with existing toggle logic
            const added = subs.filter(s => !formData.selectedSubcategories.includes(s));
            const removed = formData.selectedSubcategories.filter(s => !subs.includes(s));
            added.forEach(handleSubcategoryToggle);
            removed.forEach(handleSubcategoryToggle);
          }}
          maxCategories={4}
          maxSubcategories={10}
        />
      </div>

      {/* Custom Services */}
      {formData.selectedCategories.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <IconBadge icon={Briefcase} variant="accent" size="sm" />
              3. {t('common.services')}
              <span className="text-neutral-400 font-normal text-[10px]">({t('common.optional')})</span>
            </h2>
            {customServices.length > 0 && (
              <Badge variant="premium" size="sm">
                {customServices.length}/5
              </Badge>
            )}
          </div>

          <p className="text-xs text-neutral-500 mb-3">
            {t('register.writeWhatServicesYouOffer')}
          </p>

          {/* Added custom services */}
          {customServices.length > 0 && (
            <div className="space-y-2 mb-3">
              {customServices.map((service, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[#C4735B]/5 border border-[#C4735B]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C4735B] flex-shrink-0" />
                  <span className="flex-1 text-sm text-neutral-900">{service}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCustomServices(prev => prev.filter((_, i) => i !== index))}
                    className="w-6 h-6 text-neutral-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new service input */}
          {customServices.length < 5 && (
            <div className="flex gap-2">
              <Input
                type="text"
                value={newCustomService}
                onChange={(e) => setNewCustomService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCustomService.trim()) {
                    e.preventDefault();
                    addCustomService();
                  }
                }}
                placeholder={t('register.egInteriorDesign')}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addCustomService}
                disabled={!newCustomService.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
