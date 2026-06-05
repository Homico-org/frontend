'use client';

import BackButton from '@/components/common/BackButton';
import ProjectSelectModal from '@/components/projects/ProjectSelectModal';
import SupplierAvatar from '@/components/shop/SupplierAvatar';
import {
  CatalogProduct,
  isRealProductImage,
  mapCatalogProduct,
  supplierLabel,
} from '@/components/shop/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/hooks/useCart';
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
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const fmt = (n: number) => `${n.toLocaleString()} ₾`;

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { t, pick } = useLanguage();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const toast = useToast();
  const cart = useCart();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selecting, setSelecting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/supplier-catalog/products/${id}`)
      .then((r) => setProduct(mapCatalogProduct(r.data)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [id]);

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

  const addToProject = async (projectId: string) => {
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
        // Group by shop (matches CatalogPickerModal / cart) - scraped leaf
        // categories are too granular.
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
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  if (failed || !product) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-10 text-center">
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

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-5">
      <BackButton
        variant="minimal"
        label={t('projects.catalogBackToShop')}
        className="mb-4"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
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
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                    i === activeImg
                      ? 'border-[var(--hm-brand-500)]'
                      : 'border-transparent hover:border-[var(--hm-border)]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-bg-tertiary)] py-0.5 pl-0.5 pr-2.5 text-[12px] font-semibold text-[var(--hm-fg-secondary)]">
              <SupplierAvatar
                supplierKey={product.supplierKey}
                url={product.externalUrl}
                size={20}
              />
              {supplierLabel(product.supplierKey)}
            </span>
            {product.inStock === true && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-success-600)]">
                <Check className="h-3.5 w-3.5" />
                {t('projects.catalogInStock')}
              </span>
            )}
            {!product.isAvailable && (
              <span className="text-[12px] font-semibold text-[var(--hm-fg-muted)]">
                {t('projects.catalogUnavailable')}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[22px] font-bold leading-snug text-[var(--hm-fg-primary)]">
            {name}
          </h1>
          {product.categoryLabel && (
            <p className="mt-1 text-[13px] text-[var(--hm-fg-muted)]">
              {product.categoryLabel}
            </p>
          )}

          <div className="mt-5 text-[32px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
            {fmt(product.priceGel)}
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

      <ProjectSelectModal
        isOpen={selecting}
        onClose={() => setSelecting(false)}
        onSelect={addToProject}
        busyId={busy ? 'one' : null}
      />
    </div>
  );
}
