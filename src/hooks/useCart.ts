'use client';

import { CatalogProduct } from '@/components/shop/types';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface CartItem {
  product: CatalogProduct;
  qty: number;
}

const KEY = 'homico:shop-cart:v1';

/**
 * A small localStorage-backed shopping cart for the supplier catalog.
 * Survives reloads on this device. Checkout is link-out per supplier (v1);
 * the cart's purpose is to collect products and push them into a project's
 * shopping list in one go.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    } finally {
      hydrated.current = true;
    }
  }, []);

  // Persist after hydration (never clobber storage before the first read).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((product: CatalogProduct, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product.id === product.id);
      if (i === -1) return [...prev, { product, qty }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((x) => x.product.id !== id)
        : prev.map((x) => (x.product.id === id ? { ...x, qty } : x)),
    );
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((x) => x.product.id !== id)),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const qtyOf = useCallback(
    (id: string) => items.find((x) => x.product.id === id)?.qty ?? 0,
    [items],
  );

  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + x.product.priceGel * x.qty, 0);

  return { items, count, total, add, setQty, remove, clear, qtyOf };
}
