/**
 * Search synonym map for the service catalog. The catalog stores
 * canonical names (en: "Drywall installation", ka: "გიფსოკარტონი",
 * ru: "Гипсокартон") but users type colloquial / transliterated
 * shorthand ("gipso" on a construction site, "plitka" for tile,
 * "santech" for plumbing).
 *
 * Until the catalog seed has localized `keywords` populated for each
 * subcategory + service (a separate backend task that needs a re-seed
 * to land), this frontend map serves as the bridge: a user query is
 * expanded into the set of canonical terms it could correspond to,
 * and the local search predicate matches against any of them.
 *
 * Pattern:
 *   - keys are user-typed terms (lowercase, no accents)
 *   - values are the canonical terms the catalog actually contains
 *     (any locale - the predicate `.includes()` is locale-agnostic)
 *
 * To add: pick the colloquial form the user types, list every
 * canonical token that catalog data could match. Keep the canonical
 * tokens short enough to substring-match the actual name (e.g.
 * "გიფს" matches "გიფსოკარტონი" via includes).
 *
 * Long-term replacement: persist these per subcategory/service in
 * the catalog seed as `keywords: SeedLocalizedText[]` and remove this
 * file. The lookup helpers in seed/helpers.ts already accept that
 * field on the schema; the seed entries just don't pass it yet.
 */

const SYNONYM_MAP: Record<string, string[]> = {
  // ───── Drywall / gypsum / plaster ─────
  gipso: ["drywall", "gypsum", "plaster", "გიფს", "плита", "гипсокарт", "штукатур"],
  gipsum: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт"],
  gypsum: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт"],
  drywall: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт"],
  plaster: ["plaster", "drywall", "stucco", "შელეს", "штукатур"],
  გიფს: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт"],
  гипс: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт", "штукатур"],
  гипсокартон: ["drywall", "gypsum", "plaster", "გიფს", "гипсокарт"],
  штукатур: ["plaster", "drywall", "stucco", "შელეს", "штукатур", "გიფს"],

  // ───── Tile / plitka ─────
  plitka: ["tile", "plitka", "ფილ", "плитка"],
  plitki: ["tile", "plitka", "ფილ", "плитка"],
  tile: ["tile", "ფილ", "плитка"],
  плитк: ["tile", "ფილ", "плитка"],
  ფილ: ["tile", "ფილ", "плитка"],

  // ───── Plumbing ─────
  santech: ["plumb", "santech", "сантех", "სანტექ"],
  santeknika: ["plumb", "santech", "сантех", "სანტექ"],
  plumb: ["plumb", "სანტექ", "сантех"],
  сантех: ["plumb", "сантех", "სანტექ"],
  სანტექ: ["plumb", "santech", "сантех", "სანტექ"],

  // ───── Electrical ─────
  eltechnika: ["electric", "ელექტრ", "электри"],
  electric: ["electric", "ელექტრ", "электри"],
  электри: ["electric", "ელექტრ", "электри"],
  ელექტრ: ["electric", "ელექტრ", "электри"],

  // ───── Painting ─────
  shebva: ["paint", "შეღებ", "покраск"],
  poklaska: ["paint", "შეღებ", "покраск"],
  paint: ["paint", "შეღებ", "покраск"],
  покраск: ["paint", "შეღებ", "покраск"],
  შეღებ: ["paint", "შეღებ", "покраск"],

  // ───── Demolition ─────
  demontage: ["demolish", "demo", "დემონტ", "демонт"],
  demont: ["demolish", "demo", "დემონტ", "демонт"],
  демонт: ["demolish", "demo", "დემონტ", "демонт"],
  დემონტ: ["demolish", "demo", "დემონტ", "демонт"],

  // ───── Cleaning ─────
  cleaning: ["clean", "დასუფთ", "დალაგ", "уборк"],
  daltageba: ["clean", "დასუფთ", "დალაგ", "уборк"],
  убор: ["clean", "დასუფთ", "დალაგ", "уборк"],
  დასუფთ: ["clean", "დასუფთ", "დალაგ", "уборк"],
  დალაგ: ["clean", "დასუფთ", "დალაგ", "уборк"],
};

/**
 * Expand a user query into the set of canonical tokens that could
 * match it. The original query is always included so plain-name
 * matches still work without any synonym entry.
 *
 * Returns lowercase tokens; the caller is responsible for
 * lowercasing the target names before `.includes()`.
 */
export function expandSearchQuery(query: string): string[] {
  const norm = query.trim().toLowerCase();
  if (!norm) return [];

  const out = new Set<string>([norm]);

  // Direct hit on a synonym key
  if (SYNONYM_MAP[norm]) {
    for (const v of SYNONYM_MAP[norm]) out.add(v.toLowerCase());
  }

  // Prefix hit: user typed "gips" - matches keys "gipso", "gipsum",
  // "გიფს". This lets short prefixes still trigger synonym expansion
  // without listing every truncated form in the map.
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (key !== norm && key.startsWith(norm) && norm.length >= 3) {
      out.add(key);
      for (const v of values) out.add(v.toLowerCase());
    }
  }

  return Array.from(out);
}
