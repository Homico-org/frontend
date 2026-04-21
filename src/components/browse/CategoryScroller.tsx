"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CategoryScrollerProps {
  selectedCategory: string | null;
  onSelectCategory: (key: string | null) => void;
  selectedSubcategories: string[];
  onSubcategoriesChange: (keys: string[]) => void;
}

export default function CategoryScroller({
  selectedCategory,
  onSelectCategory,
  selectedSubcategories,
  onSubcategoriesChange,
}: CategoryScrollerProps) {
  const { pick } = useLanguage();
  const { categories } = useCategories();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, categories.length]);

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === selectedCategory) ?? null,
    [categories, selectedCategory],
  );

  function handleCategoryClick(key: string) {
    if (selectedCategory === key) {
      onSelectCategory(null);
      onSubcategoriesChange([]);
      return;
    }
    onSelectCategory(key);
    const cat = categories.find((c) => c.key === key);
    const subKeys = new Set((cat?.subcategories ?? []).map((s) => s.key));
    onSubcategoriesChange(selectedSubcategories.filter((k) => subKeys.has(k)));
  }

  function toggleSub(key: string) {
    if (selectedSubcategories.includes(key)) {
      onSubcategoriesChange(selectedSubcategories.filter((k) => k !== key));
    } else {
      onSubcategoriesChange([...selectedSubcategories, key]);
    }
  }

  return (
    <div
      className="mb-5 sticky top-0 z-30 -mx-3 px-3 sm:mx-0 sm:px-0"
      style={{ backgroundColor: 'var(--hm-bg-page)' }}
    >
      {/* Category tabs — underline nav. Sticks to the top of the scroll container
          on mobile so the filter stays accessible while browsing. */}
      <div className="relative">
        {/* Left fade + chevron */}
        {canScrollLeft && (
          <>
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10"
              style={{
                background:
                  "linear-gradient(to right, var(--hm-bg-page), transparent)",
              }}
            />
            <button
              type="button"
              onClick={() => scrollBy(-280)}
              aria-label="Previous"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:shadow-md"
              style={{
                background: "var(--hm-bg-elevated)",
                border: "1px solid var(--hm-border-subtle)",
                color: "var(--hm-fg-primary)",
              }}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
            </button>
          </>
        )}

        {/* Right fade + chevron */}
        {canScrollRight && (
          <>
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
              style={{
                background:
                  "linear-gradient(to left, var(--hm-bg-page), transparent)",
              }}
            />
            <button
              type="button"
              onClick={() => scrollBy(280)}
              aria-label="Next"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:shadow-md"
              style={{
                background: "var(--hm-bg-elevated)",
                border: "1px solid var(--hm-border-subtle)",
                color: "var(--hm-fg-primary)",
              }}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
          </>
        )}

        {/* Scroll rail */}
        <div
          className="border-b"
          style={{ borderColor: "var(--hm-border-subtle)" }}
        >
          {/* px-10 keeps the first/last tabs out from under the left/right chevron buttons,
              which are absolutely positioned at the edges with a 36×36 hit target. */}
          <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide px-10">
            {categories.map((cat) => {
              const isActive = cat.key === selectedCategory;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryClick(cat.key)}
                  className="group shrink-0 relative flex flex-col items-center gap-2 px-5 py-3 focus:outline-none focus-visible:bg-[var(--hm-bg-tertiary)]/50 transition-colors"
                >
                  <CategoryIcon
                    type={cat.icon || cat.key}
                    className={`w-7 h-7 transition-colors ${
                      isActive
                        ? "text-[var(--hm-brand-500)]"
                        : "text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-fg-primary)]"
                    }`}
                  />
                  <span
                    className={`text-[12.5px] leading-none whitespace-nowrap tracking-tight transition-colors ${
                      isActive
                        ? "font-semibold text-[var(--hm-brand-500)]"
                        : "font-medium text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-fg-primary)]"
                    }`}
                  >
                    {pick({ en: cat.name, ka: cat.nameKa })}
                  </span>
                  <span
                    className="absolute left-4 right-4 -bottom-px h-[2.5px] rounded-t-full transition-all duration-200"
                    style={{
                      background: "var(--hm-brand-500)",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scaleX(1)" : "scaleX(0.3)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subcategory chips */}
      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div className="mt-3.5 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 pb-1">
            <Chip
              active={selectedSubcategories.length === 0}
              onClick={() => onSubcategoriesChange([])}
              label={pick({
                en: activeCategory.name,
                ka: activeCategory.nameKa,
              })}
              tone="primary"
            />
            <span
              className="shrink-0 w-px h-5 mx-1"
              style={{ background: "var(--hm-border-subtle)" }}
              aria-hidden
            />
            {activeCategory.subcategories.map((sub) => (
              <Chip
                key={sub.key}
                active={selectedSubcategories.includes(sub.key)}
                onClick={() => toggleSub(sub.key)}
                label={pick({ en: sub.name, ka: sub.nameKa })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "default" | "primary";
}) {
  const activeBg =
    tone === "primary" ? "var(--hm-brand-500)" : "rgba(239,78,36,0.10)";
  const activeFg = tone === "primary" ? "#fff" : "var(--hm-brand-500)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/30"
      style={
        active
          ? {
              background: activeBg,
              color: activeFg,
              boxShadow:
                tone === "primary" ? "0 1px 2px rgba(239,78,36,0.25)" : "none",
            }
          : {
              background: "var(--hm-bg-tertiary)",
              color: "var(--hm-fg-secondary)",
            }
      }
    >
      {label}
    </button>
  );
}
