"use client";

import { CategorySelector } from "@/components/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconBadge } from "@/components/ui/IconBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, X, Briefcase } from "lucide-react";
import { useState } from "react";

interface CategoriesStepProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
  customServices?: string[];
  onCustomServicesChange?: (services: string[]) => void;
}

export default function CategoriesStep({
  selectedCategories,
  selectedSubcategories,
  onCategoriesChange,
  onSubcategoriesChange,
  customServices = [],
  onCustomServicesChange,
}: CategoriesStepProps) {
  const { locale } = useLanguage();
  const [newCustomService, setNewCustomService] = useState("");

  const handleAddCustomService = () => {
    if (newCustomService.trim() && customServices.length < 5 && onCustomServicesChange) {
      onCustomServicesChange([...customServices, newCustomService.trim()]);
      setNewCustomService("");
    }
  };

  const handleRemoveCustomService = (index: number) => {
    if (onCustomServicesChange) {
      onCustomServicesChange(customServices.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Category & Subcategory Selection */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          1. {locale === "ka" ? "კატეგორია და უნარები" : "Category & Skills"} <span className="text-[#C4735B]">*</span>
        </h2>
        <CategorySelector
          mode="multi"
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
          onCategoriesChange={onCategoriesChange}
          onSubcategoriesChange={onSubcategoriesChange}
          maxCategories={4}
          maxSubcategories={10}
        />
      </div>

      {/* Custom Services */}
      {selectedCategories.length > 0 && onCustomServicesChange && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <IconBadge icon={Briefcase} variant="accent" size="sm" />
              2. {locale === "ka" ? "სერვისები" : "Services"}
              <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
            </h2>
            {customServices.length > 0 && (
              <Badge variant="accent" size="sm">
                {customServices.length}/5
              </Badge>
            )}
          </div>

          <p className="text-xs text-neutral-500 mb-3">
            {locale === "ka"
              ? "ჩაწერე რა სერვისებს სთავაზობ კლიენტებს (მაქს. 5)"
              : "Write what services you offer to clients (max 5)"}
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
                    onClick={() => handleRemoveCustomService(index)}
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
                  if (e.key === "Enter" && newCustomService.trim()) {
                    e.preventDefault();
                    handleAddCustomService();
                  }
                }}
                placeholder={locale === "ka" ? "მაგ: ინტერიერის დიზაინი" : "e.g: Interior design"}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddCustomService}
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
