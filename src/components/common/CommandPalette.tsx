"use client";

import { getRecentSearches, getRecentVisits, recordRecentSearch } from "@/components/common/NavigationProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { api } from "@/lib/api";
import { UserRole } from "@/types";
import { listSavedSearches, removeSavedSearch, savedSearchHref } from "@/utils/savedSearches";
import {
  Bookmark,
  Briefcase,
  Clock,
  HelpCircle,
  Home,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * One command in the palette. `keywords` widen the fuzzy match
 * (e.g. "post a job" should match "create"). `roles` gates by
 * authenticated role - undefined means "everyone".
 */
interface Command {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href: string;
  keywords: string[];
  roles?: UserRole[];
}

/**
 * Global command palette. Triggered by Cmd+K (Mac) / Ctrl+K
 * (Win/Linux) anywhere in the app, or by the header search button.
 * Lists every navigation target with fuzzy search + arrow-key nav.
 *
 * Why this exists: detail pages have no header search and a deep
 * sidebar; users who know what they want shouldn't have to hunt for
 * it. Power users get one-shortcut access to any route in the app.
 */
export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { user } = useAuth();
  const { t } = useLanguage();
  const cl = useCountryLink();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  // Captured on each open so the list doesn't reshuffle mid-session
  // as the user clicks through (which would update sessionStorage).
  const [recents, setRecents] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  // Saved search bookmarks. Read once per open so the list is
  // stable while the palette is visible.
  const [savedSearches, setSavedSearches] = useState<ReturnType<typeof listSavedSearches>>([]);
  // API-backed results (pros + jobs) for the typed query. Empty
  // until the user types ≥2 chars and the debounce settles.
  const [apiResults, setApiResults] = useState<Command[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Abort + debounce refs for the live API search so we don't race
  // an older response over a newer one or hammer the backend on
  // every keystroke.
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Reset state every time the palette opens, so a user that closes
  // it mid-search reopens to a clean prompt.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setApiResults([]);
      // Snapshot recents at open-time so opening the palette and
      // clicking around doesn't reshuffle the list under you.
      setRecents(getRecentVisits());
      setRecentSearches(getRecentSearches());
      setSavedSearches(listSavedSearches());
      // Defer focus a tick so the input is in the DOM (mounting
      // happens this same render).
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Debounced API search. Fires when the user types ≥2 chars and
  // pauses for 250ms. Cancels in-flight requests on every change
  // so stale responses don't overwrite fresh ones.
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setApiResults([]);
      setApiLoading(false);
      // Cancel any pending request from a previous longer query.
      searchAbortRef.current?.abort();
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }

    // Clear any pending debounce + abort the previous request.
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setApiLoading(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        // Search pros + jobs in parallel. Limit 4 each so the
        // palette stays scannable; users who want more results can
        // hit Enter on a static command to land on the full
        // browse page filtered by their query.
        const [prosRes, jobsRes] = await Promise.all([
          api.get(`/users/pros?search=${encodeURIComponent(q)}&limit=4`, {
            signal: controller.signal,
          }).catch(() => null),
          api.get(`/jobs?search=${encodeURIComponent(q)}&limit=4&status=open`, {
            signal: controller.signal,
          }).catch(() => null),
        ]);
        if (controller.signal.aborted) return;
        const pros = (prosRes?.data?.data ?? []) as Array<{ id?: string; _id?: string; uid?: number | string; name?: string; city?: string }>;
        const jobs = (jobsRes?.data?.data ?? jobsRes?.data?.jobs ?? []) as Array<{ id?: string; _id?: string; title?: string; budgetMax?: number; budgetMin?: number }>;
        const results: Command[] = [
          ...pros.map((p) => ({
            id: `pro:${p.id ?? p._id}`,
            label: p.name ?? "Pro",
            description: p.city,
            icon: User,
            href: cl(`/professionals/${p.uid ?? p.id ?? p._id}`),
            keywords: [],
          })),
          ...jobs.map((j) => ({
            id: `job:${j.id ?? j._id}`,
            label: j.title ?? "Job",
            description: undefined,
            icon: Briefcase,
            href: cl(`/jobs/${j.id ?? j._id}`),
            keywords: [],
          })),
        ];
        setApiResults(results);
      } catch {
        // Network errors / aborts - silent. The static command list
        // still shows so the palette is never empty due to a
        // backend hiccup.
      } finally {
        if (!controller.signal.aborted) setApiLoading(false);
      }
    }, 250);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, isOpen, cl]);

  // Hardcoded command list. The catalog of nav targets is small and
  // role-gated, so a static list is simpler than a backend lookup.
  // When new routes ship, add them here so they're discoverable via
  // the palette - this is the closest thing the app has to a
  // sitemap.
  const allCommands: Command[] = useMemo(
    () => [
      // Global - any visitor
      {
        id: "home",
        label: t("nav.home"),
        icon: Home,
        href: cl("/"),
        keywords: ["home", "მთავარი", "главная"],
      },
      {
        id: "professionals",
        label: t("browse.professionals"),
        description: t("notFound.browsePros"),
        icon: Users,
        href: cl("/professionals"),
        keywords: ["pros", "find", "search", "specialists", "სპეციალისტი", "хелосани", "ხელოსანი", "специалист"],
      },
      {
        id: "jobs",
        label: t("nav.jobs"),
        icon: Briefcase,
        href: cl("/jobs"),
        keywords: ["jobs", "browse jobs", "სამუშაო", "работа"],
      },
      {
        id: "post-job",
        label: t("browse.postAJob"),
        description: t("notFound.postJob"),
        icon: Plus,
        href: cl("/post-job"),
        keywords: ["post", "create", "new", "request", "განცხადება", "разместить"],
      },

      // Authenticated user
      {
        id: "settings",
        label: t("common.settings"),
        icon: Settings,
        href: "/settings",
        keywords: ["settings", "account", "profile", "preferences", "პარამეტრები", "настройки"],
        roles: [UserRole.CLIENT, UserRole.PRO, UserRole.ADMIN],
      },
      {
        id: "notifications",
        label: t("common.notifications"),
        icon: Mail,
        href: "/notifications",
        keywords: ["notifications", "inbox", "შეტყობინებები", "уведомления"],
        roles: [UserRole.CLIENT, UserRole.PRO, UserRole.ADMIN],
      },
      {
        id: "help",
        label: t("common.help"),
        icon: HelpCircle,
        href: "/help",
        keywords: ["help", "support", "contact", "დახმარება", "помощь"],
      },

      // Client-only
      {
        id: "my-jobs",
        label: t("notFound.myJobs"),
        icon: Briefcase,
        href: "/my-jobs",
        keywords: ["my jobs", "posted", "ჩემი განცხადებები", "мои объявления"],
        roles: [UserRole.CLIENT, UserRole.ADMIN],
      },
      {
        id: "become-pro",
        label: t("notFound.becomePro"),
        icon: Sparkles,
        href: cl("/become-pro"),
        keywords: ["become pro", "earn", "work", "professional", "დასაქმდი", "стать"],
        roles: [UserRole.CLIENT],
      },

      // Pro-only
      {
        id: "my-space",
        label: t("notFound.mySpace"),
        description: t("mySpace.subtitle"),
        icon: User,
        href: "/my-space",
        keywords: ["my space", "workspace", "dashboard", "ჩემი სივრცე", "пространство"],
        roles: [UserRole.PRO, UserRole.ADMIN],
      },
      {
        id: "my-work",
        label: t("job.myWork"),
        icon: Briefcase,
        href: "/my-work",
        keywords: ["my work", "active", "სამუშაო", "работы"],
        roles: [UserRole.PRO, UserRole.ADMIN],
      },
      {
        id: "my-proposals",
        label: t("proposal.proposals"),
        icon: MessageSquare,
        href: "/my-proposals",
        keywords: ["proposals", "შეთავაზებები", "предложения"],
        roles: [UserRole.PRO, UserRole.ADMIN],
      },
      {
        id: "my-reviews",
        label: t("reviews.myReviews"),
        icon: Star,
        href: "/my-reviews",
        keywords: ["reviews", "ratings", "შეფასებები", "отзывы"],
        roles: [UserRole.PRO, UserRole.ADMIN, UserRole.CLIENT],
      },

      // Admin-only
      {
        id: "admin",
        label: t("notFound.adminPanel"),
        icon: ShieldCheck,
        href: "/admin",
        keywords: ["admin", "panel", "dashboard", "ადმინ", "админ"],
        roles: [UserRole.ADMIN],
      },
    ],
    [t, cl],
  );

  // Filter by role + search query. Empty query = show all visible
  // commands.
  const filtered = useMemo(() => {
    const role = user?.role;
    const visible = allCommands.filter((c) => !c.roles || (role && c.roles.includes(role)));

    const q = query.trim().toLowerCase();
    if (!q) return visible;

    return visible.filter((c) => {
      const haystack = [c.label, c.description ?? "", ...c.keywords].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [allCommands, user?.role, query]);

  // Turn recent paths into command-shaped entries so they can sit
  // alongside the static command list. We try to match each recent
  // path back to a known command (so the icon + label render right);
  // unknown paths get a generic Clock icon and a humanized path as
  // label. Hidden once the user starts typing - they're navigation
  // hints, not search results.
  const recentCommands = useMemo<Command[]>(() => {
    if (query.trim().length > 0) return [];
    return recents
      .map((path) => {
        const match = allCommands.find((c) => c.href === path || c.href.split("?")[0] === path);
        if (match) {
          return {
            ...match,
            id: `recent:${match.id}`,
            icon: Clock,
            description: undefined,
          };
        }
        // Unknown path (deep detail page like /jobs/abc, /messages/xyz).
        // Show it with a humanized label - keeps the recent useful
        // for return navigation to specific items.
        const segments = path.split("?")[0].split("/").filter(Boolean);
        const label = segments[segments.length - 1] || path;
        return {
          id: `recent:${path}`,
          label: label.replace(/[-_]/g, " "),
          icon: Clock,
          href: path,
          keywords: [],
        } as Command;
      })
      // Drop the current page - jumping to "where you already are"
      // is noise.
      .filter((c) => typeof window === "undefined" || c.href !== window.location.pathname);
  }, [recents, query, allCommands]);

  // Recent typed searches surfaced when palette opens empty. Each
  // suggestion fills the search input (not navigates) - clicking
  // "plumber" lets the user re-run that search against the current
  // command set with no re-typing. Uses the `__search:` href
  // sentinel so `runCommand` can branch without a new type.
  const recentSearchCommands = useMemo<Command[]>(() => {
    if (query.trim().length > 0) return [];
    return recentSearches.map((q) => ({
      id: `search:${q}`,
      label: q,
      icon: Search,
      href: `__search:${q}`,
      keywords: [],
    }));
  }, [recentSearches, query]);

  // Saved-search bookmarks. Show on empty query (high signal of
  // intent) OR when the user's query matches the label. Each
  // navigates to the bookmarked filter URL directly.
  const savedSearchCommands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    return savedSearches
      .filter((s) => !q || s.label.toLowerCase().includes(q))
      .map((s) => ({
        id: `saved:${s.id}`,
        label: s.label,
        description: s.surface === "jobs" ? t("nav.jobs") : t("browse.professionals"),
        icon: Bookmark,
        href: savedSearchHref(s),
        keywords: [],
      }));
  }, [savedSearches, query, t]);

  // Group commands into labeled sections for the rendered output.
  // Keyboard nav still uses a single global index (computed via the
  // flat `visibleList` below) so arrow keys move across sections
  // seamlessly. Empty groups are dropped so we don't render
  // dangling headers.
  const sections = useMemo(() => {
    const out: { id: string; label: string; items: Command[] }[] = [];
    if (apiResults.length > 0) {
      out.push({ id: "results", label: t("commandPalette.sectionResults"), items: apiResults });
    }
    if (savedSearchCommands.length > 0) {
      out.push({ id: "saved", label: t("commandPalette.sectionSaved"), items: savedSearchCommands });
    }
    if (recentSearchCommands.length > 0) {
      out.push({ id: "recentSearches", label: t("commandPalette.sectionRecentSearches"), items: recentSearchCommands });
    }
    if (recentCommands.length > 0) {
      out.push({ id: "recentVisits", label: t("commandPalette.sectionRecent"), items: recentCommands });
    }
    if (filtered.length > 0) {
      out.push({ id: "navigate", label: t("commandPalette.navigate"), items: filtered });
    }
    return out;
  }, [apiResults, savedSearchCommands, recentSearchCommands, recentCommands, filtered, t]);

  // Flat list mirrors `sections` in render order. Keyboard handler
  // and active-index math read from this so the existing single
  // counter still works across grouped rendering.
  const visibleList = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );

  // Clamp active index when results shrink
  useEffect(() => {
    if (activeIndex >= visibleList.length) setActiveIndex(0);
  }, [visibleList.length, activeIndex]);

  const runCommand = (cmd: Command) => {
    // Recent-search suggestions fill the input instead of navigating.
    // The `__search:` sentinel lets us branch without introducing
    // a new command type.
    if (cmd.href.startsWith("__search:")) {
      const next = cmd.href.slice("__search:".length);
      setQuery(next);
      setActiveIndex(0);
      inputRef.current?.focus();
      return;
    }
    // Persist the typed query so it can be surfaced next time as a
    // "recent search" suggestion. Only when the user has actually
    // typed something - selecting a command with no query is just
    // a navigation, not a search.
    if (query.trim().length > 1) {
      recordRecentSearch(query);
    }
    close();
    router.push(cmd.href);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(visibleList.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = visibleList[activeIndex];
      if (cmd) runCommand(cmd);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  // Keep the active item visible as the user arrows down
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!mounted || !isOpen) return null;

  const node = (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center sm:items-center px-3 sm:px-4 pt-16 sm:pt-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-backdrop"
        onClick={close}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("commandPalette.openHint")}
        className="relative w-full max-w-xl bg-[var(--hm-bg-elevated)] rounded-2xl shadow-2xl border border-[var(--hm-border)] overflow-hidden animate-fade-in"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--hm-border-subtle)]">
          <Search className={`w-4 h-4 flex-shrink-0 ${apiLoading ? "text-[var(--hm-brand-500)] animate-pulse" : "text-[var(--hm-fg-muted)]"}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("commandPalette.placeholder")}
            className="flex-1 bg-transparent outline-none text-[15px] text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)]"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--hm-fg-muted)] border border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results - grouped into sections with labeled headers
            (Results / Recent / Navigate) so users can scan the kind
            of suggestion they want. Keyboard nav stays flat: each
            item carries a `globalIdx` computed from its position in
            `visibleList`, so arrow keys move smoothly across
            sections without the user noticing the structure. */}
        <div ref={listRef} className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto py-2">
          {visibleList.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--hm-fg-muted)]">
              {t("commandPalette.empty")}
            </div>
          ) : (
            (() => {
              // Running counter so each item knows its global index
              // regardless of which section it lives in.
              let globalIdx = -1;
              return sections.map((section) => (
                <div key={section.id} className="pb-1">
                  <div className="px-4 sm:px-5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--hm-fg-muted)]">
                    {section.label}
                  </div>
                  {section.items.map((cmd) => {
                    globalIdx += 1;
                    const i = globalIdx;
                    const Icon = cmd.icon;
                    const active = i === activeIndex;
                    // Saved-search rows carry the original `s.id`
                    // after the `saved:` prefix so we can remove
                    // them with one tap. Other sections don't get
                    // the X.
                    const isSaved = cmd.id.startsWith("saved:");
                    const savedId = isSaved ? cmd.id.slice("saved:".length) : null;
                    return (
                      // Row uses div + role="button" so we can nest
                      // the saved-search delete X without producing
                      // invalid button-in-button HTML.
                      <div
                        key={cmd.id}
                        role="button"
                        tabIndex={-1}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`group/row w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 text-left transition-colors cursor-pointer ${
                          active
                            ? "bg-[var(--hm-brand-500)]/8 text-[var(--hm-fg-primary)]"
                            : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            active
                              ? "bg-[var(--hm-brand-500)]/15 text-[var(--hm-brand-500)]"
                              : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{cmd.label}</span>
                          {cmd.description && (
                            <span className="block text-xs text-[var(--hm-fg-muted)] truncate">
                              {cmd.description}
                            </span>
                          )}
                        </span>
                        {isSaved && savedId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedSearch(savedId);
                              setSavedSearches(listSavedSearches());
                            }}
                            aria-label={t("common.delete")}
                            className="opacity-0 group-hover/row:opacity-100 transition-opacity w-7 h-7 rounded-md flex items-center justify-center text-[var(--hm-fg-muted)] hover:bg-[var(--hm-error-500)]/10 hover:text-[var(--hm-error-500)]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {active && !isSaved && (
                          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--hm-fg-muted)] border border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]">
                            ↵
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        {/* "View all results" link - shown when the API search hit
            the per-side limit so the user has a way to expand into
            the full filtered browse pages. Hidden when there's no
            query or no API results. Splits across pros and jobs to
            land users on whichever entity type matched more. */}
        {query.trim().length >= 2 && apiResults.length > 0 && (
          <div className="px-4 sm:px-5 py-2 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)]/40">
            <button
              type="button"
              onClick={() => {
                if (query.trim().length > 1) recordRecentSearch(query);
                close();
                // Prefer the entity type with more matches. Equal counts
                // (or all-pros / all-jobs) fall through to the pros page,
                // which is the more common search target.
                const proCount = apiResults.filter((c) => c.id.startsWith("pro:")).length;
                const jobCount = apiResults.filter((c) => c.id.startsWith("job:")).length;
                const target = jobCount > proCount
                  ? cl(`/jobs?search=${encodeURIComponent(query.trim())}`)
                  : cl(`/professionals?search=${encodeURIComponent(query.trim())}`);
                router.push(target);
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/10 transition-colors"
            >
              <span className="truncate text-left">
                {t("commandPalette.viewAllResults", { query: query.trim() })}
              </span>
              <span className="text-[var(--hm-fg-muted)]" aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {/* Footer hint */}
        <div className="hidden sm:flex items-center justify-between px-5 py-2.5 text-[11px] text-[var(--hm-fg-muted)] border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)]">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded font-mono border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)]">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)]">↵</kbd>
              open
            </span>
          </span>
          <span>{t("commandPalette.shortcutHint")}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
