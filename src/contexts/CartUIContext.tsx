'use client';

import CartDrawer from '@/components/shop/CartDrawer';
import CheckoutModal from '@/components/shop/CheckoutModal';
import ProjectSelectModal from '@/components/projects/ProjectSelectModal';
import { supplierLabel } from '@/components/shop/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/hooks/useCart';
import { api } from '@/lib/api';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface CartUIValue {
  /** Open the shared cart drawer from anywhere (e.g. the header). */
  openCart: () => void;
}

const CartUIContext = createContext<CartUIValue | null>(null);

/**
 * App-wide cart surfaces: one drawer + checkout + "add cart to a project"
 * flow, mounted once near the root so the header (and any page) can open the
 * cart without each page wiring its own copy. The cart data itself lives in the
 * shared useCart store, so the count stays in sync everywhere.
 */
export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const toast = useToast();
  const cart = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const openCart = useCallback(() => setCartOpen(true), []);

  const startCheckout = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (cart.items.length === 0) return;
    setCartOpen(false);
    setCheckingOut(true);
  };

  const startAddToProject = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setSelecting(true);
  };

  const addCartToProject = async (projectId: string) => {
    if (cart.items.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(
        cart.items.map(({ product, qty }) =>
          api.post(`/projects/${projectId}/products`, {
            name: product.name,
            qty,
            unitPrice: product.priceGel,
            vendor: supplierLabel(product.supplierKey),
            url: product.externalUrl,
            imageUrl: product.imageUrl || undefined,
            category: supplierLabel(product.supplierKey),
            status: 'to_buy',
          }),
        ),
      );
      cart.clear();
      setSelecting(false);
      setCartOpen(false);
      toast.success(t('projects.cartAddedToProject'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setBusy(false);
    }
  };

  const value = useMemo(() => ({ openCart }), [openCart]);

  return (
    <CartUIContext.Provider value={value}>
      {children}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        total={cart.total}
        setQty={cart.setQty}
        remove={cart.remove}
        clear={cart.clear}
        onAddToProject={startAddToProject}
        onCheckout={startCheckout}
        busy={busy}
      />

      <CheckoutModal
        isOpen={checkingOut}
        onClose={() => setCheckingOut(false)}
        items={cart.items}
        onOrderPlaced={() => cart.clear()}
      />

      <ProjectSelectModal
        isOpen={selecting}
        onClose={() => setSelecting(false)}
        onSelect={addCartToProject}
        busyId={busy ? 'cart' : null}
      />
    </CartUIContext.Provider>
  );
}

export function useCartUI(): CartUIValue {
  const ctx = useContext(CartUIContext);
  if (!ctx) {
    // Safe no-op fallback so a stray caller outside the provider never crashes.
    return { openCart: () => {} };
  }
  return ctx;
}
