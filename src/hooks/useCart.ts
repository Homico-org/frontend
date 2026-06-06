'use client';

import { CatalogProduct } from '@/components/shop/types';
import { useCallback, useSyncExternalStore } from 'react';

export interface CartItem {
  product: CatalogProduct;
  qty: number;
}

const KEY = 'homico:shop-cart:v1';

/**
 * A small localStorage-backed shopping cart for the supplier catalog, exposed
 * as a single shared store via useSyncExternalStore. Every `useCart()` caller -
 * the shop grid, a product page, the cart drawer, the header indicator - reads
 * and mutates the SAME state and re-renders together. Survives reloads on this
 * device and syncs across tabs (storage event).
 */

const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let hydrated = false;
let storageBound = false;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void): () => void {
  // Hydrate from storage on the first subscription (client only).
  if (!hydrated && typeof window !== 'undefined') {
    items = read();
    hydrated = true;
  }
  // Cross-tab sync - bind the storage listener once for the whole store.
  if (!storageBound && typeof window !== 'undefined') {
    storageBound = true;
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) {
        items = read();
        emit();
      }
    });
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): CartItem[] {
  return items;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function useCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((product: CatalogProduct, qty = 1) => {
    const i = items.findIndex((x) => x.product.id === product.id);
    if (i === -1) {
      commit([...items, { product, qty }]);
    } else {
      const next = [...items];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      commit(next);
    }
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    commit(
      qty <= 0
        ? items.filter((x) => x.product.id !== id)
        : items.map((x) => (x.product.id === id ? { ...x, qty } : x)),
    );
  }, []);

  const remove = useCallback(
    (id: string) => commit(items.filter((x) => x.product.id !== id)),
    [],
  );

  const clear = useCallback(() => commit([]), []);

  const qtyOf = useCallback(
    (id: string) => list.find((x) => x.product.id === id)?.qty ?? 0,
    [list],
  );

  const count = list.reduce((s, x) => s + x.qty, 0);
  const total = list.reduce((s, x) => s + x.product.priceGel * x.qty, 0);

  return { items: list, count, total, add, setQty, remove, clear, qtyOf };
}
