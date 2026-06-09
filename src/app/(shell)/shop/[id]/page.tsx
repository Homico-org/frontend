'use client';

import BackButton from '@/components/common/BackButton';
import CatalogProductCard from '@/components/shop/CatalogProductCard';
import ProjectSelectModal from '@/components/projects/ProjectSelectModal';
import SupplierAvatar from '@/components/shop/SupplierAvatar';
import {
  CatalogProduct,
  CatalogSearchResponse,
  isRealProductImage,
  mapCatalogProduct,
  supplierLabel,
} from '@/components/shop/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/hooks/useCart';
import { useCartUI } from '@/contexts/CartUIContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Check,
  ExternalLink,
  Minus,
  Package,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const fmt = (n: number) =>
  `${n.toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, pick } = useLanguage();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const toast = useToast();
  const cart = useCart();
  const { openCart } = useCartUI();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  // Single-product "add to a project" picker. The cart drawer + checkout +
  // whole-cart-to-project flow live in the app-wide CartUIProvider.
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFailed(false);
    setActiveImg(0);
    setQty(1);
    api
      .get(`/supplier-catalog/products/${id}`)
      .then((r) => setProduct(mapCatalogProduct(r.data)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [id]);

  // More from the same shop - turns the page into a real destination and
  // lets you hop between products of one shop.
  useEffect(() => {
    if (!product) return;
    const supplierKey = product.supplierKey;
    const currentId = product.id;
    api
      .get<CatalogSearchResponse>('/supplier-catalog/products', {
        params: { supplierKey, limit: 12 },
      })
      .then((r) =>
        setRelated(
          (r.data.items || [])
            .map(mapCatalogProduct)
            .filter((p) => p.id !== currentId)
            .slice(0, 10),
        ),
      )
      .catch(() => setRelated([]));
  }, [product]);

  const name = product
    ? pick({ ka: product.nameKa, en: product.name }, product.name) ||
      product.name
    : '';

  // Keep the document title in sync for shareable links.
  useEffect(() => {
    if (name) document.title = `${name} · Homico`;
  }, [name]);

  // Real (non-placeholder) gallery images.
  const gallery = useMemo(() => {
    if (!product) return [];
    const urls = product.imageUrls?.length
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];
    return urls.filter(isRealProductImage);
  }, [product]);

  const inCartQty = product ? cart.qtyOf(product.id) : 0;

  const addToCart = () => {
    if (!product) return;
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

  // Push this single product into a project's shopping list.
  const onProjectSelect = async (projectId: string) => {
    if (!product) return;
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/products`, {
        name: product.name,
        qty,
        unitPrice: product.priceGel,
        vendor: supplierLabel(product.supplierKey),
        url: product.externalUrl,
        imageUrl: product.imageUrl || undefined,
        category: supplierLabel(product.supplierKey),
        status: 'to_buy',
      });
      setSelecting(false);
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex flex-col gap-4 pt-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="mt-4 h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (failed || !product) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-[var(--hm-fg-muted)]" />
        <p className="mt-3 text-[15px] font-semibold text-[var(--hm-fg-primary)]">
          {t('projects.catalogNotFound')}
        </p>
        <div className="mt-4 flex justify-center">
          <BackButton variant="minimal" label={t('projects.catalogBackToShop')} />
        </div>
      </div>
    );
  }

  const cover = gallery[activeImg];
  const lineSubtotal = product.priceGel * qty;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5">
      {/* Top bar: back + cart access (the path to checkout) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton variant="minimal" label={t('projects.catalogBackToShop')} />
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
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Gallery */}
        <div className="md:sticky md:top-4 md:self-start">
          <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                referrerPolicy="no-referrer"
                src={storage.getOptimizedImageUrl(cover, 'feedCard')}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--hm-fg-subtle)]">
                <Package className="h-14 w-14" strokeWidth={1.4} />
                <span className="text-[13px] font-medium">
                  {supplierLabel(product.supplierKey)}
                </span>
              </span>
            )}

            {cover && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
            )}
            {/* Shop tag - dark glass, matches the cards + modal */}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(17,16,13,0.55)] py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-md">
              <SupplierAvatar
                supplierKey={product.supplierKey}
                url={product.externalUrl}
                size={18}
              />
              {supplierLabel(product.supplierKey)}
            </span>
            {product.inStock === true && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--hm-success-600)] shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
                {t('projects.catalogInStock')}
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                    i === activeImg
                      ? 'border-[var(--hm-brand-500)] ring-2 ring-[var(--hm-brand-500)]/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    referrerPolicy="no-referrer"
                    src={storage.getOptimizedImageUrl(g, 'feedCard')}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--hm-fg-muted)]">
            {supplierLabel(product.supplierKey)}
          </p>

          <h1 className="mt-2.5 text-[26px] font-bold leading-snug tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            {name}
          </h1>
          {product.categoryLabel && (
            <p className="mt-1 text-[13px] text-[var(--hm-fg-muted)]">
              {product.categoryLabel}
            </p>
          )}

          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="text-[34px] font-bold tabular-nums tracking-[-0.02em] text-[var(--hm-brand-500)]">
              {fmt(product.priceGel)}
            </span>
            {!product.isAvailable && (
              <span className="text-[12px] font-semibold text-[var(--hm-fg-muted)]">
                {t('projects.catalogUnavailable')}
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-[13px] font-medium text-[var(--hm-fg-secondary)]">
              {t('projects.productQty')}
            </span>
            <div className="inline-flex items-center rounded-full border border-[var(--hm-border)]">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="-"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-fg-primary)]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-9 text-center text-[15px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="+"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-fg-primary)]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {inCartQty > 0 && (
              <span className="text-[12px] text-[var(--hm-fg-muted)]">
                {t('projects.inCart')} · {inCartQty}
              </span>
            )}
          </div>

          {/* Live line subtotal once buying more than one */}
          {qty > 1 && (
            <div className="mt-3 flex items-baseline gap-2 text-[13px]">
              <span className="text-[var(--hm-fg-muted)]">
                {t('projects.checkoutSubtotal')}
              </span>
              <span className="font-mono text-[12px] text-[var(--hm-fg-subtle)] tabular-nums">
                {qty} × {fmt(product.priceGel)}
              </span>
              <span className="ml-auto text-[16px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                {fmt(lineSubtotal)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              disabled={!product.isAvailable}
              onClick={addToCart}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('projects.addToCart')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={startAddToProject}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--hm-border)] text-[14px] font-semibold text-[var(--hm-fg-primary)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t('projects.cartAddToProject')}
            </button>
          </div>

          {/* Once something's in the cart, surface the checkout path right here */}
          {cart.count > 0 && (
            <button
              type="button"
              onClick={openCart}
              className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.06] text-[13px] font-semibold text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)]/[0.12]"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('projects.checkoutCta')}
              <span className="tabular-nums">· {fmt(cart.total)}</span>
            </button>
          )}

          <a
            href={product.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-brand-500)]"
          >
            {t('projects.catalogViewInShop')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* More from this shop */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <SupplierAvatar
              supplierKey={product.supplierKey}
              url={product.externalUrl}
              size={22}
            />
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
              {t('projects.catalogMoreFromShop')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <CatalogProductCard
                key={p.id}
                product={p}
                onPick={(prod) => {
                  cart.add(prod, 1);
                  toast.success(t('projects.productAddedToCart'));
                }}
                cartQty={cart.qtyOf(p.id)}
                onDecrement={(prod) => cart.setQty(prod.id, cart.qtyOf(prod.id) - 1)}
                onOpenDetail={(prod) => router.push(`/shop/${prod.id}`)}
                addLabelKey="projects.addToCart"
                cartMode
              />
            ))}
          </div>
        </section>
      )}

      <ProjectSelectModal
        isOpen={selecting}
        onClose={() => setSelecting(false)}
        onSelect={onProjectSelect}
        busyId={busy ? 'one' : null}
      />
    </div>
  );
}
