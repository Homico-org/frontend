'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import { Check, Clock, Package, Pencil, Plus, Store, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface Shop {
  _id: string;
  key: string;
  name: string;
  status: 'pending' | 'approved' | 'suspended';
  legalName?: string;
  logo?: string;
}

interface SellerProduct {
  _id: string;
  name: string;
  nameKa?: string;
  priceMinor: number;
  stockQty?: number;
  inStock?: boolean;
  category?: string;
  imageUrls?: string[];
}

const fmt = (minor: number) =>
  `${Math.round((minor || 0) / 100).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

type ProductForm = {
  name: string;
  nameKa: string;
  price: string;
  stockQty: string;
  category: string;
  imageUrl: string;
};

const EMPTY_FORM: ProductForm = { name: '', nameKa: '', price: '', stockQty: '', category: '', imageUrl: '' };

/**
 * Self-serve seller dashboard (Phase B). A shop owner creates their shop, then
 * lists + manages their own products and stock. Products flow into the same
 * supplier_products collection as scraped/feed shops, so they render in the
 * normal Homico shop once the shop is approved.
 */
export default function SellerDashboardPage() {
  const { pick } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);

  // Create-shop form
  const [shopName, setShopName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [payoutIban, setPayoutIban] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [creating, setCreating] = useState(false);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // CSV / Excel import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Shop | null>('/supplier-catalog/my-shop');
      setShop(data);
      if (data) {
        const res = await api.get<SellerProduct[]>('/supplier-catalog/my-shop/products');
        setProducts(res.data || []);
      }
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createShop = async () => {
    if (!shopName.trim()) return;
    setCreating(true);
    try {
      await api.post('/supplier-catalog/my-shop', {
        name: shopName.trim(),
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        payoutIban: payoutIban.trim() || undefined,
        deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
      });
      toast.success(pick({ en: 'Shop created', ka: 'მაღაზია შეიქმნა', ru: 'Магазин создан' }));
      await load();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Try again', ka: 'სცადეთ თავიდან', ru: 'Попробуйте снова' })));
    } finally {
      setCreating(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: SellerProduct) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      nameKa: p.nameKa || '',
      price: String(Math.round(p.priceMinor / 100)),
      stockQty: p.stockQty != null ? String(p.stockQty) : '',
      category: p.category || '',
      imageUrl: p.imageUrls?.[0] || '',
    });
    setModalOpen(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      nameKa: form.nameKa.trim() || undefined,
      price: form.price ? Number(form.price) : 0,
      stockQty: form.stockQty ? Number(form.stockQty) : undefined,
      category: form.category.trim() || undefined,
      imageUrls: form.imageUrl.trim() ? [form.imageUrl.trim()] : undefined,
    };
    try {
      if (editingId) {
        await api.patch(`/supplier-catalog/my-shop/products/${editingId}`, body);
      } else {
        await api.post('/supplier-catalog/my-shop/products', body);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Try again', ka: 'სცადეთ თავიდან', ru: 'Попробуйте снова' })));
    } finally {
      setSaving(false);
    }
  };

  // Read a CSV/Excel file → product rows. Columns matched by header keyword
  // (en/ka/ru), so a shop's own export "just works" without a fixed template.
  const parseFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const pickCol = (row: Record<string, unknown>, keys: string[]) => {
      const found = Object.keys(row).find((h) =>
        keys.some((k) => h.toLowerCase().includes(k)),
      );
      return found ? String(row[found]).trim() : '';
    };
    const num = (v: string) => {
      const n = parseFloat(v.replace(/[^\d.,-]/g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : undefined;
    };
    return rows
      .map((r) => {
        const name = pickCol(r, ['name', 'დასახელ', 'სახელ', 'наимен', 'назван', 'product']);
        if (!name) return null;
        const stock = num(pickCol(r, ['stock', 'მარაგ', 'qty', 'остат', 'количе']));
        return {
          name,
          price: num(pickCol(r, ['price', 'ფას', 'цена'])) ?? 0,
          stockQty: stock,
          category: pickCol(r, ['categ', 'კატეგორ', 'категор']) || undefined,
        };
      })
      .filter(Boolean);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    try {
      const products = await parseFile(file);
      if (!products.length) {
        toast.error(pick({ en: 'No products found in the file', ka: 'ფაილში პროდუქტები ვერ მოიძებნა', ru: 'В файле не найдено товаров' }));
        return;
      }
      const { data } = await api.post<{ created: number }>(
        '/supplier-catalog/my-shop/products/bulk',
        { products },
      );
      toast.success(
        pick({ en: 'Products imported', ka: 'პროდუქტები დაიმატა', ru: 'Товары импортированы' }),
        `${data?.created ?? products.length}`,
      );
      await load();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Import failed', ka: 'იმპორტი ვერ მოხერხდა', ru: 'Импорт не удался' })));
    } finally {
      setImporting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/supplier-catalog/my-shop/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Try again', ka: 'სცადეთ თავიდან', ru: 'Попробуйте снова' })));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── No shop yet → create form ──────────────────────────────────────────
  if (!shop) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-primary)]">
            <Store className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
              {pick({ en: 'Open your shop', ka: 'გახსენი მაღაზია', ru: 'Откройте магазин' })}
            </h1>
            <p className="text-[13px] text-[var(--hm-fg-muted)]">
              {pick({ en: 'Sell your products on Homico.', ka: 'გაყიდე შენი პროდუქტები Homico-ზე.', ru: 'Продавайте товары на Homico.' })}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <Input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder={pick({ en: 'Shop name', ka: 'მაღაზიის დასახელება', ru: 'Название магазина' })}
          />
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder={pick({ en: 'Legal entity (optional)', ka: 'იურიდიული პირი (არასავალდებულო)', ru: 'Юр. лицо (необязательно)' })}
          />
          <Input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder={pick({ en: 'Tax / company ID (optional)', ka: 'საიდენტიფიკაციო კოდი (არასავალდებულო)', ru: 'ИНН / ID компании (необязательно)' })}
          />
          <Input
            value={payoutIban}
            onChange={(e) => setPayoutIban(e.target.value)}
            placeholder={pick({ en: 'Payout IBAN (optional)', ka: 'ანგარიშის ნომერი / IBAN (არასავალდებულო)', ru: 'IBAN для выплат (необязательно)' })}
          />
          <Input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            placeholder={pick({ en: 'Delivery fee, ₾ (optional)', ka: 'მიწოდების საფასური, ₾ (არასავალდებულო)', ru: 'Стоимость доставки, ₾ (необязательно)' })}
          />
          <Button className="w-full" onClick={createShop} disabled={creating || !shopName.trim()}>
            {creating ? <LoadingSpinner size="sm" /> : pick({ en: 'Create shop', ka: 'შექმენი მაღაზია', ru: 'Создать магазин' })}
          </Button>
        </div>
      </div>
    );
  }

  // ── Shop exists → dashboard ────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-7">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--hm-fg-subtle)]">
            {pick({ en: 'My shop', ka: 'ჩემი მაღაზია', ru: 'Мой магазин' })}
          </p>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            {shop.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onImportFile}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            leftIcon={importing ? <LoadingSpinner size="sm" /> : <Upload className="h-4 w-4" />}
          >
            {pick({ en: 'Import', ka: 'იმპორტი', ru: 'Импорт' })}
          </Button>
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
            {pick({ en: 'Add product', ka: 'პროდუქტის დამატება', ru: 'Добавить товар' })}
          </Button>
        </div>
      </header>

      {/* Status banner */}
      {shop.status === 'pending' && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--hm-warning-500)]/30 bg-[var(--hm-warning-50)] p-3.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hm-warning-500)]" strokeWidth={2} />
          <p className="text-[13px] leading-relaxed text-[var(--hm-fg-secondary)]">
            {pick({
              en: 'Your shop is under review. Add your products now - they go live on Homico once our team approves the shop.',
              ka: 'თქვენი მაღაზია განხილვაშია. დაამატეთ პროდუქტები ახლავე - ისინი Homico-ზე გამოჩნდება, როგორც კი გუნდი დაამტკიცებს მაღაზიას.',
              ru: 'Ваш магазин на проверке. Добавляйте товары - они появятся на Homico, как только команда одобрит магазин.',
            })}
          </p>
        </div>
      )}
      {shop.status === 'approved' && (
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-success-500)]/[0.1] px-3 py-1 text-[12px] font-semibold text-[var(--hm-success-600)]">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          {pick({ en: 'Live on Homico', ka: 'აქტიურია Homico-ზე', ru: 'Активен на Homico' })}
        </div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
            <Package className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)]">
            {pick({ en: 'No products yet.', ka: 'ჯერ პროდუქტები არ არის.', ru: 'Пока нет товаров.' })}
          </p>
          <Button size="sm" variant="outline" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
            {pick({ en: 'Add your first product', ka: 'დაამატე პირველი პროდუქტი', ru: 'Добавьте первый товар' })}
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--hm-border-subtle)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {products.map((p) => (
            <div key={p._id} className="flex items-center gap-3 p-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-subtle)]">
                {p.imageUrls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Package className="h-5 w-5" strokeWidth={1.5} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--hm-fg-primary)]">{p.name}</p>
                <p className="text-[12px] text-[var(--hm-fg-muted)]">
                  {fmt(p.priceMinor)}
                  {p.stockQty != null && (
                    <span className={p.stockQty > 0 ? '' : 'text-[var(--hm-error-500)]'}>
                      {' · '}
                      {pick({ en: 'stock', ka: 'მარაგი', ru: 'склад' })} {p.stockQty}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(p)}
                aria-label="edit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteProduct(p._id)}
                aria-label="delete"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit product modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md" showCloseButton>
        <ModalHeader
          title={
            editingId
              ? pick({ en: 'Edit product', ka: 'პროდუქტის რედაქტირება', ru: 'Изменить товар' })
              : pick({ en: 'Add product', ka: 'პროდუქტის დამატება', ru: 'Добавить товар' })
          }
        />
        <ModalBody className="space-y-3">
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={pick({ en: 'Product name', ka: 'პროდუქტის დასახელება', ru: 'Название товара' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder={pick({ en: 'Price (₾)', ka: 'ფასი (₾)', ru: 'Цена (₾)' })}
            />
            <Input
              type="number"
              value={form.stockQty}
              onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
              placeholder={pick({ en: 'Stock qty', ka: 'მარაგი', ru: 'Кол-во' })}
            />
          </div>
          <Input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder={pick({ en: 'Category (optional)', ka: 'კატეგორია (არასავალდებულო)', ru: 'Категория (необязательно)' })}
          />
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder={pick({ en: 'Image URL (optional)', ka: 'სურათის ბმული (არასავალდებულო)', ru: 'URL картинки (необязательно)' })}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            {pick({ en: 'Cancel', ka: 'გაუქმება', ru: 'Отмена' })}
          </Button>
          <Button onClick={saveProduct} disabled={saving || !form.name.trim()}>
            {saving ? <LoadingSpinner size="sm" /> : pick({ en: 'Save', ka: 'შენახვა', ru: 'Сохранить' })}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
