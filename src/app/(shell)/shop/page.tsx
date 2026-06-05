'use client';

import CatalogSearch from '@/components/shop/CatalogSearch';
import CartDrawer from '@/components/shop/CartDrawer';
import CheckoutModal from '@/components/shop/CheckoutModal';
import ProductDetailModal from '@/components/shop/ProductDetailModal';
import ProjectSelectModal from '@/components/projects/ProjectSelectModal';
import { CatalogProduct, supplierLabel } from '@/components/shop/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

/**
 * Standalone cross-shop store. Search every supplier in one place, browse by
 * category, open a product, build a cart, then push the whole cart into one
 * of your projects' shopping lists at once. Checkout is link-out per supplier
 * (v1); the in-app buy flow plugs in here when payments land.
 */
export default function ShopPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const toast = useToast();
  const cart = useCart();

  const [detail, setDetail] = useState<CatalogProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [busy, setBusy] = useState(false);

  const startCheckout = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (cart.items.length === 0) return;
    setCartOpen(false);
    setCheckingOut(true);
  };

  const addToCart = (product: CatalogProduct, qty = 1) => {
    cart.add(product, qty);
    toast.success(t('projects.productAddedToCart'));
  };

  const startAddToProject = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setSelecting(true);
  };

  // Push the whole cart into a project's shopping list, then empty the cart.
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
            // Group by shop, not the scraped leaf category - those are too
            // granular (every product becomes its own one-item group).
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

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-[22px] font-bold text-[var(--hm-fg-primary)]">
            <ShoppingBag className="h-6 w-6 text-[var(--hm-brand-500)]" />
            {t('projects.catalogTitle')}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--hm-fg-muted)]">
            {t('projects.catalogShopSubtitle')}
          </p>
        </div>

        {/* Cart button */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={t('projects.cartOpen')}
          className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-4 text-[13px] font-semibold text-[var(--hm-fg-primary)] shadow-sm transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">{t('projects.cartTitle')}</span>
          {cart.count > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--hm-brand-500)] px-1 text-[11px] font-bold tabular-nums text-white">
              {cart.count}
            </span>
          )}
        </button>
      </header>

      <CatalogSearch
        onPick={(p) => addToCart(p)}
        onOpenDetail={setDetail}
        cartQtyOf={cart.qtyOf}
        onDecrement={(p) => cart.setQty(p.id, cart.qtyOf(p.id) - 1)}
        addLabelKey="projects.addToCart"
        cartMode
        gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />

      <ProductDetailModal
        product={detail}
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        onAddToCart={addToCart}
        inCartQty={detail ? cart.qtyOf(detail.id) : 0}
      />

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
    </div>
  );
}
