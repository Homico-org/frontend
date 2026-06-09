'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { api } from '@/lib/api';
import {
  AlertCircle,
  Check,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

// --- catalog matching ------------------------------------------------------

interface FlatService {
  key: string;
  categoryKey: string;
  name: string; // localized display
  unit?: string;
  unitLabel?: string;
  tokens: Set<string>; // normalized tokens across all locales
  normNames: string[]; // normalized full names across locales
}

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (s: string) => norm(s).split(' ').filter((t) => t.length > 1);

/** 0..1 similarity between an estimate line and a catalog service. */
function scoreMatch(queryNorm: string, queryTokens: string[], svc: FlatService) {
  if (!queryTokens.length || !svc.tokens.size) return 0;
  let inter = 0;
  for (const t of new Set(queryTokens)) if (svc.tokens.has(t)) inter += 1;
  const union = new Set([...queryTokens, ...svc.tokens]).size;
  let s = union ? inter / union : 0; // Jaccard
  for (const nc of svc.normNames) {
    if (!nc) continue;
    if (nc.includes(queryNorm) || queryNorm.includes(nc)) s = Math.max(s, 0.62);
  }
  // partial-word containment (e.g. "შეღებვა" inside "კედლის შეღებვა")
  for (const t of queryTokens) {
    if (t.length >= 3 && svc.normNames.some((n) => n.includes(t))) s += 0.07;
  }
  return Math.min(1, s);
}

const AUTO_THRESHOLD = 0.45;

// --- excel column detection ------------------------------------------------

type Field = 'name' | 'qty' | 'unit' | 'price' | 'step';
const HEADER_KEYS: Record<Field, string[]> = {
  name: ['დასახელება', 'სამუშაო', 'სერვის', 'მომსახურ', 'name', 'descript', 'работ', 'услуг', 'наименов'],
  qty: ['რაოდენ', 'ოდენობ', 'qty', 'quantity', 'количеств', 'кол-во', 'кол'],
  unit: ['ერთეул', 'განზომ', 'ზომის', 'unit', 'ед.', 'ед ', 'измер'],
  price: ['ფასი', 'ღირებულ', 'price', 'цена', 'стоимост', 'тариф'],
  step: ['ეტაპ', 'სექცი', 'ფაზ', 'ჯგუფ', 'კატეგორ', 'stage', 'section', 'phase', 'этап', 'раздел', 'категор', 'групп'],
};

function detectColumns(rows: string[][]): {
  headerRow: number;
  map: Record<Field, number | null>;
} {
  const empty = { name: null, qty: null, unit: null, price: null, step: null } as Record<Field, number | null>;
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const cells = (rows[r] || []).map((c) => norm(String(c ?? '')));
    const map = { ...empty };
    let hits = 0;
    cells.forEach((cell, ci) => {
      if (!cell) return;
      (Object.keys(HEADER_KEYS) as Field[]).forEach((f) => {
        if (map[f] === null && HEADER_KEYS[f].some((k) => cell.includes(k))) {
          map[f] = ci;
          hits += 1;
        }
      });
    });
    if (map.name !== null && (map.price !== null || map.qty !== null) && hits >= 2) {
      return { headerRow: r, map };
    }
  }
  // No header found - assume col0 = name, col1 = qty, col2 = unit, col3 = price.
  return {
    headerRow: -1,
    map: { name: 0, qty: 1, unit: 2, price: 3, step: null },
  };
}

const toNum = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

interface ImportRow {
  rid: number;
  include: boolean;
  stepName: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  serviceKey?: string;
  categoryKey?: string;
  matchedName?: string;
  matchScore: number;
  suggestions: { key: string; categoryKey: string; name: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onImported: () => void | Promise<void>;
}

export default function ImportEstimateModal({
  isOpen,
  onClose,
  projectId,
  onImported,
}: Props) {
  const { t, pick } = useLanguage();
  const toast = useToast();
  const { categories } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<'upload' | 'review'>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [saving, setSaving] = useState(false);

  const catalogServices = useMemo<FlatService[]>(() => {
    const out: FlatService[] = [];
    for (const c of categories) {
      for (const sc of c.subcategories || []) {
        for (const s of (sc.services || []) as any[]) {
          const names = [s.name, s.nameKa, s.nameRu].filter(Boolean) as string[];
          const tokens = new Set<string>();
          names.forEach((n) => tokenize(n).forEach((tk) => tokens.add(tk)));
          const first = s.unitOptions?.[0];
          out.push({
            key: s.key,
            categoryKey: c.key,
            name: pick({ en: s.name, ka: s.nameKa }),
            unit: first?.unit || s.unit,
            unitLabel: first ? pick(first.label) : pick({ en: s.unitName, ka: s.unitNameKa }),
            tokens,
            normNames: names.map(norm),
          });
        }
      }
    }
    return out;
  }, [categories, pick]);

  const matchOne = useCallback(
    (name: string) => {
      const qn = norm(name);
      const qt = tokenize(name);
      const scored = catalogServices
        .map((svc) => ({ svc, score: scoreMatch(qn, qt, svc) }))
        .filter((x) => x.score > 0.12)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      const top = scored[0];
      const matched = top && top.score >= AUTO_THRESHOLD ? top.svc : undefined;
      return {
        serviceKey: matched?.key,
        categoryKey: matched?.categoryKey,
        matchedName: matched?.name,
        unit: matched?.unit,
        unitLabel: matched?.unitLabel,
        matchScore: top?.score ?? 0,
        suggestions: scored.map((x) => ({
          key: x.svc.key,
          categoryKey: x.svc.categoryKey,
          name: x.svc.name,
        })),
      };
    },
    [catalogServices],
  );

  const parseFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });
      if (!raw.length) {
        toast.error(t('projects.importEmpty'));
        return;
      }
      const { headerRow, map } = detectColumns(raw as string[][]);
      const body = (raw as string[][]).slice(headerRow + 1);

      const out: ImportRow[] = [];
      let currentStep = '';
      let rid = 0;
      for (const r of body) {
        const cell = (i: number | null) => (i == null ? '' : String(r[i] ?? '').trim());
        const name = cell(map.name);
        if (!name) continue;
        const qty = toNum(cell(map.qty));
        const price = toNum(cell(map.price));
        const unit = cell(map.unit) || undefined;
        const stepCol = cell(map.step);

        // Section grouping: explicit step column, else a "header row" (name but
        // no qty AND no price) starts a new step.
        if (map.step !== null) {
          if (stepCol) currentStep = stepCol;
        } else if (qty == null && price == null) {
          currentStep = name;
          continue; // the header row itself isn't a line item
        }

        const m = matchOne(name);
        out.push({
          rid: rid++,
          include: true,
          stepName: currentStep,
          name,
          quantity: qty,
          unit: unit || m.unit,
          unitPrice: price,
          serviceKey: m.serviceKey,
          categoryKey: m.categoryKey,
          matchedName: m.matchedName,
          matchScore: m.matchScore,
          suggestions: m.suggestions,
        });
      }

      if (!out.length) {
        toast.error(t('projects.importNoRows'));
        return;
      }
      setFileName(file.name);
      setRows(out);
      setStage('review');
    } catch {
      toast.error(t('projects.importParseFailed'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const setRow = (rid: number, patch: Partial<ImportRow>) =>
    setRows((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r)));

  const acceptSuggestion = (rid: number, s: { key: string; categoryKey: string; name: string }) => {
    const svc = catalogServices.find((x) => x.key === s.key);
    setRows((prev) =>
      prev.map((r) =>
        r.rid === rid
          ? {
              ...r,
              serviceKey: s.key,
              categoryKey: s.categoryKey,
              matchedName: s.name,
              matchScore: 1,
              // keep the row's own unit if the estimate had one, else adopt the
              // catalog service's canonical unit.
              unit: r.unit || svc?.unit,
            }
          : r,
      ),
    );
  };

  const clearMatch = (rid: number) =>
    setRow(rid, { serviceKey: undefined, categoryKey: undefined, matchedName: undefined, matchScore: 0 });

  const included = rows.filter((r) => r.include && r.name.trim());
  const matchedCount = included.filter((r) => r.serviceKey).length;
  const unmatchedCount = included.length - matchedCount;
  const stepCount = new Set(included.map((r) => r.stepName.trim()).filter(Boolean)).size;
  const total = included.reduce(
    (s, r) => s + (r.quantity || 0) * (r.unitPrice || 0),
    0,
  );

  const commit = async () => {
    if (!included.length) return;
    setSaving(true);
    try {
      const steps = Array.from(
        new Set(included.map((r) => r.stepName.trim()).filter(Boolean)),
      );
      const items = included.map((r) => ({
        name: r.name.trim(),
        stepName: r.stepName.trim() || undefined,
        serviceKey: r.serviceKey,
        categoryKey: r.categoryKey,
        quantity: r.quantity,
        unit: r.unit,
        unitLabel: r.unit,
        unitPrice: r.unitPrice,
      }));
      const { data } = await api.post(
        `/projects/${projectId}/import-estimate`,
        { steps, items },
      );
      toast.success(
        t('projects.importDone', {
          steps: data?.stepsCreated ?? steps.length,
          items: data?.itemsCreated ?? items.length,
        }),
      );
      await onImported();
      reset();
      onClose();
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStage('upload');
    setRows([]);
    setFileName('');
  };

  if (!isOpen) return null;

  const fmt = (n: number) =>
    `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton>
      <ModalHeader title={t('projects.importTitle')} />
      <ModalBody className="flex flex-col gap-4">
        {stage === 'upload' ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-[var(--hm-fg-secondary)]">
              {t('projects.importIntro')}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]/40 px-6 py-10 text-center transition-colors hover:border-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/[0.04]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                <FileSpreadsheet className="h-6 w-6" />
              </span>
              <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                {t('projects.importPick')}
              </span>
              <span className="text-[12px] text-[var(--hm-fg-muted)]">
                {t('projects.importFormats')}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void parseFile(f);
              }}
            />
            <p className="text-[11px] text-[var(--hm-fg-muted)]">
              {t('projects.importHint')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-[var(--hm-bg-tertiary)]/50 px-3 py-2 text-[12px]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--hm-fg-primary)]">
                <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--hm-fg-muted)]" />
                {fileName}
              </span>
              <span className="text-[var(--hm-fg-muted)]">
                {t('projects.importSummary', {
                  items: included.length,
                  steps: stepCount,
                })}
              </span>
              <span className="text-[var(--hm-success-600)]">
                {t('projects.importMatched', { n: matchedCount })}
              </span>
              {unmatchedCount > 0 && (
                <span className="text-[var(--hm-warning-600)]">
                  {t('projects.importUnmatched', { n: unmatchedCount })}
                </span>
              )}
              <span className="ml-auto font-bold tabular-nums text-[var(--hm-fg-primary)]">
                {fmt(total)}
              </span>
            </div>

            {/* Rows */}
            <div className="flex max-h-[52vh] flex-col divide-y divide-[var(--hm-border-subtle)] overflow-y-auto rounded-xl border border-[var(--hm-border-subtle)]">
              {rows.map((r) => (
                <ImportRowView
                  key={r.rid}
                  row={r}
                  catalogServices={catalogServices}
                  onChange={(patch) => setRow(r.rid, patch)}
                  onAccept={(s) => acceptSuggestion(r.rid, s)}
                  onClear={() => clearMatch(r.rid)}
                  t={t}
                  fmt={fmt}
                />
              ))}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter className={stage === 'review' ? 'justify-between' : 'justify-end'}>
        {stage === 'review' && (
          <Button variant="ghost" onClick={reset}>
            {t('projects.importAnother')}
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {stage === 'review' && (
            <Button
              onClick={commit}
              loading={saving}
              disabled={!included.length}
            >
              {t('projects.importCommit', { n: included.length })}
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function ImportRowView({
  row,
  catalogServices,
  onChange,
  onAccept,
  onClear,
  t,
  fmt,
}: {
  row: ImportRow;
  catalogServices: FlatService[];
  onChange: (patch: Partial<ImportRow>) => void;
  onAccept: (s: { key: string; categoryKey: string; name: string }) => void;
  onClear: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
  fmt: (n: number) => string;
}) {
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const pickRef = useClickOutside<HTMLDivElement>(() => setPicking(false), picking);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return catalogServices
      .filter((s) => s.normNames.some((n) => n.includes(q)))
      .slice(0, 8);
  }, [query, catalogServices]);

  const lineTotal = (row.quantity || 0) * (row.unitPrice || 0);

  return (
    <div
      className={`flex flex-col gap-1.5 px-3 py-2.5 ${row.include ? '' : 'opacity-45'}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onChange({ include: !row.include })}
          aria-pressed={row.include}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
            row.include
              ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
              : 'border-[var(--hm-border-strong)]'
          }`}
        >
          {row.include && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
              {row.name}
            </span>
            {row.stepName && (
              <span className="shrink-0 rounded-full bg-[var(--hm-bg-tertiary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--hm-fg-muted)]">
                {row.stepName}
              </span>
            )}
          </div>

          {/* Match state */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.serviceKey ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hm-success-50)] px-2 py-0.5 text-[11px] font-medium text-[var(--hm-success-600)]">
                <Check className="h-3 w-3" />
                {row.matchedName}
                <button
                  type="button"
                  onClick={onClear}
                  aria-label={t('common.clear')}
                  className="ml-0.5 text-[var(--hm-success-600)]/70 hover:text-[var(--hm-error-500)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--hm-warning-600)]">
                  <AlertCircle className="h-3 w-3" />
                  {t('projects.importNoMatch')}
                </span>
                {row.suggestions[0] && (
                  <button
                    type="button"
                    onClick={() => onAccept(row.suggestions[0])}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--hm-brand-500)]/40 px-2 py-0.5 text-[11px] font-medium text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/[0.06]"
                  >
                    {t('projects.importSuggest', { name: row.suggestions[0].name })}
                  </button>
                )}
              </>
            )}

            {/* Manual pick */}
            <div className="relative" ref={pickRef}>
              <button
                type="button"
                onClick={() => setPicking((p) => !p)}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
              >
                <Search className="h-3 w-3" />
                {t('projects.importChange')}
              </button>
              {picking && (
                <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] p-2 shadow-lg">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('projects.searchServices')}
                    inputSize="sm"
                  />
                  <div className="mt-1 max-h-48 overflow-y-auto">
                    {results.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          onAccept({ key: s.key, categoryKey: s.categoryKey, name: s.name });
                          setPicking(false);
                          setQuery('');
                        }}
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[12px] text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        {s.name}
                      </button>
                    ))}
                    {query && !results.length && (
                      <p className="px-2 py-1.5 text-[12px] text-[var(--hm-fg-muted)]">
                        {t('projects.noServicesFound')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* qty x price */}
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <input
            type="number"
            value={row.quantity ?? ''}
            onChange={(e) => onChange({ quantity: e.target.value ? Number(e.target.value) : undefined })}
            className="h-7 w-14 rounded-md border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-1.5 text-right text-[12px] tabular-nums text-[var(--hm-fg-primary)]"
          />
          <span className="text-[11px] text-[var(--hm-fg-muted)]">×</span>
          <div className="relative">
            <input
              type="number"
              value={row.unitPrice ?? ''}
              onChange={(e) => onChange({ unitPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 w-20 rounded-md border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] pl-1.5 pr-5 text-right text-[12px] tabular-nums text-[var(--hm-fg-primary)]"
            />
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--hm-fg-muted)]">
              ₾
            </span>
          </div>
          <span className="w-20 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
            {lineTotal > 0 ? fmt(lineTotal) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
