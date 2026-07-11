'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Toggle } from '@/components/ui/Toggle';
import ProductCard from '@/components/shop/ProductCard';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { extractApiErrorMessage } from '@/utils/errorUtils';
import {
  ArrowUpRight,
  Check,
  Download,
  ImagePlus,
  Minus,
  Package,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type Loc = { en: string; ka: string; ru: string };

interface Shop {
  _id: string;
  key: string;
  name: string;
  status: 'pending' | 'approved' | 'suspended';
  legalName?: string;
  logo?: string;
  taxId?: string;
  payoutIban?: string;
  deliveryFeeMinor?: number;
}

interface SellerProduct {
  _id: string;
  name: string;
  nameKa?: string;
  priceMinor: number;
  stockQty?: number;
  inStock?: boolean;
  isAvailable?: boolean;
  category?: string;
  categoryLabel?: string;
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

export default function SellerDashboardPage() {
  const { pick } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!shop) return <Onboarding pick={pick} onCreated={load} />;
  return <Dashboard shop={shop} products={products} setProducts={setProducts} onChanged={load} pick={pick} />;
}

/* ─────────────────────────── Onboarding ─────────────────────────── */

function GroupCaption({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 pt-2">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
        {n} / {label}
      </span>
      <span className="h-px flex-1 bg-[var(--hm-border-subtle)]" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--hm-fg-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function Onboarding({ pick, onCreated }: { pick: (l: Loc) => string; onCreated: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [iban, setIban] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [logo, setLogo] = useState<string | null>(null); // preview only
  const [creating, setCreating] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/supplier-catalog/my-shop', {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        payoutIban: iban.trim() || undefined,
        deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
      });
      toast.success(pick({ en: 'Shop created', ka: 'მაღაზია შეიქმნა', ru: 'Магазин создан' }));
      onCreated();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Try again', ka: 'სცადეთ თავიდან', ru: 'Попробуйте снова' })));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--hm-fg-subtle)]">
            {pick({ en: 'Open a shop', ka: 'გახსენი მაღაზია', ru: 'Открыть магазин' })}
          </p>
          <h1 className="text-[26px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[34px]">
            {pick({ en: 'Sell on Homico', ka: 'გაყიდე Homico-ზე', ru: 'Продавайте на Homico' })}
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--hm-fg-muted)]">
            {pick({
              en: 'List your products where people are already renovating. Set it up once - takes a minute.',
              ka: 'გამოიტანე პროდუქტები იქ, სადაც ხალხი უკვე არემონტებს. ერთხელ დააყენე - წუთის საქმეა.',
              ru: 'Разместите товары там, где люди уже делают ремонт. Настройка займёт минуту.',
            })}
          </p>

          <div className="mt-8 space-y-8">
            {/* 01 Identity */}
            <div className="space-y-4">
              <GroupCaption n="01" label={pick({ en: 'Identity', ka: 'იდენტობა', ru: 'Профиль' })} />
              <div className="flex items-start gap-4">
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="group relative flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-fg-primary)]"
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" strokeWidth={1.6} />
                      <span className="font-mono text-[9px] uppercase tracking-wide">Logo</span>
                    </>
                  )}
                </button>
                <div className="flex-1">
                  <Field label={pick({ en: 'Shop name', ka: 'მაღაზიის დასახელება', ru: 'Название магазина' })}>
                    <Input variant="filled" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <p className="mt-1.5 text-[11.5px] text-[var(--hm-fg-muted)]">
                    {pick({ en: 'How buyers find you across Homico.', ka: 'ასე გპოვებენ მყიდველები Homico-ზე.', ru: 'Так покупатели находят вас на Homico.' })}
                  </p>
                </div>
              </div>
            </div>

            {/* 02 Legal & payout */}
            <div className="space-y-4">
              <GroupCaption n="02" label={pick({ en: 'Legal & payout', ka: 'იურიდიული და გადახდა', ru: 'Реквизиты' })} />
              <p className="-mt-1 text-[11.5px] text-[var(--hm-fg-muted)]">
                {pick({ en: 'So we can pay you out and invoice. You can add these later.', ka: 'რომ თანხა გადმოგირიცხოთ. მოგვიანებითაც შეგიძლია.', ru: 'Чтобы выплачивать и выставлять счета. Можно добавить позже.' })}
              </p>
              <Field label={pick({ en: 'Legal entity', ka: 'იურიდიული პირი', ru: 'Юр. лицо' })}>
                <Input variant="filled" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={pick({ en: 'Tax / company ID', ka: 'საიდენტიფიკაციო კოდი', ru: 'ИНН' })}>
                  <Input variant="filled" className="font-mono" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </Field>
                <Field label={pick({ en: 'Payout IBAN', ka: 'ანგარიში / IBAN', ru: 'IBAN' })}>
                  <Input variant="filled" className="font-mono" value={iban} onChange={(e) => setIban(e.target.value)} />
                </Field>
              </div>
            </div>

            {/* 03 Delivery */}
            <div className="space-y-4">
              <GroupCaption n="03" label={pick({ en: 'Delivery', ka: 'მიწოდება', ru: 'Доставка' })} />
              <Field label={pick({ en: 'Delivery fee, ₾', ka: 'მიწოდების საფასური, ₾', ru: 'Стоимость доставки, ₾' })}>
                <Input variant="filled" type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
              </Field>
              <p className="-mt-2 text-[11.5px] text-[var(--hm-fg-muted)]">
                {pick({ en: 'Leave empty for free delivery.', ka: 'ცარიელი დატოვე უფასო მიწოდებისთვის.', ru: 'Оставьте пустым для бесплатной доставки.' })}
              </p>
            </div>

            <Button className="w-full sm:w-auto" onClick={create} disabled={creating || !name.trim()}>
              {creating ? <LoadingSpinner size="sm" /> : pick({ en: 'Open my shop', ka: 'გახსენი ჩემი მაღაზია', ru: 'Открыть магазин' })}
            </Button>
          </div>
        </div>

        {/* Live preview rail */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-subtle)]">
              {pick({ en: 'Preview', ka: 'გადახედვა', ru: 'Превью' })}
            </p>
            <ProductCard
              name={pick({ en: 'Your product', ka: 'შენი პროდუქტი', ru: 'Ваш товар' })}
              vendorLabel={name.trim() || pick({ en: 'Your shop', ka: 'შენი მაღაზია', ru: 'Ваш магазин' })}
              priceLabel="—"
              inStock
            />
            <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--hm-fg-muted)]">
              {pick({ en: 'This is how your products will appear in the Homico shop.', ka: 'ასე გამოჩნდება შენი პროდუქტები Homico-ს მაღაზიაში.', ru: 'Так ваши товары появятся в магазине Homico.' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Dashboard ─────────────────────────── */

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="px-0 sm:px-5 sm:first:pl-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--hm-fg-subtle)]">{label}</p>
      <p
        className={`mt-1 text-[24px] font-bold tabular-nums tracking-[-0.03em] sm:text-[26px] ${
          alert ? 'text-[var(--hm-brand-500)]' : 'text-[var(--hm-fg-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type Avail = 'all' | 'in' | 'out';
type Sort = 'name' | 'price' | 'stock';

function Dashboard({
  shop,
  products,
  setProducts,
  onChanged,
  pick,
}: {
  shop: Shop;
  products: SellerProduct[];
  setProducts: React.Dispatch<React.SetStateAction<SellerProduct[]>>;
  onChanged: () => void;
  pick: (l: Loc) => string;
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [avail, setAvail] = useState<Avail>('all');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<Sort>('name');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<'inventory' | 'orders'>('inventory');

  // ── stats ──
  const stats = useMemo(() => {
    const inStock = products.filter((p) => (p.stockQty ?? 1) > 0 && p.isAvailable !== false).length;
    const out = products.filter((p) => p.stockQty === 0 || p.isAvailable === false).length;
    const value = products.reduce((s, p) => s + p.priceMinor, 0);
    return { total: products.length, inStock, out, value };
  }, [products]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => (p.category || '').trim()).filter(Boolean))],
    [products],
  );

  const visible = useMemo(() => {
    let list = products;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.name + ' ' + (p.nameKa || '')).toLowerCase().includes(q));
    if (category) list = list.filter((p) => (p.category || '') === category);
    if (avail === 'in') list = list.filter((p) => (p.stockQty ?? 1) > 0 && p.isAvailable !== false);
    if (avail === 'out') list = list.filter((p) => p.stockQty === 0 || p.isAvailable === false);
    const sorted = [...list].sort((a, b) => {
      if (sort === 'price') return a.priceMinor - b.priceMinor;
      if (sort === 'stock') return (a.stockQty ?? -1) - (b.stockQty ?? -1);
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [products, query, category, avail, sort]);

  // ── optimistic patch helpers ──
  const patchProduct = async (id: string, body: Partial<SellerProduct> & Record<string, unknown>) => {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, ...body } : p)));
    try {
      await api.patch(`/supplier-catalog/my-shop/products/${id}`, body);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Save failed', ka: 'ვერ შეინახა', ru: 'Не сохранено' })));
      onChanged();
    }
  };

  const setStock = (p: SellerProduct, next: number) => {
    const qty = Math.max(0, next);
    patchProduct(p._id, { stockQty: qty, inStock: qty > 0 });
  };
  const toggleAvail = (p: SellerProduct) => {
    const nextAvail = !(p.isAvailable !== false);
    patchProduct(p._id, { isAvailable: nextAvail });
  };

  // ── add / edit ──
  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: SellerProduct) => {
    setEditingId(p._id);
    setForm({
      name: p.name, nameKa: p.nameKa || '',
      price: String(Math.round(p.priceMinor / 100)),
      stockQty: p.stockQty != null ? String(p.stockQty) : '',
      category: p.category || '', imageUrl: p.imageUrls?.[0] || '',
    });
    setModalOpen(true);
  };
  const saveProduct = async (again: boolean) => {
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
      if (editingId) await api.patch(`/supplier-catalog/my-shop/products/${editingId}`, body);
      else await api.post('/supplier-catalog/my-shop/products', body);
      await onChanged();
      if (again && !editingId) setForm(EMPTY_FORM);
      else setModalOpen(false);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Try again', ka: 'სცადეთ თავიდან', ru: 'Попробуйте снова' })));
    } finally {
      setSaving(false);
    }
  };

  const deleteOne = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
    try { await api.delete(`/supplier-catalog/my-shop/products/${id}`); }
    catch { onChanged(); }
  };
  const bulkDelete = async () => {
    const ok = await confirm({
      title: pick({ en: 'Delete products?', ka: 'წავშალო პროდუქტები?', ru: 'Удалить товары?' }),
      description: pick({ en: `${selected.size} products will be removed.`, ka: `${selected.size} პროდუქტი წაიშლება.`, ru: `${selected.size} товаров будет удалено.` }),
      confirmLabel: pick({ en: 'Delete', ka: 'წაშლა', ru: 'Удалить' }),
      variant: 'danger',
    });
    if (!ok) return;
    const ids = [...selected];
    setProducts((prev) => prev.filter((p) => !selected.has(p._id)));
    setSelected(new Set());
    await Promise.all(ids.map((id) => api.delete(`/supplier-catalog/my-shop/products/${id}`).catch(() => {})));
    onChanged();
  };

  // ── import ──
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Name (KA)', 'Price', 'Stock', 'Category'],
      ['Ceramic tile 60x60', 'კერამიკული ფილა', 42, 120, 'tile'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'homico-products-template.xlsx');
  };
  const parseFile = async (file: File) => {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const col = (r: Record<string, unknown>, keys: string[]) => {
      const h = Object.keys(r).find((k) => keys.some((x) => k.toLowerCase().includes(x)));
      return h ? String(r[h]).trim() : '';
    };
    const num = (v: string) => { const n = parseFloat(v.replace(/[^\d.,-]/g, '').replace(',', '.')); return Number.isFinite(n) ? n : undefined; };
    return rows.map((r) => {
      const name = col(r, ['name', 'დასახელ', 'სახელ', 'наимен', 'назван', 'product']);
      if (!name) return null;
      return { name, price: num(col(r, ['price', 'ფას', 'цена'])) ?? 0, stockQty: num(col(r, ['stock', 'მარაგ', 'qty', 'остат', 'количе'])), category: col(r, ['categ', 'კატეგორ', 'категор']) || undefined };
    }).filter(Boolean);
  };
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const productsPayload = await parseFile(file);
      if (!productsPayload.length) { toast.error(pick({ en: 'No products found', ka: 'პროდუქტები ვერ მოიძებნა', ru: 'Товары не найдены' })); return; }
      const { data } = await api.post<{ created: number }>('/supplier-catalog/my-shop/products/bulk', { products: productsPayload });
      toast.success(pick({ en: 'Imported', ka: 'დაიმატა', ru: 'Импортировано' }), `${data?.created ?? productsPayload.length}`);
      setImportOpen(false);
      await onChanged();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Import failed', ka: 'იმპორტი ვერ მოხერხდა', ru: 'Импорт не удался' })));
    } finally { setImporting(false); }
  };

  const statusLabel = pick(
    shop.status === 'approved'
      ? { en: 'Live', ka: 'აქტიური', ru: 'Активен' }
      : shop.status === 'suspended'
        ? { en: 'Suspended', ka: 'შეჩერებული', ru: 'Приостановлен' }
        : { en: 'Under review', ka: 'განხილვაში', ru: 'На проверке' },
  );
  const statusCls =
    shop.status === 'approved'
      ? 'bg-[var(--hm-success-500)]/[0.12] text-[var(--hm-success-600)]'
      : shop.status === 'suspended'
        ? 'bg-[var(--hm-error-500)]/[0.12] text-[var(--hm-error-500)]'
        : 'bg-[var(--hm-warning-500)]/[0.12] text-[var(--hm-warning-600)]';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--hm-fg-subtle)]">
            {pick({ en: 'My shop', ka: 'ჩემი მაღაზია', ru: 'Мой магазин' })} · #{shop.key.slice(-6)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--hm-fg-primary)]">{shop.name}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCls}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="mt-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--hm-border-subtle)] px-3 text-[12px] font-medium text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">{pick({ en: 'Shop settings', ka: 'პარამეტრები', ru: 'Настройки' })}</span>
        </button>
      </header>

      {/* Metric strip - bare on surface */}
      <div className="grid grid-cols-2 gap-y-5 border-y border-[var(--hm-border-subtle)] py-5 sm:grid-cols-4 sm:divide-x sm:divide-[var(--hm-border-subtle)]">
        <Metric label={pick({ en: 'Products', ka: 'პროდუქტი', ru: 'Товары' })} value={String(stats.total)} />
        <Metric label={pick({ en: 'In stock', ka: 'მარაგში', ru: 'В наличии' })} value={String(stats.inStock)} />
        <Metric label={pick({ en: 'Out of stock', ka: 'ამოწურული', ru: 'Нет в наличии' })} value={String(stats.out)} alert={stats.out > 0} />
        <Metric label={pick({ en: 'Value', ka: 'ღირებულება', ru: 'Стоимость' })} value={fmt(stats.value)} />
      </div>

      {/* Pending banner */}
      {shop.status === 'pending' && (
        <div className="mt-5 rounded-xl border border-[var(--hm-warning-500)]/30 bg-[var(--hm-warning-50)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--hm-fg-secondary)]">
          {pick({
            en: 'Your shop is under review. Add products now - they go live once approved.',
            ka: 'მაღაზია განხილვაშია. დაამატე პროდუქტები ახლავე - დამტკიცების შემდეგ გამოჩნდება.',
            ru: 'Магазин на проверке. Добавляйте товары - появятся после одобрения.',
          })}
        </div>
      )}

      {/* Tabs - Inventory / Orders */}
      <div className="mt-6 flex items-center gap-6 border-b border-[var(--hm-border-subtle)]">
        {(['inventory', 'orders'] as const).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setTab(tk)}
            className={`-mb-px border-b-2 pb-2.5 text-[13px] font-semibold transition-colors ${
              tab === tk
                ? 'border-[var(--hm-brand-500)] text-[var(--hm-fg-primary)]'
                : 'border-transparent text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]'
            }`}
          >
            {tk === 'inventory'
              ? pick({ en: 'Inventory', ka: 'მარაგი', ru: 'Склад' })
              : pick({ en: 'Orders', ka: 'შეკვეთები', ru: 'Заказы' })}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <ShopOrdersPanel pick={pick} />
      ) : (
      <>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 mt-5 flex flex-wrap items-center gap-2 bg-[var(--hm-bg-page)]/90 py-2 backdrop-blur">
        <div className="min-w-[180px] flex-1">
          <SearchInput value={query} onValueChange={setQuery} variant="filled" placeholder={pick({ en: 'Search products', ka: 'ძებნა', ru: 'Поиск' })} />
        </div>
        {(['all', 'in', 'out'] as Avail[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvail(a)}
            className={`h-9 shrink-0 rounded-full border px-3 text-[12px] font-medium transition-colors ${
              avail === a
                ? 'border-[var(--hm-fg-primary)] bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                : 'border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-muted)]'
            }`}
          >
            {a === 'all' ? pick({ en: 'All', ka: 'ყველა', ru: 'Все' }) : a === 'in' ? pick({ en: 'In stock', ka: 'მარაგში', ru: 'В наличии' }) : pick({ en: 'Out', ka: 'ამოწურული', ru: 'Нет' })}
          </button>
        ))}
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 shrink-0 rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[12px] font-medium text-[var(--hm-fg-secondary)]"
          >
            <option value="">{pick({ en: 'All categories', ka: 'ყველა კატეგორია', ru: 'Все категории' })}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-9 shrink-0 rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[12px] font-medium text-[var(--hm-fg-secondary)]"
        >
          <option value="name">{pick({ en: 'Sort: Name', ka: 'დახარისხება: სახელი', ru: 'Сорт.: Имя' })}</option>
          <option value="price">{pick({ en: 'Sort: Price', ka: 'დახარისხება: ფასი', ru: 'Сорт.: Цена' })}</option>
          <option value="stock">{pick({ en: 'Sort: Stock', ka: 'დახარისხება: მარაგი', ru: 'Сорт.: Склад' })}</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
            {pick({ en: 'Import', ka: 'იმპორტი', ru: 'Импорт' })}
          </Button>
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
            {pick({ en: 'Add', ka: 'დამატება', ru: 'Добавить' })}
          </Button>
        </div>
      </div>

      {/* Table / empty */}
      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-6 py-16 text-center">
          <h3 className="text-[16px] font-semibold text-[var(--hm-fg-primary)]">
            {pick({ en: 'Your shelves are empty', ka: 'თაროები ცარიელია', ru: 'Полки пусты' })}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-[var(--hm-fg-muted)]">
            {pick({ en: 'Add your first product, or import your whole catalog from a spreadsheet.', ka: 'დაამატე პირველი პროდუქტი, ან შემოიტანე მთელი კატალოგი ცხრილიდან.', ru: 'Добавьте первый товар или импортируйте весь каталог из таблицы.' })}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Button size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
              {pick({ en: 'Add first product', ka: 'დაამატე პირველი', ru: 'Добавить первый' })}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
              {pick({ en: 'Import spreadsheet', ka: 'შემოიტანე ცხრილი', ru: 'Импорт таблицы' })}
            </Button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[13px] text-[var(--hm-fg-muted)]">
          {pick({ en: 'No products match your filters.', ka: 'ფილტრს არაფერი ემთხვევა.', ru: 'Ничего не найдено.' })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {visible.map((p) => {
            const isSel = selected.has(p._id);
            const on = p.isAvailable !== false;
            const oos = p.stockQty === 0;
            return (
              <div key={p._id} className="flex items-center gap-3 border-b border-[var(--hm-border-subtle)] px-3 py-2.5 last:border-0">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={(e) => setSelected((prev) => { const n = new Set(prev); if (e.target.checked) n.add(p._id); else n.delete(p._id); return n; })}
                  className="h-4 w-4 shrink-0 accent-[var(--hm-brand-500)]"
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-subtle)]">
                  {p.imageUrls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : <Package className="h-4 w-4" strokeWidth={1.5} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13.5px] font-semibold ${on ? 'text-[var(--hm-fg-primary)]' : 'text-[var(--hm-fg-muted)] line-through'}`}>{p.name}</p>
                  {p.category && <p className="truncate font-mono text-[10px] uppercase tracking-wide text-[var(--hm-fg-subtle)]">{p.category}</p>}
                </div>
                <span className="w-[76px] shrink-0 text-right text-[13.5px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">{fmt(p.priceMinor)}</span>
                {/* inline stock stepper */}
                {p.stockQty != null ? (
                  <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-[var(--hm-border-subtle)]">
                    <button type="button" onClick={() => setStock(p, (p.stockQty ?? 0) - 1)} className="flex h-8 w-7 items-center justify-center text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"><Minus className="h-3 w-3" /></button>
                    <input
                      value={p.stockQty}
                      onChange={(e) => { const v = parseInt(e.target.value.replace(/\D/g, ''), 10); setProducts((prev) => prev.map((x) => x._id === p._id ? { ...x, stockQty: Number.isFinite(v) ? v : 0 } : x)); }}
                      onBlur={(e) => setStock(p, parseInt(e.target.value, 10) || 0)}
                      className={`h-8 w-10 border-x border-[var(--hm-border-subtle)] bg-transparent text-center text-[12.5px] font-semibold tabular-nums outline-none ${oos ? 'text-[var(--hm-error-500)]' : 'text-[var(--hm-fg-primary)]'}`}
                    />
                    <button type="button" onClick={() => setStock(p, (p.stockQty ?? 0) + 1)} className="flex h-8 w-7 items-center justify-center text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"><Plus className="h-3 w-3" /></button>
                  </div>
                ) : <span className="w-[92px] shrink-0 text-center font-mono text-[10px] uppercase text-[var(--hm-fg-subtle)]">—</span>}
                <Toggle checked={on} onChange={() => toggleAvail(p)} size="sm" className="shrink-0" />
                <button type="button" onClick={() => openEdit(p)} aria-label="edit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => deleteOne(p._id)} aria-label="delete" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--hm-fg-muted)] hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(560px,92%)] items-center gap-3 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-3 shadow-[0_12px_40px_-12px_rgba(17,16,13,0.3)]">
          <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
            {selected.size} {pick({ en: 'selected', ka: 'არჩეული', ru: 'выбрано' })}
          </span>
          <Button size="sm" variant="outline" onClick={bulkDelete} leftIcon={<Trash2 className="h-3.5 w-3.5" />} className="ml-auto text-[var(--hm-error-500)]">
            {pick({ en: 'Delete', ka: 'წაშლა', ru: 'Удалить' })}
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"><X className="h-4 w-4" /></button>
        </div>
      )}
      </>
      )}

      {/* Import modal */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} size="md" showCloseButton>
        <ModalHeader title={pick({ en: 'Import products', ka: 'პროდუქტების იმპორტი', ru: 'Импорт товаров' })} />
        <ModalBody className="space-y-4">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onImportFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-tertiary)] px-4 py-10 text-center transition-colors hover:border-[var(--hm-fg-primary)]"
          >
            {importing ? <LoadingSpinner size="md" /> : <Upload className="h-6 w-6 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />}
            <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
              {pick({ en: 'Drop a CSV or Excel file', ka: 'ჩააგდე CSV ან Excel ფაილი', ru: 'Загрузите CSV или Excel' })}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--hm-fg-subtle)]">
              name · price · stock · category
            </span>
          </button>
          <p className="text-[12px] leading-relaxed text-[var(--hm-fg-muted)]">
            {pick({
              en: 'Already have a spreadsheet? Just drop it in - we auto-detect your columns (Georgian, English or Russian headers).',
              ka: 'უკვე გაქვს ცხრილი? უბრალოდ ჩააგდე - სვეტებს ავტომატურად ვცნობთ (ქართული, ინგლისური ან რუსული სათაურები).',
              ru: 'Уже есть таблица? Просто загрузите - мы определим колонки (загол. на груз., англ. или рус.).',
            })}
          </p>
          <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--hm-brand-500)] hover:underline">
            <Download className="h-3.5 w-3.5" />
            {pick({ en: 'Download a template', ka: 'ჩამოტვირთე შაბლონი', ru: 'Скачать шаблон' })}
          </button>
        </ModalBody>
      </Modal>

      {/* Add / edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md" showCloseButton>
        <ModalHeader title={editingId ? pick({ en: 'Edit product', ka: 'რედაქტირება', ru: 'Изменить' }) : pick({ en: 'New product', ka: 'ახალი პროდუქტი', ru: 'Новый товар' })} />
        <ModalBody className="space-y-3">
          <Field label={pick({ en: 'Product name', ka: 'დასახელება', ru: 'Название' })}>
            <Input variant="filled" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={pick({ en: 'Price, ₾', ka: 'ფასი, ₾', ru: 'Цена, ₾' })}>
              <Input variant="filled" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </Field>
            <Field label={pick({ en: 'Stock', ka: 'მარაგი', ru: 'Склад' })}>
              <Input variant="filled" type="number" value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} />
            </Field>
          </div>
          <Field label={pick({ en: 'Category', ka: 'კატეგორია', ru: 'Категория' })}>
            <Input variant="filled" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <Field label={pick({ en: 'Image URL', ka: 'სურათის ბმული', ru: 'URL картинки' })}>
            <Input variant="filled" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          </Field>
        </ModalBody>
        <ModalFooter>
          {!editingId && (
            <Button variant="outline" onClick={() => saveProduct(true)} disabled={saving || !form.name.trim()}>
              {pick({ en: 'Save & add another', ka: 'შენახვა და კიდევ', ru: 'Сохранить и ещё' })}
            </Button>
          )}
          <Button onClick={() => saveProduct(false)} disabled={saving || !form.name.trim()}>
            {saving ? <LoadingSpinner size="sm" /> : pick({ en: 'Save', ka: 'შენახვა', ru: 'Сохранить' })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Shop settings */}
      <ShopSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        shop={shop}
        pick={pick}
        onSaved={onChanged}
      />
    </div>
  );
}

function ShopSettingsModal({
  isOpen,
  onClose,
  shop,
  pick,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  pick: (l: Loc) => string;
  onSaved: () => void | Promise<void>;
}) {
  const toast = useToast();
  const [name, setName] = useState(shop.name);
  const [legalName, setLegalName] = useState(shop.legalName || '');
  const [taxId, setTaxId] = useState(shop.taxId || '');
  const [iban, setIban] = useState(shop.payoutIban || '');
  const [deliveryFee, setDeliveryFee] = useState(
    shop.deliveryFeeMinor ? String(Math.round(shop.deliveryFeeMinor / 100)) : '',
  );
  const [logo, setLogo] = useState<string | null>(shop.logo || null);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Reset the form to the shop's current values each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setName(shop.name);
    setLegalName(shop.legalName || '');
    setTaxId(shop.taxId || '');
    setIban(shop.payoutIban || '');
    setDeliveryFee(shop.deliveryFeeMinor ? String(Math.round(shop.deliveryFeeMinor / 100)) : '');
    setLogo(shop.logo || null);
  }, [isOpen, shop]);

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.patch('/supplier-catalog/my-shop', {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        payoutIban: iban.trim() || undefined,
        deliveryFee: deliveryFee ? Number(deliveryFee) : 0,
      });
      toast.success(pick({ en: 'Saved', ka: 'შენახულია', ru: 'Сохранено' }));
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, pick({ en: 'Save failed', ka: 'ვერ შეინახა', ru: 'Не сохранено' })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader title={pick({ en: 'Shop settings', ka: 'მაღაზიის პარამეტრები', ru: 'Настройки магазина' })} />
      <ModalBody className="space-y-5">
        <div className="space-y-3">
          <GroupCaption n="01" label={pick({ en: 'Identity', ka: 'იდენტობა', ru: 'Профиль' })} />
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-subtle)] transition-colors hover:border-[var(--hm-fg-muted)]"
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
            <div className="flex-1">
              <Field label={pick({ en: 'Shop name', ka: 'მაღაზიის დასახელება', ru: 'Название магазина' })}>
                <Input variant="filled" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <GroupCaption n="02" label={pick({ en: 'Legal & payout', ka: 'იურიდიული და გადახდა', ru: 'Реквизиты' })} />
          <Field label={pick({ en: 'Legal entity', ka: 'იურიდიული პირი', ru: 'Юр. лицо' })}>
            <Input variant="filled" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={pick({ en: 'Tax ID', ka: 'საიდენტიფიკაციო კოდი', ru: 'Налог. код' })}>
              <Input variant="filled" className="font-mono" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </Field>
            <Field label={pick({ en: 'IBAN', ka: 'ანგარიში / IBAN', ru: 'IBAN' })}>
              <Input variant="filled" className="font-mono" value={iban} onChange={(e) => setIban(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <GroupCaption n="03" label={pick({ en: 'Delivery', ka: 'მიწოდება', ru: 'Доставка' })} />
          <Field label={pick({ en: 'Delivery fee, ₾', ka: 'მიწოდების საფასური, ₾', ru: 'Стоимость доставки, ₾' })}>
            <Input variant="filled" type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
          </Field>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {pick({ en: 'Cancel', ka: 'გაუქმება', ru: 'Отмена' })}
        </Button>
        <Button onClick={save} disabled={saving || !name.trim()}>
          {saving ? <LoadingSpinner size="sm" /> : pick({ en: 'Save', ka: 'შენახვა', ru: 'Сохранить' })}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/* ─────────────────────────── Orders ─────────────────────────── */

type ShopOrderItem = { name: string; nameKa?: string; qty: number; imageUrl?: string };
type ShopOrder = {
  _id: string;
  orderNumber: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
  itemCount: number;
  shopSubtotalMinor: number;
  items: ShopOrderItem[];
};

const ORDER_STATUS: Record<ShopOrder['status'], { loc: Loc; cls: string }> = {
  paid: { loc: { en: 'New', ka: 'ახალი', ru: 'Новый' }, cls: 'bg-[var(--hm-brand-500)]/[0.12] text-[var(--hm-brand-500)]' },
  processing: { loc: { en: 'Preparing', ka: 'მზადდება', ru: 'Готовится' }, cls: 'bg-[var(--hm-warning-500)]/[0.12] text-[var(--hm-warning-600)]' },
  shipped: { loc: { en: 'Shipped', ka: 'გზაშია', ru: 'Отправлен' }, cls: 'bg-[var(--hm-info-500)]/[0.12] text-[var(--hm-info-600)]' },
  delivered: { loc: { en: 'Delivered', ka: 'მიტანილი', ru: 'Доставлен' }, cls: 'bg-[var(--hm-success-500)]/[0.12] text-[var(--hm-success-600)]' },
  cancelled: { loc: { en: 'Cancelled', ka: 'გაუქმებული', ru: 'Отменён' }, cls: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]' },
  refunded: { loc: { en: 'Refunded', ka: 'დაბრუნებული', ru: 'Возврат' }, cls: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]' },
};

function ShopOrdersPanel({ pick }: { pick: (l: Loc) => string }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get<{ items: ShopOrder[] }>('/orders/my-shop');
        if (alive) setOrders(data?.items || []);
      } catch {
        if (alive) setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-6 py-16 text-center">
        <h3 className="text-[16px] font-semibold text-[var(--hm-fg-primary)]">
          {pick({ en: 'No orders yet', ka: 'შეკვეთები ჯერ არ არის', ru: 'Заказов пока нет' })}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-[var(--hm-fg-muted)]">
          {pick({
            en: 'When a customer buys your products, the orders you need to prepare show up here.',
            ka: 'როცა მომხმარებელი შენს პროდუქტს იყიდის, მოსამზადებელი შეკვეთები აქ გამოჩნდება.',
            ru: 'Когда клиент купит ваши товары, заказы к подготовке появятся здесь.',
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
      {orders.map((o) => {
        const st = ORDER_STATUS[o.status];
        return (
          <div
            key={o._id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--hm-border-subtle)] px-4 py-3.5 last:border-b-0"
          >
            <div className="flex min-w-[140px] flex-col">
              <span className="font-mono text-[12px] font-semibold text-[var(--hm-fg-primary)]">#{o.orderNumber}</span>
              <span className="text-[11px] text-[var(--hm-fg-muted)]">{fmtDate(o.createdAt)}</span>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st?.cls}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {pick(st?.loc || { en: o.status, ka: o.status, ru: o.status })}
            </span>
            <div className="min-w-[180px] flex-1 truncate text-[13px] text-[var(--hm-fg-secondary)]">
              {o.items.map((i) => `${pick({ en: i.name, ka: i.nameKa || i.name, ru: i.name })} ×${i.qty}`).join(', ')}
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono text-[13px] font-semibold text-[var(--hm-fg-primary)]">{fmt(o.shopSubtotalMinor)}</div>
              <div className="text-[11px] text-[var(--hm-fg-muted)]">
                {o.itemCount} {pick({ en: 'items', ka: 'ერთეული', ru: 'шт.' })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
