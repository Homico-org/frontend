'use client';

import CatalogSearch from '@/components/shop/CatalogSearch';
import ProductDetailModal from '@/components/shop/ProductDetailModal';
import { CatalogProduct } from '@/components/shop/types';
import { useCart } from '@/hooks/useCart';
import { useCartUI } from '@/contexts/CartUIContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

const fmt = (n: number) => `${n.toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

/**
 * Standalone cross-shop store. Search every supplier in one place, browse by
 * category, open a product, build a cart, then check out or push the cart into
 * a project. The cart drawer + checkout live in the app-wide CartUIProvider, so
 * the same cart is reachable from here and from the global header.
 */
export default function ShopPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const cart = useCart();
  const { openCart } = useCartUI();

  const [detail, setDetail] = useState<CatalogProduct | null>(null);

  const addToCart = (product: CatalogProduct, qty = 1) => {
    cart.add(product, qty);
    toast.success(t('projects.productAddedToCart'));
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-7">
      <header className="mb-4 sm:mb-7">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--hm-fg-muted)] sm:mb-2 sm:text-[11px]">
          {t('header.shop')}
        </p>
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[34px]">
          {t('projects.catalogTitle')}
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] text-[var(--hm-fg-muted)] sm:mt-2 sm:text-[14px]">
          {t('projects.catalogShopSubtitle')}
        </p>
      </header>

      <CatalogSearch
        onPick={(p) => addToCart(p)}
        onOpenDetail={setDetail}
        cartQtyOf={cart.qtyOf}
        onDecrement={(p) => cart.setQty(p.id, cart.qtyOf(p.id) - 1)}
        addLabelKey="projects.addToCart"
        cartMode
        sticky
        endSlot={
          <button
            type="button"
            onClick={openCart}
            aria-label={t('projects.cartOpen')}
            className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              cart.count > 0
                ? 'bg-[var(--hm-brand-500)] text-white hover:bg-[var(--hm-brand-600)]'
                : 'border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {cart.count > 0 ? (
              <span className="tabular-nums">
                {cart.count} · {fmt(cart.total)}
              </span>
            ) : (
              <span className="hidden sm:inline">{t('projects.cartTitle')}</span>
            )}
          </button>
        }
        gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />

      <ProductDetailModal
        product={detail}
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        onAddToCart={addToCart}
        inCartQty={detail ? cart.qtyOf(detail.id) : 0}
      />
    </div>
  );
}
