"use client";

/**
 * Saved-search persistence. Users can bookmark a filter combo on
 * `/jobs` or `/professionals` and re-run it later from the Cmd+K
 * palette or a dedicated saved-searches panel.
 *
 * Stored in localStorage (across sessions) because saving a search
 * is a deliberate user action with long-term intent, unlike recent
 * searches (sessionStorage) which decay automatically.
 *
 * Cap at SAVED_LIMIT entries so the list stays scannable - if the
 * user hits the cap, the oldest gets evicted on the next save.
 */

const STORAGE_KEY = "homi:savedSearches:v1";
const SAVED_LIMIT = 12;

export interface SavedSearch {
  id: string;
  /** Short user-supplied or auto-derived label ("Plumbers under 100₾"). */
  label: string;
  /** Which list page this query belongs to. */
  surface: "professionals" | "jobs";
  /** Country prefix at the time of save - lets us reconstruct the URL. */
  country?: string;
  /** The raw query string (without leading `?`). */
  query: string;
  /** Unix ms - drives "oldest evicted" + display sorting. */
  createdAt: number;
}

export function listSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is SavedSearch =>
        s && typeof s.id === "string" && typeof s.label === "string" && typeof s.query === "string",
      )
      // Newest first for display.
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

function persist(items: SavedSearch[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota / private mode - dropping the write is
    // acceptable; user just won't have saved-searches persisted.
  }
}

/**
 * Add a new saved search, dedup'ing by `surface + query` so saving
 * the same combo twice doesn't pile up duplicates.
 */
export function addSavedSearch(input: Omit<SavedSearch, "id" | "createdAt">): SavedSearch {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: SavedSearch = { ...input, id, createdAt: Date.now() };

  const existing = listSavedSearches().filter(
    (s) => !(s.surface === input.surface && s.query === input.query),
  );
  const next = [entry, ...existing].slice(0, SAVED_LIMIT);
  persist(next);
  return entry;
}

export function removeSavedSearch(id: string) {
  const next = listSavedSearches().filter((s) => s.id !== id);
  persist(next);
}

/**
 * Build the path + query for re-running a saved search. Encapsulates
 * the country-prefix + surface convention so callers don't have to
 * juggle URL shape.
 */
export function savedSearchHref(s: SavedSearch): string {
  const prefix = s.country ? `/${s.country.toLowerCase()}` : "";
  const base = s.surface === "jobs" ? "/jobs" : "/professionals";
  return `${prefix}${base}${s.query ? `?${s.query}` : ""}`;
}
