"use client";

import { useCategories } from "@/contexts/CategoriesContext";
import type { CatalogServiceItem } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { humanizeServiceKey } from "@/hooks/useCategoryLabels";
import type { ProProfile } from "@/types/shared";
import { motion } from "framer-motion";
import { DollarSign, Edit3, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { currencySymbol } from "@/utils/currency";

/**
 * Mirror of the desktop sidebar's Services & Pricing block for mobile.
 *
 * Kept in its own file and loaded via next/dynamic(..., { ssr: false }) by
 * the parent. Server output of this card would differ from the post-hydrate
 * output (CATEGORIES is empty during SSR, populated after the async fetch),
 * and the shape delta would drift React's hydration cursor for the sibling
 * desktop aside, producing bogus "unexpected <button>" mismatches further
 * down. Rendering only on the client sidesteps that entirely.
 */
export default function MobileProServicesCard({
  profile,
  canEdit = false,
  editServicesHref = "/pro/profile-setup/services",
}: {
  profile: ProProfile;
  /** Show the owner-only "Manage services" CTA when true. */
  canEdit?: boolean;
  /** Where the manage-services button routes. Mirrors the desktop sidebar. */
  editServicesHref?: string;
}) {
  const { categories: CATEGORIES } = useCategories();
  const { t, pick } = useLanguage();

  const svcNameMap: Record<string, string> = {};
  const subNameMap: Record<string, string> = {};
  const validServiceKeys = new Set<string>();
  const catalogSvcMap: Record<string, CatalogServiceItem> = {};
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories || []) {
      subNameMap[sub.key] = pick({ en: sub.name, ka: sub.nameKa });
      validServiceKeys.add(sub.key);
      for (const svc of sub.services || []) {
        svcNameMap[svc.key] = pick({ en: svc.name, ka: svc.nameKa });
        validServiceKeys.add(svc.key);
        catalogSvcMap[svc.key] = svc;
      }
    }
  }

  const active = (profile.servicePricing ?? []).filter(
    (s) =>
      s.isActive &&
      s.price > 0 &&
      (validServiceKeys.has(s.serviceKey) ||
        validServiceKeys.has(s.subcategoryKey)),
  );

  // Format a single entry's price as either "X{sym}" or "X - Y{sym}".
  // A range "exists" when min/max are both present and differ -
  // otherwise we fall back to the legacy single-price display.
  // Currency symbol comes from the pro's marketplace (currency on the
  // pricing entry first, then the pro's country, else GE default).
  const formatPrice = (entry: { price: number; priceMin?: number; priceMax?: number; currency?: string }): string => {
    const sym = currencySymbol(
      entry.currency
        ? { currency: entry.currency }
        : { country: profile.country ?? 'GE' },
    );
    if (
      entry.priceMin !== undefined &&
      entry.priceMax !== undefined &&
      entry.priceMin > 0 &&
      entry.priceMax > 0 &&
      entry.priceMin !== entry.priceMax
    ) {
      return `${entry.priceMin} - ${entry.priceMax}${sym}`;
    }
    return `${entry.price}${sym}`;
  };

  const grouped: Record<string, typeof active> = {};
  for (const svc of active) {
    const key = svc.subcategoryKey || "_other";
    (grouped[key] = grouped[key] ?? []).push(svc);
  }

  const expMap: Record<string, string> = {};
  for (const s of profile.selectedServices ?? []) {
    expMap[s.key] = s.experience;
  }
  const expLabels: Record<string, string> = {
    "1-2": t("professional.years12"),
    "3-5": t("professional.years35"),
    "5-10": t("professional.years510"),
    "10+": t("professional.years10plus"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      className="lg:hidden max-w-7xl mx-auto px-3 sm:px-6 mb-4"
    >
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl shadow-xl shadow-[var(--hm-n-900)]/[0.08] border border-[var(--hm-border-subtle)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-4 h-4 text-[var(--hm-brand-500)] flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--hm-fg-secondary)] truncate">
              {t("common.services")} & {t("common.pricing")}
            </span>
          </div>
          {canEdit && active.length > 0 && (
            // Mobile-only "Manage services" affordance. The desktop sidebar
            // had this CTA but it was hidden behind `lg:block` and never
            // surfaced on phones, so a pro on mobile had no path to edit
            // their own pricing from the profile page.
            <Link
              href={editServicesHref}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-700)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--hm-brand-500)]/5 flex-shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              {t("professional.manageServices") || "Edit"}
            </Link>
          )}
        </div>

        {active.length === 0 ? (
          canEdit ? (
            // Owner empty state: clear primary CTA to add the first services.
            <Link
              href={editServicesHref}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--hm-brand-500)]/5 border border-dashed border-[var(--hm-brand-500)]/30 hover:bg-[var(--hm-brand-500)]/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="w-4 h-4 text-[var(--hm-brand-500)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                  {t("professional.servicesEmptyTitle") || "Add your services"}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--hm-fg-muted)]">
                  {t("professional.servicesEmptyDesc") || "Set prices customers can see"}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--hm-fg-muted)] flex-shrink-0" />
            </Link>
          ) : (
            <p className="text-sm text-[var(--hm-fg-muted)]">
              {t("common.notAdded")}
            </p>
          )
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([subKey, entries]) => {
              const byService: Record<string, typeof entries> = {};
              for (const e of entries) {
                (byService[e.serviceKey] = byService[e.serviceKey] ?? []).push(
                  e,
                );
              }
              return (
                <div key={subKey}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)]">
                      {subNameMap[subKey] || humanizeServiceKey(subKey)}
                    </span>
                    {expMap[subKey] && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium">
                        {expLabels[expMap[subKey]] || expMap[subKey]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(byService).map(([svcKey, rows]) => {
                      const svcName = svcNameMap[svcKey] || humanizeServiceKey(svcKey);
                      const catalogSvc = catalogSvcMap[svcKey];
                      return (
                        <div
                          key={svcKey}
                          className="rounded-xl p-3 transition-all duration-200"
                          style={{
                            backgroundColor: 'var(--hm-bg-elevated)',
                            border: '1px solid var(--hm-border-subtle)',
                            boxShadow:
                              '0 1px 2px 0 rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
                          }}
                        >
                          {rows.length === 1 ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
                                {svcName}
                              </span>
                              <span className="text-sm font-bold text-[var(--hm-brand-500)]">
                                {formatPrice(rows[0])}
                                {(() => {
                                  const unitKey = rows[0].unitKey;
                                  const unitOpt = catalogSvc?.unitOptions?.find(
                                    (u) => u.key === unitKey,
                                  );
                                  const unitLabel = unitOpt
                                    ? pick({
                                        en: unitOpt.label.en,
                                        ka: unitOpt.label.ka,
                                      })
                                    : "";
                                  return unitLabel ? (
                                    <span className="text-[10px] font-normal ml-1 text-[var(--hm-fg-muted)]">
                                      /{unitLabel}
                                    </span>
                                  ) : null;
                                })()}
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium block mb-2 text-[var(--hm-fg-primary)]">
                                {svcName}
                              </span>
                              <div className="space-y-1.5">
                                {rows.map((entry) => {
                                  const unitKey = entry.unitKey;
                                  const unitOpt = catalogSvc?.unitOptions?.find(
                                    (u) => u.key === unitKey,
                                  );
                                  const unitLabel = unitOpt
                                    ? pick({
                                        en: unitOpt.label.en,
                                        ka: unitOpt.label.ka,
                                      })
                                    : unitKey || "";
                                  return (
                                    <div
                                      key={unitKey || entry.serviceKey}
                                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--hm-bg-tertiary)]"
                                    >
                                      <span className="text-[12px] text-[var(--hm-fg-secondary)]">
                                        {unitLabel}
                                      </span>
                                      <span className="text-[13px] font-bold text-[var(--hm-brand-500)]">
                                        {formatPrice(entry)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          {/* Catalog description — admin-set neutral context */}
                          {(() => {
                            const desc = catalogSvc?.description
                              ? pick({ en: catalogSvc.description.en, ka: catalogSvc.description.ka })
                              : '';
                            return desc ? (
                              <p className="mt-1.5 text-[11px] leading-snug text-[var(--hm-fg-secondary)]">
                                {desc}
                              </p>
                            ) : null;
                          })()}
                          {/* Catalog tags (urgent, eco, licensed, etc.) */}
                          {catalogSvc?.tags && catalogSvc.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {catalogSvc.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Pro's optional note about pricing factors */}
                          {(() => {
                            const note = rows.find((r) => r.notes && r.notes.length > 0)?.notes;
                            return note ? (
                              <p className="mt-2 text-[11px] leading-snug text-[var(--hm-fg-muted)] italic">
                                {note}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
