"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CategoryPickerModal from "@/components/browse/CategoryPickerModal";
import { useCategories } from "@/contexts/CategoriesContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import {
  ChevronDown,
  LayoutGrid,
  MapPin,
  SlidersHorizontal,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type OpenDropdown = "city" | "rating" | "budget" | "sort" | null;

const CITIES = [
  { value: "tbilisi", labelKa: "თბილისი", labelEn: "Tbilisi", labelRu: "Тбилиси" },
  { value: "batumi", labelKa: "ბათუმი", labelEn: "Batumi", labelRu: "Батуми" },
  { value: "kutaisi", labelKa: "ქუთაისი", labelEn: "Kutaisi", labelRu: "Кутаиси" },
  { value: "rustavi", labelKa: "რუსთავი", labelEn: "Rustavi", labelRu: "Рустави" },
  { value: "gori", labelKa: "გორი", labelEn: "Gori", labelRu: "Гори" },
  { value: "zugdidi", labelKa: "ზუგდიდი", labelEn: "Zugdidi", labelRu: "Зугдиди" },
  { value: "poti", labelKa: "ფოთი", labelEn: "Poti", labelRu: "Поти" },
  { value: "kobuleti", labelKa: "კობულეთი", labelEn: "Kobuleti", labelRu: "Кобулети" },
];

const POPULAR_CITIES = ["tbilisi", "batumi", "kutaisi", "rustavi"];

const RATING_OPTIONS = [
  { value: 0, label: "browse.allRatings" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

const BUDGET_PRESETS = [
  { min: 50, max: 100, label: "50-100₾" },
  { min: 100, max: 300, label: "100-300₾" },
  { min: 300, max: 500, label: "300-500₾" },
  { min: 500, max: null, label: "500₾+" },
];

const SORT_OPTIONS = [
  { value: "recommended", key: "browse.sort.recommended" },
  { value: "rating", key: "browse.sort.rating" },
  { value: "reviews", key: "browse.sort.reviews" },
  { value: "newest", key: "browse.sort.newest" },
];

function getCityLabel(
  cityValue: string,
  locale: string,
): string {
  const city = CITIES.find((c) => c.value === cityValue);
  if (!city) return cityValue;
  if (locale === "ru") return city.labelRu;
  if (locale === "en") return city.labelEn;
  return city.labelKa;
}

interface DropdownWrapperProps {
  id: OpenDropdown;
  open: OpenDropdown;
  setOpen: (id: OpenDropdown) => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  align?: "left" | "right";
  children: React.ReactNode;
}

function DropdownWrapper({
  id,
  open,
  setOpen,
  label,
  icon,
  active,
  align = "left",
  children,
}: DropdownWrapperProps) {
  const isOpen = open === id;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    // Use click (not mousedown) so inner button onClick fires first
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isOpen, setOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : id)}
        className={[
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
          "hover:border-[#C4735B]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4735B]/30",
          isOpen || active
            ? "border-[#C4735B]/50 bg-[#C4735B]/8 text-[#C4735B]"
            : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
        ].join(" ")}
        style={
          isOpen || active
            ? { backgroundColor: "rgba(196, 115, 91, 0.08)" }
            : undefined
        }
      >
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 rounded-xl border border-[var(--color-border-subtle)] shadow-lg min-w-[220px] ${align === "right" ? "right-0" : "left-0"}`}
          style={{ background: "var(--color-bg-elevated)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function BrowseFilterBar() {
  const { t, locale } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const { categories } = useCategories();

  // Lookup any key (category, subcategory, or service) from the catalog tree
  const getLabel = useCallback((key: string): string => {
    for (const cat of categories) {
      if (cat.key === key) return locale === 'ka' ? cat.nameKa : cat.name;
      for (const sub of cat.subcategories) {
        if (sub.key === key) return locale === 'ka' ? sub.nameKa : sub.name;
        for (const svc of (sub.services ?? [])) {
          if (svc.key === key) return locale === 'ka' ? svc.nameKa : svc.name;
        }
      }
    }
    return getCategoryLabel(key);
  }, [categories, locale, getCategoryLabel]);
  const {
    selectedCity,
    setSelectedCity,
    minRating,
    setMinRating,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories,
    setSelectedSubcategories,
    hasActiveFilters,
    clearAllFilters,
  } = useBrowseContext();

  const [open, setOpen] = useState<OpenDropdown>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [draftMin, setDraftMin] = useState<string>(budgetMin?.toString() ?? "");
  const [draftMax, setDraftMax] = useState<string>(budgetMax?.toString() ?? "");

  const activeFilterCount = [
    selectedCity && selectedCity !== "all",
    minRating > 0,
    budgetMin !== null || budgetMax !== null,
    selectedCategory,
    selectedSubcategories.length > 0,
  ].filter(Boolean).length;

  const cityLabel =
    selectedCity && selectedCity !== "all"
      ? getCityLabel(selectedCity, locale)
      : t("browse.allCities");

  const ratingLabel =
    minRating > 0 ? `${minRating}+` : t("browse.allRatings");

  const budgetLabel =
    budgetMin !== null || budgetMax !== null
      ? budgetMax === null
        ? `${budgetMin}₾+`
        : `${budgetMin ?? 0}-${budgetMax}₾`
      : t("browse.budget");

  const currentSortOption = SORT_OPTIONS.find((o) => o.value === sortBy);
  const sortLabel = currentSortOption
    ? t(currentSortOption.key)
    : t("browse.sort.recommended");

  function applyBudget() {
    const min = draftMin ? parseInt(draftMin, 10) : null;
    const max = draftMax ? parseInt(draftMax, 10) : null;
    setBudgetMin(isNaN(min as number) ? null : min);
    setBudgetMax(isNaN(max as number) ? null : max);
    setOpen(null);
  }

  function clearBudget() {
    setDraftMin("");
    setDraftMax("");
    setBudgetMin(null);
    setBudgetMax(null);
  }

  function selectBudgetPreset(min: number, max: number | null) {
    setDraftMin(min.toString());
    setDraftMax(max?.toString() ?? "");
    setBudgetMin(min);
    setBudgetMax(max);
  }

  const isBudgetPresetActive = (min: number, max: number | null) =>
    budgetMin === min && budgetMax === max;

  function handleCategoryApply(keys: string[]) {
    setSelectedSubcategories(keys);
    // Derive the parent category if all selected keys belong to one category
    if (keys.length === 0) {
      setSelectedCategory(null);
      return;
    }
    const parentCats = new Set<string>();
    for (const key of keys) {
      for (const cat of categories) {
        const found = cat.subcategories.some(
          sub => sub.key === key || (sub.services ?? []).some(svc => svc.key === key)
        );
        if (found) { parentCats.add(cat.key); break; }
      }
    }
    setSelectedCategory(parentCats.size === 1 ? Array.from(parentCats)[0] : null);
  }

  const categoryButtonActive = selectedSubcategories.length > 0;
  const categoryButtonLabel = categoryButtonActive
    ? `${t('browse.category')} (${selectedSubcategories.length})`
    : t('browse.category');

  return (
    <div className="mb-2">
      <CategoryPickerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        selectedKeys={selectedSubcategories}
        onApply={handleCategoryApply}
        activeCategory={selectedCategory ?? undefined}
      />

      {/* Desktop filter bar */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Category picker button */}
        <button
          type="button"
          onClick={() => setCategoryModalOpen(true)}
          className={[
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
            "hover:border-[#C4735B]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4735B]/30",
            categoryButtonActive
              ? "border-[#C4735B]/50 text-[#C4735B]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
          ].join(" ")}
          style={categoryButtonActive ? { backgroundColor: "rgba(196, 115, 91, 0.08)" } : undefined}
        >
          <span className="opacity-70"><LayoutGrid className="w-3.5 h-3.5" /></span>
          <span>{categoryButtonLabel}</span>
        </button>

        {/* City */}
        <DropdownWrapper
          id="city"
          open={open}
          setOpen={setOpen}
          label={cityLabel}
          icon={<MapPin className="w-3.5 h-3.5" />}
          active={!!selectedCity && selectedCity !== "all"}
        >
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSelectedCity(v);
                    setOpen(null);
                  }}
                  className={[
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    selectedCity === v
                      ? "bg-[#C4735B] border-[#C4735B] text-white"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[#C4735B]/40",
                  ].join(" ")}
                >
                  {getCityLabel(v, locale)}
                </button>
              ))}
            </div>
            <div className="border-t border-[var(--color-border-subtle)] pt-2 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("all");
                  setOpen(null);
                }}
                className={[
                  "w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                  !selectedCity || selectedCity === "all"
                    ? "text-[#C4735B] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                ].join(" ")}
              >
                {t("browse.allCities")}
              </button>
              {CITIES.filter((c) => !POPULAR_CITIES.includes(c.value)).map(
                (city) => (
                  <button
                    key={city.value}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city.value);
                      setOpen(null);
                    }}
                    className={[
                      "w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                      selectedCity === city.value
                        ? "text-[#C4735B] font-medium"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                    ].join(" ")}
                  >
                    {getCityLabel(city.value, locale)}
                  </button>
                ),
              )}
            </div>
          </div>
        </DropdownWrapper>

        {/* Rating */}
        <DropdownWrapper
          id="rating"
          open={open}
          setOpen={setOpen}
          label={ratingLabel}
          icon={<Star className="w-3.5 h-3.5" />}
          active={minRating > 0}
        >
          <div className="p-3 flex flex-wrap gap-1.5">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setMinRating(opt.value);
                  setOpen(null);
                }}
                className={[
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  minRating === opt.value
                    ? "bg-[#C4735B] border-[#C4735B] text-white"
                    : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[#C4735B]/40",
                ].join(" ")}
              >
                {opt.value > 0 && <Star className="w-3 h-3 fill-current" />}
                {opt.value === 0 ? t(opt.label) : opt.label}
              </button>
            ))}
          </div>
        </DropdownWrapper>

        {/* Budget */}
        <DropdownWrapper
          id="budget"
          open={open}
          setOpen={setOpen}
          label={budgetLabel}
          icon={<Wallet className="w-3.5 h-3.5" />}
          active={budgetMin !== null || budgetMax !== null}
        >
          <div className="p-3 space-y-3 w-64">
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectBudgetPreset(preset.min, preset.max)}
                  className={[
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    isBudgetPresetActive(preset.min, preset.max)
                      ? "bg-[#C4735B] border-[#C4735B] text-white"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[#C4735B]/40",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder={t("browse.min")}
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#C4735B]/50"
              />
              <span className="text-[var(--color-text-tertiary)] text-sm">—</span>
              <input
                type="number"
                placeholder={t("browse.max")}
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#C4735B]/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearBudget}
                className="flex-1 text-xs"
              >
                {t("browse.clearFilter")}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={applyBudget}
                className="flex-1 text-xs bg-[#C4735B] hover:bg-[#B5624A] text-white border-0"
              >
                {t("browse.applyFilters")}
              </Button>
            </div>
          </div>
        </DropdownWrapper>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <DropdownWrapper
          id="sort"
          open={open}
          setOpen={setOpen}
          label={sortLabel}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          active={!!sortBy && sortBy !== "recommended"}
          align="right"
        >
          <div className="py-1.5 w-52">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortBy(opt.value);
                  setOpen(null);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  sortBy === opt.value || (!sortBy && opt.value === "recommended")
                    ? "text-[#C4735B] font-medium bg-[#C4735B]/5"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                ].join(" ")}
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        </DropdownWrapper>
      </div>

      {/* Mobile: sticky filters button */}
      <div className="flex lg:hidden items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoryModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-sm font-medium text-[var(--color-text-primary)]"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t("browse.filters")}</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C4735B] text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort on mobile */}
        <div className="flex-1" />
        <DropdownWrapper
          id="sort"
          open={open}
          setOpen={setOpen}
          label={sortLabel}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          active={!!sortBy && sortBy !== "recommended"}
          align="right"
        >
          <div className="py-1.5 w-52">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortBy(opt.value);
                  setOpen(null);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  sortBy === opt.value || (!sortBy && opt.value === "recommended")
                    ? "text-[#C4735B] font-medium bg-[#C4735B]/5"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                ].join(" ")}
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        </DropdownWrapper>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {selectedCity && selectedCity !== "all" && (
            <ActivePill
              label={getCityLabel(selectedCity, locale)}
              onRemove={() => setSelectedCity("all")}
            />
          )}
          {minRating > 0 && (
            <ActivePill
              label={`${t("browse.rating")} ${minRating}+`}
              onRemove={() => setMinRating(0)}
            />
          )}
          {(budgetMin !== null || budgetMax !== null) && (
            <ActivePill
              label={budgetLabel}
              onRemove={clearBudget}
            />
          )}
          {selectedSubcategories.map((sub) => (
            <ActivePill
              key={sub}
              label={getLabel(sub)}
              onRemove={() => {
                const remaining = selectedSubcategories.filter((s) => s !== sub);
                setSelectedSubcategories(remaining);
                if (remaining.length === 0) {
                  setSelectedCategory(null);
                }
              }}
            />
          ))}
          {activeFilterCount >= 2 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#C4735B] hover:underline font-medium ml-1"
            >
              {t("browse.clearAll")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActivePill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="default"
      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-[#C4735B]/30 text-[#C4735B] cursor-default"
      style={{ background: "rgba(196,115,91,0.10)" }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full hover:bg-[#C4735B]/20 transition-colors p-0.5"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}
