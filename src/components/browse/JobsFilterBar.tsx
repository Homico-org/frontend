"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CategoryPickerModal from "@/components/browse/CategoryPickerModal";
import { useCategories } from "@/contexts/CategoriesContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChevronDown,
  LayoutGrid,
  MapPin,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type OpenDropdown = "location" | "budget" | "sort" | null;

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

const BUDGET_PRESETS = [
  { min: 50, max: 100, label: "50-100₾" },
  { min: 100, max: 300, label: "100-300₾" },
  { min: 300, max: 500, label: "300-500₾" },
  { min: 500, max: null, label: "500₾+" },
];

const SORT_OPTIONS = [
  { value: "newest", key: "browse.sort.newest" },
  { value: "oldest", key: "browse.oldest" },
  { value: "budget-high", key: "browse.sort.budgetHigh" },
  { value: "budget-low", key: "browse.sort.budgetLow" },
];

function getCityLabel(cityValue: string, locale: string): string {
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

function DropdownWrapper({ id, open, setOpen, label, icon, active, align = "left", children }: DropdownWrapperProps) {
  const isOpen = open === id;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
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
            ? "border-[#C4735B]/50 text-[#C4735B]"
            : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
        ].join(" ")}
        style={isOpen || active ? { backgroundColor: "rgba(196, 115, 91, 0.08)" } : undefined}
      >
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge
      variant="default"
      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-[#C4735B]/30 text-[#C4735B] cursor-default"
      style={{ background: "rgba(196,115,91,0.10)" }}
    >
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 rounded-full hover:bg-[#C4735B]/20 transition-colors p-0.5">
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

export default function JobsFilterBar() {
  const { t, locale } = useLanguage();
  const { categories } = useCategories();
  const { filters, setFilters } = useJobsContext();

  const [open, setOpen] = useState<OpenDropdown>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [draftMin, setDraftMin] = useState<string>(filters.budgetMin?.toString() ?? "");
  const [draftMax, setDraftMax] = useState<string>(filters.budgetMax?.toString() ?? "");

  // Label lookup from category tree
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
    return key;
  }, [categories, locale]);

  const hasActiveFilters =
    (filters.location && filters.location !== "all") ||
    filters.budgetMin !== null ||
    filters.budgetMax !== null ||
    filters.subcategories.length > 0;

  const activeFilterCount = [
    filters.location && filters.location !== "all",
    filters.budgetMin !== null || filters.budgetMax !== null,
    filters.subcategories.length > 0,
  ].filter(Boolean).length;

  const locationLabel = filters.location && filters.location !== "all"
    ? getCityLabel(filters.location, locale)
    : t("browse.allCities");

  const budgetLabel = filters.budgetMin !== null || filters.budgetMax !== null
    ? filters.budgetMax === null
      ? `${filters.budgetMin}₾+`
      : `${filters.budgetMin ?? 0}-${filters.budgetMax}₾`
    : t("browse.budget");

  const categoryButtonActive = filters.subcategories.length > 0;
  const categoryButtonLabel = categoryButtonActive
    ? `${t('browse.category')} (${filters.subcategories.length})`
    : t('browse.category');

  function handleCategoryApply(keys: string[]) {
    const parentCats = new Set<string>();
    for (const key of keys) {
      for (const cat of categories) {
        const found = cat.subcategories.some(
          sub => sub.key === key || (sub.services ?? []).some(svc => svc.key === key)
        );
        if (found) { parentCats.add(cat.key); break; }
      }
    }
    setFilters({
      ...filters,
      subcategories: keys,
      subcategory: keys[0] ?? null,
      category: parentCats.size === 1 ? Array.from(parentCats)[0] : null,
    });
  }

  function applyBudget() {
    const min = draftMin ? parseInt(draftMin, 10) : null;
    const max = draftMax ? parseInt(draftMax, 10) : null;
    setFilters({
      ...filters,
      budgetMin: isNaN(min as number) ? null : min,
      budgetMax: isNaN(max as number) ? null : max,
    });
    setOpen(null);
  }

  function clearBudget() {
    setDraftMin("");
    setDraftMax("");
    setFilters({ ...filters, budgetMin: null, budgetMax: null });
  }

  function selectBudgetPreset(min: number, max: number | null) {
    setDraftMin(min.toString());
    setDraftMax(max?.toString() ?? "");
    setFilters({ ...filters, budgetMin: min, budgetMax: max });
  }

  function clearAllFilters() {
    setFilters({
      ...filters,
      category: null,
      subcategory: null,
      subcategories: [],
      budgetMin: null,
      budgetMax: null,
      location: "all",
    });
    setDraftMin("");
    setDraftMax("");
  }

  const isBudgetPresetActive = (min: number, max: number | null) =>
    filters.budgetMin === min && filters.budgetMax === max;

  return (
    <div className="mb-2">
      <CategoryPickerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        selectedKeys={filters.subcategories}
        onApply={handleCategoryApply}
        activeCategory={filters.category ?? undefined}
      />

      {/* Desktop filter bar */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Category */}
        <button
          type="button"
          onClick={() => setCategoryModalOpen(true)}
          className={[
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
            "hover:border-[#C4735B]/40",
            categoryButtonActive
              ? "border-[#C4735B]/50 text-[#C4735B]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
          ].join(" ")}
          style={categoryButtonActive ? { backgroundColor: "rgba(196, 115, 91, 0.08)" } : undefined}
        >
          <span className="opacity-70"><LayoutGrid className="w-3.5 h-3.5" /></span>
          <span>{categoryButtonLabel}</span>
        </button>

        {/* Location */}
        <DropdownWrapper
          id="location"
          open={open}
          setOpen={setOpen}
          label={locationLabel}
          icon={<MapPin className="w-3.5 h-3.5" />}
          active={!!filters.location && filters.location !== "all"}
        >
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setFilters({ ...filters, location: v }); setOpen(null); }}
                  className={[
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    filters.location === v
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
                onClick={() => { setFilters({ ...filters, location: "all" }); setOpen(null); }}
                className={[
                  "w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                  !filters.location || filters.location === "all"
                    ? "text-[#C4735B] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                ].join(" ")}
              >
                {t("browse.allCities")}
              </button>
              {CITIES.filter((c) => !POPULAR_CITIES.includes(c.value)).map((city) => (
                <button
                  key={city.value}
                  type="button"
                  onClick={() => { setFilters({ ...filters, location: city.value }); setOpen(null); }}
                  className={[
                    "w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                    filters.location === city.value
                      ? "text-[#C4735B] font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]",
                  ].join(" ")}
                >
                  {getCityLabel(city.value, locale)}
                </button>
              ))}
            </div>
          </div>
        </DropdownWrapper>

        {/* Budget */}
        <DropdownWrapper
          id="budget"
          open={open}
          setOpen={setOpen}
          label={budgetLabel}
          icon={<Wallet className="w-3.5 h-3.5" />}
          active={filters.budgetMin !== null || filters.budgetMax !== null}
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
              <Button variant="ghost" size="sm" onClick={clearBudget} className="flex-1 text-xs">
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

        <div className="flex-1" />

        {/* Sort */}
        <DropdownWrapper
          id="sort"
          open={open}
          setOpen={setOpen}
          label={SORT_OPTIONS.find(o => o.value === filters.sort)
            ? t(SORT_OPTIONS.find(o => o.value === filters.sort)!.key)
            : t("browse.sortBy")}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          active={!!filters.sort && filters.sort !== "newest"}
          align="right"
        >
          <div className="py-1.5 w-52">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setFilters({ ...filters, sort: opt.value });
                  setOpen(null);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  filters.sort === opt.value
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

      {/* Mobile */}
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
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {filters.location && filters.location !== "all" && (
            <ActivePill
              label={getCityLabel(filters.location, locale)}
              onRemove={() => setFilters({ ...filters, location: "all" })}
            />
          )}
          {(filters.budgetMin !== null || filters.budgetMax !== null) && (
            <ActivePill label={budgetLabel} onRemove={clearBudget} />
          )}
          {filters.subcategories.map((sub) => (
            <ActivePill
              key={sub}
              label={getLabel(sub)}
              onRemove={() => setFilters({
                ...filters,
                subcategories: filters.subcategories.filter((s) => s !== sub),
                subcategory: filters.subcategories.filter((s) => s !== sub)[0] ?? null,
              })}
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
