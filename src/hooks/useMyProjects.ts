'use client';

import { api } from '@/lib/api';
import { useEffect, useReducer } from 'react';

/** Shape both the header dropdown and the sidebar need from a project. */
export interface MyProject {
  id?: string;
  _id?: string;
  title: string;
  status?: string;
  progress?: number;
  coverImage?: string;
  photos?: string[];
}

// Module-level cache so the header dropdown and the sidebar group share ONE
// `/projects` request instead of each firing their own on every shell page.
let cache: MyProject[] | null = null;
let inflight = false;
let attempt = 0;
// Bumped on every invalidate (incl. sign-out). An in-flight `/projects` whose
// generation no longer matches is a stale response - dropped instead of writing
// the cache, so User A's list can't resurrect the cache after User A logs out
// and User B signs in on the same tab (no full reload clears module state).
let generation = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const RETRY_STEP_MS = 1200;
const RETRY_MAX_MS = 10000;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

// Re-arm the load when the tab regains focus / comes back online. The shell's
// SidebarProjectsGroup lives in a persistent layout and never remounts, so
// without this a load that failed while the tab was backgrounded (or the
// backend was momentarily down) would leave the sidebar stuck on its skeleton.
let reArmBound = false;
function bindReArm() {
  if (reArmBound || typeof window === 'undefined') return;
  reArmBound = true;
  const reArm = () => {
    if (subscribers.size > 0 && cache === null && !inflight) ensureLoaded();
  };
  window.addEventListener('focus', reArm);
  window.addEventListener('online', reArm);
}

function scheduleRetry() {
  // Keep retrying with escalating-but-capped backoff for as long as anything
  // is watching. Giving up after a fixed number of attempts was the "sidebar
  // shows the loader forever" bug: a transient failure (token refresh race, a
  // dev backend recompile, a network blip) exhausted the retries and, because
  // the component never remounts, nothing ever re-triggered the fetch.
  if (retryTimer || subscribers.size === 0) return;
  attempt += 1;
  const delay = Math.min(RETRY_STEP_MS * attempt, RETRY_MAX_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (subscribers.size > 0) ensureLoaded();
  }, delay);
}

function ensureLoaded() {
  if (cache !== null || inflight) return;
  inflight = true;
  const gen = generation;
  api
    .get('/projects')
    .then((r) => {
      if (gen !== generation) return; // invalidated mid-flight - drop stale data
      cache = (r.data as MyProject[]) || [];
      attempt = 0;
    })
    .catch(() => {
      if (gen !== generation) return;
      // Do NOT cache the failure as an empty list - that was the
      // "projects sometimes don't load" bug: a transient error (a token
      // refresh, a backend restart, a network blip) would stick as "no
      // projects" forever, because `cache !== null` blocks every retry.
      // Leave it null and retry with backoff so the sidebar self-heals.
      cache = null;
      scheduleRetry();
    })
    .finally(() => {
      if (gen !== generation) return; // a newer generation owns `inflight` now
      inflight = false;
      notify();
    });
}

/**
 * Drop the cache so the next consumer refetches. Call after creating or
 * deleting a project, or on logout, to keep the shared list fresh.
 */
export function invalidateMyProjects() {
  // Bump the generation FIRST so any in-flight request's callbacks no-op when
  // they resolve (see `ensureLoaded`) instead of writing a stale cache.
  generation += 1;
  cache = null;
  inflight = false;
  attempt = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  notify();
}

/**
 * Shared, deduped list of the signed-in user's projects. The first enabled
 * consumer triggers a single `/projects` fetch; every other consumer reuses
 * the cached result and re-renders when it arrives. Pass `enabled` =
 * `isAuthenticated`. Returns `null` while loading or when signed out.
 */
export function useMyProjects(enabled: boolean): MyProject[] | null {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!enabled) {
      // Signed out - drop the cache AND invalidate any in-flight request so a
      // response that lands after sign-out can't resurrect one user's list for
      // the next user on this tab. Unconditional (not `if cache !== null`) so an
      // in-flight fetch is cancelled even before its first result arrives.
      invalidateMyProjects();
      return;
    }
    subscribers.add(rerender);
    bindReArm();
    ensureLoaded();
    return () => {
      subscribers.delete(rerender);
    };
  }, [enabled]);

  return enabled ? cache : null;
}
