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
let retries = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RETRIES = 4;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

function ensureLoaded() {
  if (cache !== null || inflight) return;
  inflight = true;
  api
    .get('/projects')
    .then((r) => {
      cache = (r.data as MyProject[]) || [];
      retries = 0;
    })
    .catch(() => {
      // Do NOT cache the failure as an empty list - that was the
      // "projects sometimes don't load" bug: a transient error (a token
      // refresh, a backend restart, a network blip) would stick as "no
      // projects" forever, because `cache !== null` blocks every retry.
      // Leave it null and retry with backoff so the sidebar self-heals.
      cache = null;
      if (subscribers.size > 0 && retries < MAX_RETRIES) {
        retries += 1;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
          retryTimer = null;
          if (subscribers.size > 0) ensureLoaded();
        }, 1200 * retries);
      }
    })
    .finally(() => {
      inflight = false;
      notify();
    });
}

/**
 * Drop the cache so the next consumer refetches. Call after creating or
 * deleting a project, or on logout, to keep the shared list fresh.
 */
export function invalidateMyProjects() {
  cache = null;
  inflight = false;
  retries = 0;
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
      // Signed out - drop the cache so a later sign-in refetches fresh.
      if (cache !== null) invalidateMyProjects();
      return;
    }
    subscribers.add(rerender);
    ensureLoaded();
    return () => {
      subscribers.delete(rerender);
    };
  }, [enabled]);

  return enabled ? cache : null;
}
