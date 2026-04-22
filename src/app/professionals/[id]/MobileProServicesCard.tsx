"use client";

import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProProfile } from "@/types/shared";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";

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
}: {
  profile: ProProfile;
}) {
  const { categories: CATEGORIES } = useCategories();
  const { t, pick } = useLanguage();

  const svcNameMap: Record<string, string> = {};
  const subNameMap: Record<string, string> = {};
  const validServiceKeys = new Set<string>();
  const catalogSvcMap: Record<
    string,
    { unitOptions?: { key: string; label: { en: string; ka: string } }[] }
  > = {};
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
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[var(--hm-brand-500)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--hm-fg-secondary)]">
            {t("common.services")} & {t("common.pricing")}
          </span>
        </div>

        {active.length === 0 ? (
          <p className="text-sm text-[var(--hm-fg-muted)]">
            {t("common.notAdded")}
          </p>
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
                      {subNameMap[subKey] || subKey}
                    </span>
                    {expMap[subKey] && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium">
                        {expLabels[expMap[subKey]] || expMap[subKey]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(byService).map(([svcKey, rows]) => {
                      const svcName = svcNameMap[svcKey] || svcKey;
                      const catalogSvc = catalogSvcMap[svcKey];
                      return (
                        <div
                          key={svcKey}
                          className="rounded-xl p-3 border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/30"
                        >
                          {rows.length === 1 ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
                                {svcName}
                              </span>
                              <span className="text-sm font-bold text-[var(--hm-brand-500)]">
                                {rows[0].price}₾
                                {(() => {
                                  const unitKey = (
                                    rows[0] as Record<string, unknown>
                                  ).unitKey as string | undefined;
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
                                  const unitKey = (
                                    entry as Record<string, unknown>
                                  ).unitKey as string | undefined;
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
                                        {entry.price}₾
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
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
