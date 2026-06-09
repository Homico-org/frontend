"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryScroller from "@/components/browse/CategoryScroller";
import { useCategories } from "@/contexts/CategoriesContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useMarketplaceCountry } from "@/hooks/useCountry";
import { currencySymbol } from "@/utils/currency";
import { cityRecordsFor, popularCityValuesFor } from "@/data/cities";
import { useAiServiceSearch } from "@/hooks/useAiServiceSearch";
import {
  ChevronDown,
  Handshake,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type OpenDropdown = "city" | "rating" | "budget" | "sort" | null;

// Per-country city tables resolved at render time via `cityRecordsFor`
// and `popularCityValuesFor` so a /fr visitor sees Paris/Marseille and
// a /us visitor sees New York/LA. Hardcoded GE-only lists were the
// 2026-05 bug behind "All cities" showing Georgian cities on /fr.

const RATING_OPTIONS = [
  { value: 0, label: "browse.allRatings" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

// Budget brackets are nominal numbers in the marketplace's local
// currency; rebuilt with the active symbol on each render.
const BUDGET_PRESET_RANGES = [
  { min: 50, max: 100 },
  { min: 100, max: 300 },
  { min: 300, max: 500 },
  { min: 500, max: null as number | null },
];

const SORT_OPTIONS = [
  { value: "recommended", key: "browse.sort.recommended" },
  { value: "badges", key: "browse.sort.badges" },
  { value: "rating", key: "browse.sort.rating" },
  { value: "reviews", key: "browse.sort.reviews" },
  { value: "newest", key: "browse.sort.newest" },
];

type PickFn = (values: Partial<Record<Locale, string | undefined>>, fallback?: string) => string;

type CityRecord = ReturnType<typeof cityRecordsFor>[number];

function getCityLabel(cityValue: string, cities: CityRecord[], pick: PickFn): string {
  const city = cities.find((c) => c.value === cityValue);
  if (!city) return cityValue;
  return pick({ en: city.labelEn, ka: city.labelKa, ru: city.labelRu }, cityValue);
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
          "flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium transition-all border",
          "hover:border-[var(--hm-brand-500)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/30",
          isOpen || active
            ? "border-[var(--hm-brand-500)]/50 text-[var(--hm-brand-500)]"
            : "border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)]",
        ].join(" ")}
        style={
          isOpen || active
            ? { backgroundColor: "rgba(239, 78, 36, 0.08)" }
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
          // max-w cap keeps the dropdown from clipping the viewport on
          // narrow phones (<360px) regardless of which side it's
          // anchored from. The 1rem reserve = 8px breathing room on
          // each side so the panel doesn't kiss the viewport edge.
          className={`absolute top-full mt-1.5 z-50 rounded-xl border border-[var(--hm-border-subtle)] shadow-lg min-w-[220px] max-w-[calc(100vw-1rem)] ${align === "right" ? "right-0" : "left-0"}`}
          style={{ background: "var(--hm-bg-elevated)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function BrowseFilterBar() {
  const { t, pick } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const { categories } = useCategories();
  const country = useMarketplaceCountry();
  const sym = currencySymbol({ country });
  const budgetPresets = BUDGET_PRESET_RANGES.map((p) => ({
    ...p,
    label: p.max == null ? `${p.min}${sym}+` : `${p.min}-${p.max}${sym}`,
  }));
  const cities = cityRecordsFor(country);
  const popularCityValues = popularCityValuesFor(country, 4);

  // Lookup any key (category, subcategory, or service) from the catalog tree
  const getLabel = useCallback((key: string): string => {
    for (const cat of categories) {
      if (cat.key === key) return pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories) {
        if (sub.key === key) return pick({ en: sub.name, ka: sub.nameKa });
        for (const svc of (sub.services ?? [])) {
          if (svc.key === key) return pick({ en: svc.name, ka: svc.nameKa });
        }
      }
    }
    return getCategoryLabel(key);
  }, [categories, pick, getCategoryLabel]);
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
    partnersOnly,
    setPartnersOnly,
    hasActiveFilters,
    clearAllFilters,
    searchQuery,
    setSearchQuery,
  } = useBrowseContext();

  const [open, setOpen] = useState<OpenDropdown>(null);
  const [draftMin, setDraftMin] = useState<string>(budgetMin?.toString() ?? "");
  const [draftMax, setDraftMax] = useState<string>(budgetMax?.toString() ?? "");
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // AI search runs in parallel with the text-match search. When the
  // user types something like "leak fix" the AI maps it to a category
  // (plumbing) and we auto-apply that as a filter alongside the plain
  // text query - the backend still does keyword matching but the
  // category filter narrows the result set to pros who actually offer
  // that work, instead of returning everyone whose bio happens to
  // contain "leak". Without this wiring the Professionals page was the
  // only search surface that didn't use AI.
  const { aiResults, aiLoading, search: aiSearch } = useAiServiceSearch();

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Auto-apply the strongest AI match to the category filter. Mirrors
  // the shell header pattern (app/(shell)/layout.tsx). Only fires when
  // the user hasn't already picked a category - manual category choice
  // should never be overridden by a vague AI match.
  useEffect(() => {
    if (!aiResults || aiResults.length === 0) return;
    if (selectedCategory) return;
    const match = aiResults[0];
    if (match?.category) setSelectedCategory(match.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiResults]);

  // Marketplace switch (e.g. /ge -> /fr): the persisted `selectedCity`
  // from the previous market won't exist in the new country's city
  // list, so the filter would silently return zero results. Reset to
  // "all" whenever the city no longer matches the current marketplace.
  useEffect(() => {
    if (!selectedCity || selectedCity === "all") return;
    const stillValid = cities.some((c) => c.value === selectedCity);
    if (!stillValid) setSelectedCity("all");
    // `cities` is derived from `country`; tracking country alone is
    // enough for the effect to re-run on marketplace change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Kick the AI lookup immediately - the hook handles its own
    // debounce (600ms) and minQueryLength gate, so calling on every
    // keystroke is safe and avoids a stale "AI for previous query"
    // race if the user keeps typing past the local debounce.
    aiSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const activeFilterCount = [
    selectedCity && selectedCity !== "all",
    minRating > 0,
    budgetMin !== null || budgetMax !== null,
    selectedCategory,
    selectedSubcategories.length > 0,
  ].filter(Boolean).length;

  const cityLabel =
    selectedCity && selectedCity !== "all"
      ? getCityLabel(selectedCity, cities, pick)
      : t("browse.allCities");

  const ratingLabel =
    minRating > 0 ? `${minRating}+` : t("browse.allRatings");

  const budgetLabel =
    budgetMin !== null || budgetMax !== null
      ? budgetMax === null
        ? `${budgetMin}${sym}+`
        : `${budgetMin ?? 0}-${budgetMax}${sym}`
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

  return (
    <div className="mb-2">
      <CategoryScroller
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSubcategories={selectedSubcategories}
        onSubcategoriesChange={setSelectedSubcategories}
      />

      {/* Desktop filter bar - clean inline row, no boxed container */}
      <div className="hidden lg:flex items-center gap-2 py-1">
        {/* Search - rounded pill matches the dropdowns. The left-side
            icon flips from Search -> Loader2 while AI is mapping the
            query to a category, so the user has a visual signal that
            the page is doing semantic work in addition to the text
            search firing on its own debounce. */}
        <div className="relative w-72">
          {aiLoading ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hm-brand-500)] animate-spin" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hm-fg-muted)]" />
          )}
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("browse.searchProfessionals")}
            className="w-full h-9 pl-10 pr-9 text-[13px] rounded-full bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)] focus:outline-none focus:border-[var(--hm-brand-500)]/40 focus:ring-2 focus:ring-[var(--hm-brand-500)]/10 transition-all"
          />
          {localSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors active:scale-95"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
            </button>
          )}
        </div>

        {/* Homico Partners - bookable pros. A direct boolean toggle, not a
            dropdown, so it reads as an instant on/off filter. */}
        <button
          type="button"
          onClick={() => setPartnersOnly(!partnersOnly)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
            partnersOnly
              ? "bg-[var(--hm-brand-500)] text-white"
              : "border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          {t("browse.partnersOnly")}
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
              {popularCityValues.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSelectedCity(v);
                    setOpen(null);
                  }}
                  className={[
                    "px-2.5 py-1 text-xs font-medium border transition-all",
                    selectedCity === v
                      ? "bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)] text-white"
                      : "border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40",
                  ].join(" ")}
                >
                  {getCityLabel(v, cities, pick)}
                </button>
              ))}
            </div>
            <div className="scrollbar-subtle border-t border-[var(--hm-border-subtle)] pt-2 space-y-0.5 max-h-[40vh] overflow-y-auto -mx-3 px-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("all");
                  setOpen(null);
                }}
                className={[
                  "w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
                  !selectedCity || selectedCity === "all"
                    ? "text-[var(--hm-brand-500)] font-medium"
                    : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]",
                ].join(" ")}
              >
                {t("browse.allCities")}
              </button>
              {cities.filter((c) => !popularCityValues.includes(c.value)).map(
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
                        ? "text-[var(--hm-brand-500)] font-medium"
                        : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]",
                    ].join(" ")}
                  >
                    {getCityLabel(city.value, cities, pick)}
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
                  "flex items-center gap-1 px-3 py-1.5 text-sm font-medium border transition-all",
                  minRating === opt.value
                    ? "bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)] text-white"
                    : "border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40",
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
              {budgetPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectBudgetPreset(preset.min, preset.max)}
                  className={[
                    "px-2.5 py-1 text-xs font-medium border transition-all",
                    isBudgetPresetActive(preset.min, preset.max)
                      ? "bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)] text-white"
                      : "border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  variant="filled"
                  inputSize="sm"
                  placeholder={t("browse.min")}
                  value={draftMin}
                  onChange={(e) => setDraftMin(e.target.value)}
                />
              </div>
              <span className="text-[var(--hm-fg-muted)] text-sm">-</span>
              <div className="flex-1">
                <Input
                  type="number"
                  variant="filled"
                  inputSize="sm"
                  placeholder={t("browse.max")}
                  value={draftMax}
                  onChange={(e) => setDraftMax(e.target.value)}
                />
              </div>
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
                className="flex-1 text-xs"
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
                    ? "text-[var(--hm-brand-500)] font-medium bg-[var(--hm-brand-500)]/5"
                    : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]",
                ].join(" ")}
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        </DropdownWrapper>
      </div>

      {/* Mobile: partner toggle + sort (category handled by scroller above) */}
      <div className="flex lg:hidden items-center gap-2">
        <button
          type="button"
          onClick={() => setPartnersOnly(!partnersOnly)}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors ${
            partnersOnly
              ? "bg-[var(--hm-brand-500)] text-white"
              : "border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)]"
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          {t("browse.partnersOnly")}
        </button>
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
                    ? "text-[var(--hm-brand-500)] font-medium bg-[var(--hm-brand-500)]/5"
                    : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]",
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
              label={getCityLabel(selectedCity, cities, pick)}
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
            <Button
              variant="link"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs ml-1"
            >
              {t("browse.clearAll")}
            </Button>
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
      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-[var(--hm-brand-500)]/30 text-[var(--hm-brand-500)] cursor-default"
      style={{ background: "rgba(239,78,36,0.10)" }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 -mr-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--hm-brand-500)]/20 transition-colors active:scale-95"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}
