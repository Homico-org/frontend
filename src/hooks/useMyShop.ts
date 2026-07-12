'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface MyShopLite {
  key: string;
  name: string;
  status: 'pending' | 'approved' | 'suspended';
  logo?: string;
}

/**
 * The self-serve shop owned by the current user, or null if they have none.
 * Fetches per-mount and gates on auth (no shared module cache) so a logout
 * can't leak one user's shop into the next session on the same tab.
 */
export function useMyShop() {
  const { isAuthenticated } = useAuth();
  const [shop, setShop] = useState<MyShopLite | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShop(null);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .get<MyShopLite | null>('/supplier-catalog/my-shop')
      .then(({ data }) => {
        if (alive) setShop(data || null);
      })
      .catch(() => {
        if (alive) setShop(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  return { shop, loading };
}
