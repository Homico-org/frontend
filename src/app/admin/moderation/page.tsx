'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { getProfileFieldLabel } from '@/constants/profileModeration';
import { formatDateTimeShort } from '@/utils/dateUtils';
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Locale = 'en' | 'ka' | 'ru';
type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ChangeRequest {
  id: string;
  proId: string;
  source: 'profile' | 'proProfile';
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  changes: FieldChange[];
  proName?: string | null;
  proAvatar?: string | null;
  proUid?: number | null;
  reason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

interface ModStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Self-contained i18n for this admin-only screen (mirrors /admin/views).
const TXT = {
  title: { en: 'Profile moderation', ka: 'პროფილების მოდერაცია', ru: 'Модерация профилей' },
  subtitle: {
    en: 'Review and approve changes pros make to their profiles',
    ka: 'პროების პროფილის ცვლილებების განხილვა და დამტკიცება',
    ru: 'Проверка и одобрение изменений профилей',
  },
  tabNewPros: { en: 'New pros', ka: 'ახალი პროები', ru: 'Новые про' },
  tabChanges: { en: 'Profile changes', ka: 'პროფილის ცვლილებები', ru: 'Изменения профиля' },
  pending: { en: 'Pending', ka: 'მოლოდინში', ru: 'Ожидают' },
  approved: { en: 'Approved', ka: 'დამტკიცებული', ru: 'Одобрено' },
  rejected: { en: 'Rejected', ka: 'უარყოფილი', ru: 'Отклонено' },
  total: { en: 'Total', ka: 'სულ', ru: 'Всего' },
  pro: { en: 'Pro', ka: 'პრო', ru: 'Про' },
  fields: { en: 'fields', ka: 'ველი', ru: 'полей' },
  when: { en: 'When', ka: 'როდის', ru: 'Когда' },
  empty: { en: 'Nothing to review', ka: 'განსახილველი არაფერია', ru: 'Нечего проверять' },
  loading: { en: 'Loading…', ka: 'იტვირთება…', ru: 'Загрузка…' },
  searchPlaceholder: { en: 'Search by pro name…', ka: 'ძებნა პროს სახელით…', ru: 'Поиск по имени…' },
  detailsTitle: { en: 'Requested changes', ka: 'მოთხოვნილი ცვლილებები', ru: 'Запрошенные изменения' },
  before: { en: 'Current', ka: 'მიმდინარე', ru: 'Текущее' },
  after: { en: 'Requested', ka: 'მოთხოვნილი', ru: 'Запрошено' },
  approve: { en: 'Approve', ka: 'დამტკიცება', ru: 'Одобрить' },
  reject: { en: 'Reject', ka: 'უარყოფა', ru: 'Отклонить' },
  viewProfile: { en: 'View profile', ka: 'პროფილის ნახვა', ru: 'Открыть профиль' },
  rejectTitle: { en: 'Reject changes', ka: 'ცვლილებების უარყოფა', ru: 'Отклонить изменения' },
  rejectHelp: {
    en: 'Tell the pro why these changes were not approved.',
    ka: 'მიუთითეთ პროს, რატომ არ დამტკიცდა ცვლილებები.',
    ru: 'Укажите про, почему изменения не одобрены.',
  },
  reasonPlaceholder: { en: 'Reason for rejection…', ka: 'უარყოფის მიზეზი…', ru: 'Причина отклонения…' },
  cancel: { en: 'Cancel', ka: 'გაუქმება', ru: 'Отмена' },
  refresh: { en: 'Refresh', ka: 'განახლება', ru: 'Обновить' },
  approvedToast: { en: 'Changes approved', ka: 'ცვლილებები დამტკიცდა', ru: 'Изменения одобрены' },
  rejectedToast: { en: 'Changes rejected', ka: 'ცვლილებები უარყოფილია', ru: 'Изменения отклонены' },
  failed: { en: 'Something went wrong', ka: 'რაღაც შეცდომა მოხდა', ru: 'Что-то пошло не так' },
  reasonLabel: { en: 'Reason', ka: 'მიზეზი', ru: 'Причина' },
  empty_value: { en: '(empty)', ka: '(ცარიელი)', ru: '(пусто)' },
  items: { en: 'item(s)', ka: 'ერთეული', ru: 'эл.' },
  added: { en: 'Added', ka: 'დაემატა', ru: 'Добавлено' },
  removed: { en: 'Removed', ka: 'წაიშალა', ru: 'Удалено' },
  modified: { en: 'Modified', ka: 'შეიცვალა', ru: 'Изменено' },
  unchanged: { en: 'unchanged', ka: 'უცვლელი', ru: 'без изменений' },
  noItemChanges: { en: 'No item changes', ka: 'ცვლილება არ არის', ru: 'Нет изменений' },
};

function ModerationContent() {
  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const L = (k: keyof typeof TXT) => TXT[k][(locale as Locale)] || TXT[k].en;
  const fieldLabel = (f: string) => getProfileFieldLabel(f, locale);
  const { categories } = useCategories();

  // Resolve a catalog key (service / subcategory / category) to its localized
  // name, so the moderation diff shows "Socket install" rather than the raw
  // `serviceKey` (which is all the servicePricing entries carry).
  const keyToName = useMemo(() => {
    const map = new Map<string, string>();
    const loc = (en?: string, ka?: string, ru?: string) =>
      (locale === 'ka' ? ka : locale === 'ru' ? ru : en) || en || ka || '';
    for (const cat of categories) {
      if (cat.key) map.set(cat.key, loc(cat.name, cat.nameKa));
      for (const sub of cat.subcategories ?? []) {
        if (sub.key) map.set(sub.key, loc(sub.name, sub.nameKa));
        for (const svc of sub.services ?? []) {
          if (svc.key) map.set(svc.key, loc(svc.name, svc.nameKa, svc.nameRu));
        }
      }
    }
    return map;
  }, [categories, locale]);

  const [items, setItems] = useState<ChangeRequest[]>([]);
  const [stats, setStats] = useState<ModStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);
  const listAbortRef = useRef<AbortController | null>(null);
  const statsAbortRef = useRef<AbortController | null>(null);

  // Debounce the search box (mirrors /admin/users).
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const fetchList = useCallback(async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;
    try {
      if (hasLoadedOnceRef.current) setIsRefreshing(true);
      else setIsLoading(true);
      const res = await api.get('/admin/profile-changes', {
        params: { page, limit: 20, status: statusFilter, search: searchTerm || undefined },
        signal: controller.signal,
      });
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      const code = (error as { code?: string })?.code;
      if (name === 'CanceledError' || code === 'ERR_CANCELED') return;
      console.error('Error fetching profile changes:', error);
    } finally {
      if (!controller.signal.aborted) {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [page, statusFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    statsAbortRef.current?.abort();
    const controller = new AbortController();
    statsAbortRef.current = controller;
    try {
      const res = await api.get('/admin/profile-changes/stats', { signal: controller.signal });
      setStats(res.data);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'CanceledError') return;
      console.error('Error fetching mod stats:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchList();
      fetchStats();
    }
  }, [isAuthenticated, fetchList, fetchStats]);

  const refresh = () => {
    fetchList();
    fetchStats();
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.patch(`/admin/profile-changes/${id}/approve`);
      toast.success(L('approvedToast'));
      setSelected(null);
      refresh();
    } catch (error) {
      console.error('Error approving change:', error);
      toast.error(L('failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      setActionLoading(rejectTarget.id);
      await api.patch(`/admin/profile-changes/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.success(L('rejectedToast'));
      setRejectTarget(null);
      setRejectReason('');
      setSelected(null);
      refresh();
    } catch (error) {
      console.error('Error rejecting change:', error);
      toast.error(L('failed'));
    } finally {
      setActionLoading(null);
    }
  };

  // Render any field value (scalar, array, object) in a compact, readable way.
  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return L('empty_value');
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
      if (v.length === 0) return L('empty_value');
      const allPrimitive = v.every((x) => typeof x === 'string' || typeof x === 'number');
      if (allPrimitive) return v.join(', ');
      return `${v.length} ${L('items')}`;
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  // Stable identity for one array item (so we can diff old vs new by key,
  // not by position). Falls back to a JSON hash for shapeless items.
  const itemKey = (it: unknown, i: number): string => {
    if (it && typeof it === 'object') {
      const o = it as Record<string, unknown>;
      const k =
        o.id ?? o.serviceId ?? o.key ?? o.serviceKey ?? o.subcategoryKey ?? o.title;
      if (k != null) return String(k);
      try { return JSON.stringify(it); } catch { return `i${i}`; }
    }
    return String(it ?? `i${i}`);
  };

  // Localized name for one array item. Resolves a bare serviceKey /
  // subcategoryKey (all that servicePricing carries) to the catalog name.
  const itemName = (it: unknown): string => {
    if (it == null) return L('empty_value');
    if (typeof it !== 'object') return String(it);
    const o = it as Record<string, any>;
    const direct = o.nameKa || o.name || o.title || o.label?.ka || o.label?.en;
    if (direct) return String(direct);
    const viaKey =
      (o.serviceKey && keyToName.get(o.serviceKey)) ||
      (o.subcategoryKey && keyToName.get(o.subcategoryKey)) ||
      (o.key && keyToName.get(o.key));
    if (viaKey) return String(viaKey);
    const raw = o.serviceKey || o.subcategoryKey || o.key;
    if (raw) return String(raw);
    try { return JSON.stringify(it); } catch { return String(it); }
  };

  // The "value" part of an item (price / image count) shown after the name.
  const itemDetail = (it: unknown): string => {
    if (!it || typeof it !== 'object') return '';
    const o = it as Record<string, any>;
    if (typeof o.price === 'number') {
      return typeof o.priceMax === 'number' && o.priceMax !== o.price
        ? `${o.price}-${o.priceMax}₾`
        : `${o.price}₾`;
    }
    if (Array.isArray(o.images)) return `${o.images.length} 🖼`;
    return '';
  };

  // Name + detail on one line (added / removed rows).
  const itemLabel = (it: unknown): string => {
    const d = itemDetail(it);
    return d ? `${itemName(it)} — ${d}` : itemName(it);
  };

  // Render an old→new diff of an array of objects: what was added, removed and
  // modified — instead of a bare "5 items vs 5 items" count that hides the
  // actual change.
  const renderArrayDiff = (oldV: unknown, newV: unknown) => {
    const oldArr = Array.isArray(oldV) ? oldV : [];
    const newArr = Array.isArray(newV) ? newV : [];
    const oldMap = new Map(oldArr.map((it, i) => [itemKey(it, i), it]));
    const newMap = new Map(newArr.map((it, i) => [itemKey(it, i), it]));
    const added: unknown[] = [];
    const removed: unknown[] = [];
    const changed: { old: unknown; next: unknown }[] = [];
    for (const [k, it] of oldMap) {
      if (!newMap.has(k)) removed.push(it);
      else if (JSON.stringify(it) !== JSON.stringify(newMap.get(k)))
        changed.push({ old: it, next: newMap.get(k) });
    }
    for (const [k, it] of newMap) if (!oldMap.has(k)) added.push(it);
    const unchanged = oldArr.length - removed.length - changed.length;

    if (!added.length && !removed.length && !changed.length) {
      return (
        <p className="text-sm" style={{ color: THEME.textMuted }}>
          {L('noItemChanges')} ({oldArr.length} {L('items')})
        </p>
      );
    }
    return (
      <div className="space-y-1 text-sm">
        {added.map((it, i) => (
          <div key={`a${i}`} className="flex gap-1.5" style={{ color: THEME.success }}>
            <span className="font-bold flex-shrink-0">+</span>
            <span className="break-words">{itemLabel(it)}</span>
          </div>
        ))}
        {removed.map((it, i) => (
          <div key={`r${i}`} className="flex gap-1.5" style={{ color: THEME.error }}>
            <span className="font-bold flex-shrink-0">−</span>
            <span className="break-words line-through">{itemLabel(it)}</span>
          </div>
        ))}
        {changed.map((c, i) => {
          const sameName = itemName(c.old) === itemName(c.next);
          const dOld = itemDetail(c.old);
          const dNew = itemDetail(c.next);
          return (
            <div key={`c${i}`} className="flex gap-1.5" style={{ color: THEME.warning }}>
              <span className="font-bold flex-shrink-0">~</span>
              <span className="break-words">
                {sameName ? (
                  dOld !== dNew ? (
                    <>
                      {itemName(c.old)}{' '}
                      <span style={{ color: THEME.textMuted }}>{dOld || '…'} → {dNew || '…'}</span>
                    </>
                  ) : (
                    itemName(c.old)
                  )
                ) : (
                  <>
                    {itemLabel(c.old)} <span style={{ color: THEME.textMuted }}>→</span> {itemLabel(c.next)}
                  </>
                )}
              </span>
            </div>
          );
        })}
        {unchanged > 0 && (
          <div className="text-xs pt-1" style={{ color: THEME.textMuted }}>
            {unchanged} {L('unchanged')}
          </div>
        )}
      </div>
    );
  };

  // A field is an object-array diff when either side is an array whose items
  // are objects (services, pricing, portfolio). Primitive arrays / scalars
  // keep the simple before/after view.
  const isObjectArrayField = (a: unknown, b: unknown): boolean => {
    const probe = (v: unknown) =>
      Array.isArray(v) && v.some((x) => x && typeof x === 'object');
    return probe(a) || probe(b);
  };

  const handleStatusCardClick = (next: StatusFilter) => {
    setPage(1);
    setStatusFilter((prev) => (prev === next ? 'all' : next));
  };

  const statusPill = (status: ChangeRequest['status']) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      pending: { bg: `${THEME.warning}20`, fg: THEME.warning, label: L('pending') },
      approved: { bg: `${THEME.success}20`, fg: THEME.success, label: L('approved') },
      rejected: { bg: `${THEME.error}20`, fg: THEME.error, label: L('rejected') },
      superseded: { bg: THEME.surface, fg: THEME.textMuted, label: 'superseded' },
    };
    const s = map[status] || map.pending;
    return (
      <span
        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
        style={{ background: s.bg, color: s.fg }}
      >
        {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: `${THEME.surface}E6`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 -ml-2 rounded-xl transition-colors flex-shrink-0"
                style={{ color: THEME.textMuted }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold truncate" style={{ color: THEME.text }}>
                  {L('title')}
                </h1>
                <p className="text-xs sm:text-sm hidden sm:block" style={{ color: THEME.textMuted }}>
                  {L('subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="p-2.5 -mr-2 rounded-xl transition-colors flex-shrink-0"
              style={{ color: THEME.textMuted }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs: New pros (existing page) | Profile changes (this page) */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <Link
            href="/admin/pending-pros"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: THEME.surfaceLight, color: THEME.textMuted, border: `1px solid ${THEME.border}` }}
          >
            <UserCheck className="w-4 h-4" />
            {L('tabNewPros')}
          </Link>
          <span
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: `${THEME.primary}20`, color: THEME.primary, border: `1px solid ${THEME.primary}` }}
          >
            <Eye className="w-4 h-4" />
            {L('tabChanges')}
          </span>
        </div>

        {/* Stats cards (also act as status filters) */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {([
              { key: 'pending' as StatusFilter, value: stats.pending, color: THEME.warning, icon: Clock, label: L('pending') },
              { key: 'approved' as StatusFilter, value: stats.approved, color: THEME.success, icon: CheckCircle, label: L('approved') },
              { key: 'rejected' as StatusFilter, value: stats.rejected, color: THEME.error, icon: XCircle, label: L('rejected') },
              { key: 'all' as StatusFilter, value: stats.total, color: THEME.info, icon: Users, label: L('total') },
            ]).map((card) => {
              const Icon = card.icon;
              const active = statusFilter === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleStatusCardClick(card.key)}
                  className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left transition-all active:scale-[0.98] sm:hover:scale-[1.01]"
                  style={{
                    background: THEME.surfaceLight,
                    border: `1px solid ${active ? `${card.color}66` : THEME.border}`,
                    boxShadow: active ? `0 0 0 2px ${card.color}20` : undefined,
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-0" style={{ background: `${card.color}20` }}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.color }} />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.text }}>{card.value}</p>
                      <p className="text-[10px] sm:text-sm leading-tight" style={{ color: THEME.textMuted }}>{card.label}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: THEME.textMuted }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={L('searchPlaceholder')}
            className="w-full h-10 pl-9 pr-9 rounded-xl text-sm outline-none"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}`, color: THEME.text }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: THEME.textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}>
          {isLoading ? (
            <div className="p-6 sm:p-8 text-center">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin" style={{ color: THEME.textMuted }} />
              <p className="text-sm" style={{ color: THEME.textMuted }}>{L('loading')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <UserCheck className="w-10 h-10 mx-auto mb-3" style={{ color: THEME.textMuted }} />
              <p className="text-sm" style={{ color: THEME.text }}>{L('empty')}</p>
            </div>
          ) : (
            <div>
              {items.map((req, index) => (
                <div
                  key={req.id}
                  className="p-3 sm:p-4 transition-colors cursor-pointer"
                  style={{ borderBottom: index < items.length - 1 ? `1px solid ${THEME.border}` : 'none' }}
                  onClick={() => setSelected(req)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surfaceHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar src={req.proAvatar || undefined} name={req.proName || '?'} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base truncate max-w-[160px] sm:max-w-none" style={{ color: THEME.text }}>
                          {req.proName || `#${req.proUid ?? '?'}`}
                        </h3>
                        {statusPill(req.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <span style={{ color: THEME.textMuted }}>
                          {req.changes.length} {L('fields')}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {formatDateTimeShort(req.createdAt)}
                        </span>
                      </div>
                      {/* Changed-field chips preview */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
                        {req.changes.slice(0, 4).map((c) => (
                          <span
                            key={c.field}
                            className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                            style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                          >
                            {fieldLabel(c.field)}
                          </span>
                        ))}
                        {req.changes.length > 4 && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs" style={{ background: THEME.surface, color: THEME.textMuted }}>
                            +{req.changes.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Desktop quick actions (pending only) */}
                    {req.status === 'pending' && (
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setRejectTarget(req); }}
                          disabled={actionLoading === req.id}
                          style={{ borderColor: THEME.error, color: THEME.error }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {L('reject')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                          disabled={actionLoading === req.id}
                          style={{ background: THEME.success, color: '#fff' }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {L('approve')}
                        </Button>
                      </div>
                    )}
                    <div className="sm:hidden flex-shrink-0 self-center">
                      <ChevronRight className="w-4 h-4" style={{ color: THEME.textMuted }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 sm:p-4" style={{ borderTop: `1px solid ${THEME.border}` }}>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-9 px-2 sm:px-3">
                <ChevronLeft className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{locale === 'ka' ? 'წინა' : locale === 'ru' ? 'Назад' : 'Previous'}</span>
              </Button>
              <span className="text-sm" style={{ color: THEME.textMuted }}>{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-9 px-2 sm:px-3">
                <span className="hidden sm:inline">{locale === 'ka' ? 'შემდეგი' : locale === 'ru' ? 'Далее' : 'Next'}</span>
                <ChevronRight className="w-4 h-4 sm:ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal with the diff */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" style={{ background: THEME.surfaceLight }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:p-4" style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={selected.proAvatar || undefined} name={selected.proName || '?'} size="sm" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold truncate" style={{ color: THEME.text }}>
                    {selected.proName || `#${selected.proUid ?? '?'}`}
                  </h2>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>{L('detailsTitle')}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2.5 -mr-2 rounded-full transition-colors" style={{ color: THEME.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Diff table */}
              <div className="space-y-3">
                {selected.changes.map((c) => (
                  <div key={c.field} className="rounded-xl p-3" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: THEME.primary }}>{fieldLabel(c.field)}</p>
                    {isObjectArrayField(c.oldValue, c.newValue) ? (
                      // Array of objects (services, pricing, portfolio): show the
                      // actual added/removed/modified items, not just a count.
                      <div className="rounded-lg p-2" style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}>
                        {renderArrayDiff(c.oldValue, c.newValue)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg p-2" style={{ background: `${THEME.error}10`, border: `1px solid ${THEME.error}30` }}>
                          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: THEME.textMuted }}>{L('before')}</p>
                          <p className="text-sm break-words" style={{ color: THEME.text }}>{formatValue(c.oldValue)}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: `${THEME.success}10`, border: `1px solid ${THEME.success}30` }}>
                          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: THEME.textMuted }}>{L('after')}</p>
                          <p className="text-sm break-words" style={{ color: THEME.text }}>{formatValue(c.newValue)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Existing rejection reason (for rejected items) */}
              {selected.status === 'rejected' && selected.reason && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: `${THEME.error}10`, border: `1px solid ${THEME.error}40` }}>
                  <p className="text-xs font-medium mb-1" style={{ color: THEME.error }}>{L('reasonLabel')}</p>
                  <p className="text-sm" style={{ color: THEME.error }}>{selected.reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 mt-4 pb-6 sm:pb-0" style={{ borderTop: `1px solid ${THEME.border}` }}>
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                  <Link href={`/professionals/${selected.proUid || selected.proId}`} target="_blank" className="order-3 sm:order-1 sm:flex-1">
                    <Button variant="outline" className="w-full h-12 sm:h-9 text-base sm:text-sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {L('viewProfile')}
                    </Button>
                  </Link>
                  {selected.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setRejectTarget(selected)}
                        disabled={actionLoading === selected.id}
                        className="order-2 sm:flex-1 h-12 sm:h-9 text-base sm:text-sm"
                        style={{ borderColor: THEME.error, color: THEME.error }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {L('reject')}
                      </Button>
                      <Button
                        onClick={() => handleApprove(selected.id)}
                        disabled={actionLoading === selected.id}
                        className="order-1 sm:order-3 sm:flex-1 h-12 sm:h-9 font-medium text-base sm:text-sm"
                        style={{ background: THEME.success, color: '#fff' }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {L('approve')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectTarget(null); setRejectReason(''); } }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl" style={{ background: THEME.surfaceLight }}>
            <div className="flex items-center justify-between px-4 py-3 sm:p-4" style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: THEME.text }}>{L('rejectTitle')}</h2>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="p-2.5 -mr-2 rounded-full transition-colors" style={{ color: THEME.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 pb-10 sm:pb-6">
              <p className="text-sm sm:text-base mb-3 sm:mb-4" style={{ color: THEME.textMuted }}>{L('rejectHelp')}</p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={L('reasonPlaceholder')}
                rows={4}
                className="mb-4 text-base"
                style={{ background: THEME.surface, borderColor: THEME.border, color: THEME.text }}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 h-12 sm:h-9 text-base sm:text-sm">
                  {L('cancel')}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === rejectTarget.id}
                  className="flex-1 h-12 sm:h-9 font-medium text-base sm:text-sm"
                  style={{ background: THEME.error, color: '#fff' }}
                >
                  {L('reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ModerationContent />
    </AuthGuard>
  );
}
