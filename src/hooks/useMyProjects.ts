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
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

function ensureLoaded() {
  if (cache !== null || inflight) return;
  inflight = true;
  api
    .get('/projects')
    .then((r) => {
      cache = (r.data as MyProject[]) || [];
    })
    .catch(() => {
      cache = [];
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
