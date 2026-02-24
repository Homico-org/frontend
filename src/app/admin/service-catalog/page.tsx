'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  Edit2,
  FolderOpen,
  GripVertical,
  Layers,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Reorder } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalizedText {
  en: string;
  ka: string;
  ru: string;
}

interface CatalogService {
  key: string;
  label: LocalizedText;
  description?: LocalizedText;
  basePrice: number;
  unit: string;
  unitLabel: LocalizedText;
  maxQuantity?: number;
  discountTiers?: { minQuantity: number; percent: number }[];
}

interface CatalogAddon {
  key: string;
  label: LocalizedText;
  promptLabel: LocalizedText;
  basePrice: number;
  unit: string;
  unitLabel: LocalizedText;
  iconName?: string;
}

interface CatalogVariant {
  key: string;
  label: LocalizedText;
  services: CatalogService[];
  addons: CatalogAddon[];
  additionalServices: CatalogService[];
}

interface CatalogSubcategory {
  key: string;
  label: LocalizedText;
  description?: LocalizedText;
  iconName: string;
  priceRange: { min: number; max?: number };
  sortOrder: number;
  isActive: boolean;
  variants: CatalogVariant[];
  services: CatalogService[];
  addons: CatalogAddon[];
  additionalServices: CatalogService[];
  orderDiscountTiers?: { minQuantity: number; percent: number }[];
}

interface ServiceCatalogCategory {
  id: string;
  key: string;
  label: LocalizedText;
  description?: LocalizedText;
  iconName: string;
  color: string;
  minPrice: number;
  sortOrder: number;
  isActive: boolean;
  version: number;
  subcategories: CatalogSubcategory[];
}

const UNITS = ['piece', 'sqm', 'meter', 'point', 'room', 'set', 'hour', 'floor', 'item', 'device', 'window'];

const emptyLocalized = (): LocalizedText => ({ en: '', ka: '', ru: '' });

// ─── Inline Edit Form Helpers ─────────────────────────────────────────────────

type EditingCategory = {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
  iconName: string;
  color: string;
  minPrice: number;
  sortOrder: number;
  isActive: boolean;
};

type EditingSubcategory = {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
  iconName: string;
  priceRangeMin: number;
  priceRangeMax: number | '';
  sortOrder: number;
  isActive: boolean;
  orderDiscountTiers: { minQuantity: number | ''; percent: number | '' }[];
};

type EditingService = {
  key: string;
  labelEn: string;
  labelKa: string;
  labelRu: string;
  basePrice: number | '';
  unit: string;
  unitLabelEn: string;
  unitLabelKa: string;
  unitLabelRu: string;
  maxQuantity: number | '';
  discountTiers: { minQuantity: number | ''; percent: number | '' }[];
};

type EditingAddon = {
  key: string;
  labelEn: string;
  labelKa: string;
  labelRu: string;
  promptLabelEn: string;
  promptLabelKa: string;
  promptLabelRu: string;
  basePrice: number | '';
  unit: string;
  unitLabelEn: string;
  unitLabelKa: string;
  unitLabelRu: string;
  iconName: string;
};

const emptyEditingService = (): EditingService => ({
  key: '',
  labelEn: '',
  labelKa: '',
  labelRu: '',
  basePrice: '',
  unit: 'piece',
  unitLabelEn: '',
  unitLabelKa: '',
  unitLabelRu: '',
  maxQuantity: '',
  discountTiers: [],
});

const emptyEditingAddon = (): EditingAddon => ({
  key: '',
  labelEn: '',
  labelKa: '',
  labelRu: '',
  promptLabelEn: '',
  promptLabelKa: '',
  promptLabelRu: '',
  basePrice: '',
  unit: 'piece',
  unitLabelEn: '',
  unitLabelKa: '',
  unitLabelRu: '',
  iconName: '',
});

const serviceToEditing = (s: CatalogService): EditingService => ({
  key: s.key,
  labelEn: s.label.en,
  labelKa: s.label.ka,
  labelRu: s.label.ru,
  basePrice: s.basePrice,
  unit: s.unit,
  unitLabelEn: s.unitLabel.en,
  unitLabelKa: s.unitLabel.ka,
  unitLabelRu: s.unitLabel.ru,
  maxQuantity: s.maxQuantity ?? '',
  discountTiers: (s.discountTiers ?? []).map(t => ({ minQuantity: t.minQuantity, percent: t.percent })),
});

const addonToEditing = (a: CatalogAddon): EditingAddon => ({
  key: a.key,
  labelEn: a.label.en,
  labelKa: a.label.ka,
  labelRu: a.label.ru,
  promptLabelEn: a.promptLabel.en,
  promptLabelKa: a.promptLabel.ka,
  promptLabelRu: a.promptLabel.ru,
  basePrice: a.basePrice,
  unit: a.unit,
  unitLabelEn: a.unitLabel.en,
  unitLabelKa: a.unitLabel.ka,
  unitLabelRu: a.unitLabel.ru,
  iconName: a.iconName ?? '',
});

const editingToServicePayload = (e: EditingService): CatalogService => {
  const tiers = e.discountTiers
    .filter(t => t.minQuantity !== '' && t.percent !== '')
    .map(t => ({ minQuantity: Number(t.minQuantity), percent: Number(t.percent) }))
    .sort((a, b) => a.minQuantity - b.minQuantity);
  return {
    key: e.key,
    label: { en: e.labelEn, ka: e.labelKa, ru: e.labelRu },
    basePrice: Number(e.basePrice) || 0,
    unit: e.unit,
    unitLabel: { en: e.unitLabelEn, ka: e.unitLabelKa, ru: e.unitLabelRu },
    maxQuantity: e.maxQuantity !== '' ? Number(e.maxQuantity) : undefined,
    ...(tiers.length > 0 ? { discountTiers: tiers } : {}),
  };
};

const editingToAddonPayload = (e: EditingAddon): CatalogAddon => ({
  key: e.key,
  label: { en: e.labelEn, ka: e.labelKa, ru: e.labelRu },
  promptLabel: { en: e.promptLabelEn, ka: e.promptLabelKa, ru: e.promptLabelRu },
  basePrice: Number(e.basePrice) || 0,
  unit: e.unit,
  unitLabel: { en: e.unitLabelEn, ka: e.unitLabelKa, ru: e.unitLabelRu },
  iconName: e.iconName || undefined,
});

// ─── Shared input style helper ────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: `1px solid ${THEME.border}`,
  background: THEME.surface,
  color: THEME.text,
  fontSize: 13,
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: THEME.textMuted,
  marginBottom: 3,
  display: 'block',
};

// ─── Icon names list (all valid lucide-react icon component names) ────────────

const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter(
  (key) => {
    const val = (LucideIcons as Record<string, unknown>)[key];
    return (
      typeof val === 'object' &&
      val !== null &&
      key[0] === key[0].toUpperCase() &&
      key !== 'default' &&
      key !== 'Icon' &&
      !key.startsWith('Lucide') &&
      key !== 'createLucideIcon' &&
      key !== 'icons'
    );
  },
);

function renderLucideIcon(name: string, size = 20, color = THEME.text) {
  const IconComp = (LucideIcons as Record<string, unknown>)[name] as React.ComponentType<{ size?: number; color?: string }> | undefined;
  if (!IconComp) return null;
  return <IconComp size={size} color={color} />;
}

// ─── IconPickerModal ──────────────────────────────────────────────────────────

function IconPickerModal({
  open,
  onClose,
  onSelect,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  current: string;
}) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return ALL_ICON_NAMES;
    const q = search.toLowerCase();
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.surfaceLight,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          width: 560,
          maxWidth: '95vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: THEME.text }}>
            Select Icon
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: THEME.textMuted,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${THEME.border}` }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              color={THEME.textDim}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchRef}
              style={{ ...inputStyle, paddingLeft: 32 }}
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 6 }}>
            {filtered.length} icons {search && `matching "${search}"`}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 4,
            alignContent: 'start',
          }}
        >
          {filtered.map((name) => (
            <button
              key={name}
              onClick={() => {
                onSelect(name);
                onClose();
              }}
              title={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 4px',
                borderRadius: 8,
                border: name === current ? `2px solid ${THEME.primary}` : `1px solid transparent`,
                background: name === current ? `${THEME.primary}20` : 'transparent',
                cursor: 'pointer',
                color: THEME.text,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (name !== current) {
                  e.currentTarget.style.background = THEME.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (name !== current) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {renderLucideIcon(name, 20)}
              <span
                style={{
                  fontSize: 9,
                  color: THEME.textDim,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {name}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 32,
                color: THEME.textDim,
                fontSize: 13,
              }}
            >
              No icons found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IconPickerButton ─────────────────────────────────────────────────────────

function IconPickerButton({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {value ? renderLucideIcon(value, 16) : null}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'Select icon...'}
        </span>
        <ChevronDown size={14} color={THEME.textDim} />
      </button>
      <IconPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        current={value}
      />
    </div>
  );
}

// ─── ColorPickerModal ─────────────────────────────────────────────────────────

const PROJECT_COLORS: { hex: string; name: string; group: string }[] = [
  // Category colors
  { hex: '#3B82F6', name: 'Blue', group: 'Category' },
  { hex: '#0EA5E9', name: 'Sky', group: 'Category' },
  { hex: '#EF4444', name: 'Red', group: 'Category' },
  { hex: '#C4735B', name: 'Terracotta', group: 'Category' },
  { hex: '#8B5CF6', name: 'Purple', group: 'Category' },
  { hex: '#F59E0B', name: 'Amber', group: 'Category' },
  { hex: '#6366F1', name: 'Indigo', group: 'Category' },
  { hex: '#10B981', name: 'Emerald', group: 'Category' },
  { hex: '#06B6D4', name: 'Cyan', group: 'Category' },
  { hex: '#2563EB', name: 'Royal Blue', group: 'Category' },
  { hex: '#D97706', name: 'Dark Amber', group: 'Category' },
  // Brand
  { hex: '#B5624A', name: 'Brand Hover', group: 'Brand' },
  { hex: '#A85D4A', name: 'Brand Dark', group: 'Brand' },
  { hex: '#E8A593', name: 'Brand Light', group: 'Brand' },
  { hex: '#D98B74', name: 'Brand Accent', group: 'Brand' },
  // Status
  { hex: '#22C55E', name: 'Success', group: 'Status' },
  { hex: '#16A34A', name: 'Success Dark', group: 'Status' },
  { hex: '#DC2626', name: 'Error Dark', group: 'Status' },
  // Neutral
  { hex: '#64748B', name: 'Slate', group: 'Neutral' },
  { hex: '#475569', name: 'Slate Dark', group: 'Neutral' },
  { hex: '#94A3B8', name: 'Slate Light', group: 'Neutral' },
  { hex: '#1E293B', name: 'Slate 800', group: 'Neutral' },
];

function ColorPickerModal({
  open,
  onClose,
  onSelect,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (hex: string) => void;
  current?: string;
}) {
  if (!open) return null;

  const groups = PROJECT_COLORS.reduce<Record<string, typeof PROJECT_COLORS>>((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.surface,
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          width: 400,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <span style={{ fontWeight: 600, color: THEME.text, fontSize: 15 }}>Select Color</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.textDim, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Color groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {Object.entries(groups).map(([group, colors]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: THEME.textDim,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {group}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
                {colors.map((c) => {
                  const selected = current?.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        onSelect(c.hex);
                        onClose();
                      }}
                      title={`${c.name} — ${c.hex}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: selected ? `2px solid ${THEME.primary}` : `1px solid ${THEME.border}`,
                        background: selected ? `${THEME.primary}15` : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = THEME.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: c.hex,
                          border: selected ? `2px solid white` : `1px solid rgba(255,255,255,0.15)`,
                          boxShadow: selected ? `0 0 0 2px ${THEME.primary}` : 'none',
                        }}
                      />
                      <span style={{ fontSize: 9, color: THEME.textDim, whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 8, color: THEME.textDim, opacity: 0.7, fontFamily: 'monospace' }}>
                        {c.hex}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ColorPickerButton ────────────────────────────────────────────────────────

function ColorPickerButton({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: value || '#C4735B',
            border: '1px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>
          {value || '#C4735B'}
        </span>
        <ChevronDown size={14} color={THEME.textDim} />
      </button>
      <ColorPickerModal open={open} onClose={() => setOpen(false)} onSelect={onChange} current={value} />
    </div>
  );
}

// ─── LocalizedRichText ────────────────────────────────────────────────────────

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const QUILL_FORMATS = ['bold', 'italic', 'underline', 'list'];

function LocalizedRichText({
  value,
  onChange,
  label,
}: {
  value: LocalizedText;
  onChange: (val: LocalizedText) => void;
  label?: string;
}) {
  const [tab, setTab] = useState<'en' | 'ka' | 'ru'>('en');
  const valueRef = useRef(value);
  valueRef.current = value;
  const langs: Array<{ key: 'en' | 'ka' | 'ru'; label: string }> = [
    { key: 'en', label: 'EN' },
    { key: 'ka', label: 'KA' },
    { key: 'ru', label: 'RU' },
  ];

  return (
    <div style={{ marginBottom: 8 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        {langs.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setTab(l.key)}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${THEME.border}`,
              borderBottom: tab === l.key ? 'none' : `1px solid ${THEME.border}`,
              borderRadius: tab === l.key ? '6px 6px 0 0' : '6px 6px 0 0',
              background: tab === l.key ? THEME.surfaceLight : 'transparent',
              color: tab === l.key ? THEME.primary : THEME.textDim,
              cursor: 'pointer',
              position: 'relative',
              zIndex: tab === l.key ? 1 : 0,
              marginBottom: tab === l.key ? -1 : 0,
            }}
          >
            {l.label}
            {value[l.key] && value[l.key].replace(/<[^>]*>/g, '').trim() ? (
              <span style={{ marginLeft: 4, width: 5, height: 5, borderRadius: '50%', background: THEME.success, display: 'inline-block' }} />
            ) : null}
          </button>
        ))}
      </div>
      <div
        className="admin-quill"
        style={{
          border: `1px solid ${THEME.border}`,
          borderRadius: '0 6px 6px 6px',
          overflow: 'hidden',
        }}
      >
        {langs.map((l) => (
          <div key={l.key} style={{ display: tab === l.key ? 'block' : 'none' }}>
            <ReactQuill
              theme="snow"
              value={value[l.key] || ''}
              onChange={(content: string) => {
                const stripped = content.replace(/<[^>]*>/g, '').trim();
                onChange({ ...valueRef.current, [l.key]: stripped ? content : '' });
              }}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              style={{ minHeight: 100 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Strip empty description before sending to API */
function cleanDescription(desc: LocalizedText): LocalizedText | undefined {
  const hasContent = (s: string) => s && s.replace(/<[^>]*>/g, '').trim().length > 0;
  if (!hasContent(desc.en) && !hasContent(desc.ka) && !hasContent(desc.ru)) return undefined;
  return desc;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
      {count !== undefined && (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '1px 7px',
          borderRadius: 10,
          background: `${THEME.primary}20`,
          color: THEME.primary,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  onEdit,
  onDelete,
  t,
}: {
  service: CatalogService;
  onEdit: (s: CatalogService) => void;
  onDelete: (key: string) => void;
  t: (key: string) => string;
}) {
  const { locale } = useLanguage();
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 80px 80px 70px 60px 72px',
      gap: 8,
      alignItems: 'center',
      padding: '8px 10px',
      borderRadius: 6,
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      fontSize: 12,
    }}>
      <div>
        <span style={{ color: THEME.text, fontWeight: 500 }}>{service.label?.[locale as 'en' | 'ka' | 'ru'] || service.label?.en || service.key}</span>
        <span style={{ color: THEME.textDim, marginLeft: 6, fontSize: 11 }}>({service.key})</span>
      </div>
      <span style={{ color: THEME.textMuted }}>{service.basePrice}</span>
      <span style={{ color: THEME.textMuted }}>{service.unit}</span>
      <span style={{ color: THEME.textMuted }}>{service.maxQuantity ?? '—'}</span>
      <span style={{ color: THEME.textMuted }}>{service.discountTiers?.length || '—'}</span>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onEdit(service)}
          style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.textMuted }}
          title={t('common.edit')}
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={() => onDelete(service.key)}
          style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.error }}
          title={t('common.delete')}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function AddonRow({
  addon,
  onEdit,
  onDelete,
  t,
}: {
  addon: CatalogAddon;
  onEdit: (a: CatalogAddon) => void;
  onDelete: (key: string) => void;
  t: (key: string) => string;
}) {
  const { locale } = useLanguage();
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 80px 80px 72px',
      gap: 8,
      alignItems: 'center',
      padding: '8px 10px',
      borderRadius: 6,
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      fontSize: 12,
    }}>
      <div>
        <span style={{ color: THEME.text, fontWeight: 500 }}>{addon.label?.[locale as 'en' | 'ka' | 'ru'] || addon.label?.en || addon.key}</span>
        <span style={{ color: THEME.textDim, marginLeft: 6, fontSize: 11 }}>({addon.key})</span>
      </div>
      <span style={{ color: THEME.textMuted }}>{addon.basePrice}</span>
      <span style={{ color: THEME.textMuted }}>{addon.unit}</span>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onEdit(addon)}
          style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.textMuted }}
          title={t('common.edit')}
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={() => onDelete(addon.key)}
          style={{ padding: '3px 6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.error }}
          title={t('common.delete')}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function ServiceEditForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  t,
}: {
  value: EditingService;
  onChange: (v: EditingService) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: (key: string) => string;
}) {
  const set = (field: keyof EditingService, val: string | number) =>
    onChange({ ...value, [field]: val });

  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: THEME.surfaceLight,
      border: `1px solid ${THEME.borderLight}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.categoryKey')}</label>
          <input style={inputStyle} value={value.key} onChange={e => set('key', e.target.value)} placeholder="service_key" />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unit')}</label>
          <select style={selectStyle} value={value.unit} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.nameEn')}</label>
          <input style={inputStyle} value={value.labelEn} onChange={e => set('labelEn', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameKa')}</label>
          <input style={inputStyle} value={value.labelKa} onChange={e => set('labelKa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameRu')}</label>
          <input style={inputStyle} value={value.labelRu} onChange={e => set('labelRu', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (EN)</label>
          <input style={inputStyle} value={value.unitLabelEn} onChange={e => set('unitLabelEn', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (KA)</label>
          <input style={inputStyle} value={value.unitLabelKa} onChange={e => set('unitLabelKa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (RU)</label>
          <input style={inputStyle} value={value.unitLabelRu} onChange={e => set('unitLabelRu', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.basePrice')}</label>
          <input style={inputStyle} type="number" value={value.basePrice} onChange={e => set('basePrice', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.maxQuantity')}</label>
          <input style={inputStyle} type="number" value={value.maxQuantity} onChange={e => set('maxQuantity', e.target.value)} />
        </div>
      </div>
      {/* Discount Tiers */}
      <div>
        <label style={labelStyle}>{t('admin.discountTiers')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {value.discountTiers.map((tier, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>{t('admin.minQuantity')}</label>
                <input style={inputStyle} type="number" value={tier.minQuantity} onChange={e => {
                  const tiers = [...value.discountTiers];
                  tiers[i] = { ...tiers[i], minQuantity: e.target.value === '' ? '' : Number(e.target.value) };
                  onChange({ ...value, discountTiers: tiers });
                }} />
              </div>
              <div>
                <label style={labelStyle}>{t('admin.discountPercent')}</label>
                <input style={inputStyle} type="number" value={tier.percent} onChange={e => {
                  const tiers = [...value.discountTiers];
                  tiers[i] = { ...tiers[i], percent: e.target.value === '' ? '' : Number(e.target.value) };
                  onChange({ ...value, discountTiers: tiers });
                }} />
              </div>
              <button
                onClick={() => {
                  const tiers = value.discountTiers.filter((_, j) => j !== i);
                  onChange({ ...value, discountTiers: tiers });
                }}
                style={{ padding: '6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.error, height: 32 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...value, discountTiers: [...value.discountTiers, { minQuantity: '', percent: '' }] })}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              borderRadius: 5, border: `1px dashed ${THEME.border}`, background: 'transparent',
              color: THEME.textMuted, cursor: 'pointer', fontSize: 11, width: 'fit-content',
            }}
          >
            <Plus size={10} />
            {t('admin.addTier')}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 13 }}>
          {t('common.cancel')}
        </button>
        <button onClick={onSave} disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saving && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

function AddonEditForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  t,
}: {
  value: EditingAddon;
  onChange: (v: EditingAddon) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: (key: string) => string;
}) {
  const set = (field: keyof EditingAddon, val: string | number) =>
    onChange({ ...value, [field]: val });

  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: THEME.surfaceLight,
      border: `1px solid ${THEME.borderLight}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.categoryKey')}</label>
          <input style={inputStyle} value={value.key} onChange={e => set('key', e.target.value)} placeholder="addon_key" />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unit')}</label>
          <select style={selectStyle} value={value.unit} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.nameEn')}</label>
          <input style={inputStyle} value={value.labelEn} onChange={e => set('labelEn', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameKa')}</label>
          <input style={inputStyle} value={value.labelKa} onChange={e => set('labelKa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameRu')}</label>
          <input style={inputStyle} value={value.labelRu} onChange={e => set('labelRu', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.promptLabel')} (EN)</label>
          <input style={inputStyle} value={value.promptLabelEn} onChange={e => set('promptLabelEn', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.promptLabel')} (KA)</label>
          <input style={inputStyle} value={value.promptLabelKa} onChange={e => set('promptLabelKa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.promptLabel')} (RU)</label>
          <input style={inputStyle} value={value.promptLabelRu} onChange={e => set('promptLabelRu', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (EN)</label>
          <input style={inputStyle} value={value.unitLabelEn} onChange={e => set('unitLabelEn', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (KA)</label>
          <input style={inputStyle} value={value.unitLabelKa} onChange={e => set('unitLabelKa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.unitLabel')} (RU)</label>
          <input style={inputStyle} value={value.unitLabelRu} onChange={e => set('unitLabelRu', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.basePrice')}</label>
          <input style={inputStyle} type="number" value={value.basePrice} onChange={e => set('basePrice', e.target.value)} />
        </div>
        <IconPickerButton value={value.iconName} onChange={v => set('iconName', v)} label={t('admin.iconName')} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 13 }}>
          {t('common.cancel')}
        </button>
        <button onClick={onSave} disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saving && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ─── Services + Addons panel (shared for subcategory-level and variant-level) ─

type ServiceAddonContext =
  | { type: 'subcategory'; catKey: string; subKey: string; variantKey?: never }
  | { type: 'variant'; catKey: string; subKey: string; variantKey: string };

function ServiceAddonPanel({
  title,
  itemType,
  items,
  context,
  onReload,
  t,
}: {
  title: string;
  itemType: 'service' | 'addon' | 'additionalService';
  items?: (CatalogService | CatalogAddon)[];
  context: ServiceAddonContext;
  onReload: () => void;
  t: (key: string) => string;
}) {
  const safeItems = items ?? [];
  const toast = useToast();
  const [addingNew, setAddingNew] = useState(false);
  const [newService, setNewService] = useState<EditingService>(emptyEditingService);
  const [newAddon, setNewAddon] = useState<EditingAddon>(emptyEditingAddon);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editService, setEditService] = useState<EditingService>(emptyEditingService);
  const [editAddon, setEditAddon] = useState<EditingAddon>(emptyEditingAddon);
  const [saving, setSaving] = useState(false);
  const [orderedItems, setOrderedItems] = useState(safeItems);
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setOrderedItems(safeItems); }, [safeItems]);

  const isAddon = itemType === 'addon';

  const persistItemOrder = useCallback(async (reordered: (CatalogService | CatalogAddon)[]) => {
    const fieldKey = itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons';
    try {
      if (context.type === 'variant') {
        await api.put(`/service-catalog/${context.catKey}/subcategories/${context.subKey}/variants/${context.variantKey}`, {
          [fieldKey]: reordered,
        });
      } else {
        await api.put(`/service-catalog/${context.catKey}/subcategories/${context.subKey}`, {
          [fieldKey]: reordered,
        });
      }
      toast.success(t('admin.reorderSaved'));
      onReload();
    } catch {
      setOrderedItems(safeItems);
      toast.error(t('common.error'));
    }
  }, [context, itemType, safeItems, onReload, t, toast]);

  const handleItemReorder = useCallback((reordered: (CatalogService | CatalogAddon)[]) => {
    setOrderedItems(reordered);
    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => persistItemOrder(reordered), 600);
  }, [persistItemOrder]);

  const buildSubcatBody = (payload: CatalogService | CatalogAddon, sub: CatalogSubcategory | null) => {
    // For subcategory-level, we send the full updated subcategory payload
    // The api expects a CatalogSubcategory shape
    return payload;
  };

  const upsertViaVariant = async (payload: CatalogService | CatalogAddon) => {
    const { catKey, subKey, variantKey } = context as { catKey: string; subKey: string; variantKey: string };
    await api.put(`/service-catalog/${catKey}/subcategories/${subKey}/variants/${variantKey}`, {
      [itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons']: [payload],
    });
  };

  const upsertViaSubcategory = async (payload: CatalogService | CatalogAddon) => {
    const { catKey, subKey } = context;
    await api.put(`/service-catalog/${catKey}/subcategories/${subKey}`, {
      [itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons']: [payload],
    });
  };

  const deleteItem = async (key: string) => {
    if (!confirm(t('common.confirm'))) return;
    try {
      if (context.type === 'variant') {
        await api.delete(`/service-catalog/${context.catKey}/subcategories/${context.subKey}/variants/${context.variantKey}`);
      } else {
        await api.put(`/service-catalog/${context.catKey}/subcategories/${context.subKey}`, {
          [itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons']:
            safeItems.filter(i => i.key !== key),
        });
      }
      onReload();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const saveNew = async () => {
    setSaving(true);
    try {
      const payload = isAddon ? editingToAddonPayload(newAddon) : editingToServicePayload(newService);
      if (context.type === 'variant') {
        await upsertViaVariant(payload);
      } else {
        await upsertViaSubcategory(payload);
      }
      setAddingNew(false);
      setNewService(emptyEditingService());
      setNewAddon(emptyEditingAddon());
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = isAddon ? editingToAddonPayload(editAddon) : editingToServicePayload(editService);
      // Replace the item in the current list and re-PUT the full array
      const updatedItems = safeItems.map(i => i.key === editingKey ? payload : i);
      if (context.type === 'variant') {
        await api.put(`/service-catalog/${context.catKey}/subcategories/${context.subKey}/variants/${context.variantKey}`, {
          [itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons']: updatedItems,
        });
      } else {
        await api.put(`/service-catalog/${context.catKey}/subcategories/${context.subKey}`, {
          [itemType === 'service' ? 'services' : itemType === 'additionalService' ? 'additionalServices' : 'addons']: updatedItems,
        });
      }
      setEditingKey(null);
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const tableHeader = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isAddon ? '1fr 80px 80px 72px' : '1fr 80px 80px 70px 60px 72px',
      gap: 8,
      padding: '4px 10px',
      fontSize: 11,
      color: THEME.textDim,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      <span>Name / Key</span>
      <span>{t('admin.basePrice')}</span>
      <span>{t('admin.unit')}</span>
      {!isAddon && <span>{t('admin.maxQuantity')}</span>}
      {!isAddon && <span>Tiers</span>}
      <span style={{ textAlign: 'right' }}>Actions</span>
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <SectionHeader title={title} count={safeItems.length} />
      {orderedItems.length > 0 && tableHeader}
      <Reorder.Group axis="y" values={orderedItems} onReorder={handleItemReorder} as="div" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {orderedItems.map(item =>
          editingKey === item.key ? (
            <Reorder.Item key={item.key} value={item} dragListener={false} as="div" style={{ listStyle: 'none' }}>
              {isAddon ? (
                <AddonEditForm
                  value={editAddon}
                  onChange={setEditAddon}
                  onSave={saveEdit}
                  onCancel={() => setEditingKey(null)}
                  saving={saving}
                  t={t}
                />
              ) : (
                <ServiceEditForm
                  value={editService}
                  onChange={setEditService}
                  onSave={saveEdit}
                  onCancel={() => setEditingKey(null)}
                  saving={saving}
                  t={t}
                />
              )}
            </Reorder.Item>
          ) : (
            <Reorder.Item key={item.key} value={item} as="div" style={{ listStyle: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ cursor: 'grab', color: THEME.textDim, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <GripVertical size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isAddon ? (
                    <AddonRow
                      addon={item as CatalogAddon}
                      onEdit={a => { setEditingKey(a.key); setEditAddon(addonToEditing(a)); }}
                      onDelete={deleteItem}
                      t={t}
                    />
                  ) : (
                    <ServiceRow
                      service={item as CatalogService}
                      onEdit={s => { setEditingKey(s.key); setEditService(serviceToEditing(s)); }}
                      onDelete={deleteItem}
                      t={t}
                    />
                  )}
                </div>
              </div>
            </Reorder.Item>
          )
        )}
      </Reorder.Group>

      {addingNew ? (
        isAddon ? (
          <AddonEditForm
            value={newAddon}
            onChange={setNewAddon}
            onSave={saveNew}
            onCancel={() => { setAddingNew(false); setNewAddon(emptyEditingAddon()); }}
            saving={saving}
            t={t}
          />
        ) : (
          <ServiceEditForm
            value={newService}
            onChange={setNewService}
            onSave={saveNew}
            onCancel={() => { setAddingNew(false); setNewService(emptyEditingService()); }}
            saving={saving}
            t={t}
          />
        )
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 6, border: `1px dashed ${THEME.border}`, background: 'transparent',
            color: THEME.textMuted, cursor: 'pointer', fontSize: 12, width: '100%',
          }}
        >
          <Plus size={12} />
          {isAddon ? t('admin.addAddon') : t('admin.addService')}
        </button>
      )}
    </div>
  );
}

// ─── Variant panel ────────────────────────────────────────────────────────────

function VariantPanel({
  variant,
  catKey,
  subKey,
  onReload,
  onDelete,
  t,
}: {
  variant: CatalogVariant;
  catKey: string;
  subKey: string;
  onReload: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState<LocalizedText>(variant.label);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const saveVariant = async () => {
    setSaving(true);
    try {
      await api.put(`/service-catalog/${catKey}/subcategories/${subKey}/variants/${variant.key}`, {
        label: editLabel,
      });
      setEditing(false);
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const context: ServiceAddonContext = { type: 'variant', catKey, subKey, variantKey: variant.key };

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${THEME.border}`,
      background: THEME.surface,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          cursor: 'pointer', background: THEME.surfaceLight,
        }}
        onClick={() => setExpanded(p => !p)}
      >
        {expanded ? <ChevronDown size={14} color={THEME.textMuted} /> : <ChevronRight size={14} color={THEME.textMuted} />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: THEME.text }}>
          {variant.label?.[locale as 'en' | 'ka' | 'ru'] || variant.label?.en || variant.key} <span style={{ color: THEME.textDim, fontSize: 11 }}>({variant.key})</span>
        </span>
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setEditing(p => !p)}
            style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.textMuted, fontSize: 12 }}
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.error, fontSize: 12 }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: 12, borderTop: `1px solid ${THEME.border}`, background: THEME.surfaceLight }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>{t('admin.nameEn')}</label>
              <input style={inputStyle} value={editLabel.en} onChange={e => setEditLabel(p => ({ ...p, en: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{t('admin.nameKa')}</label>
              <input style={inputStyle} value={editLabel.ka} onChange={e => setEditLabel(p => ({ ...p, ka: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{t('admin.nameRu')}</label>
              <input style={inputStyle} value={editLabel.ru} onChange={e => setEditLabel(p => ({ ...p, ru: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 12 }}>
              {t('common.cancel')}
            </button>
            <button onClick={saveVariant} disabled={saving} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 12 }}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ padding: 14 }}>
          <ServiceAddonPanel
            title={t('admin.services')}
            itemType="service"
            items={variant.services}
            context={context}
            onReload={onReload}
            t={t}
          />
          <ServiceAddonPanel
            title={t('admin.addons')}
            itemType="addon"
            items={variant.addons}
            context={context}
            onReload={onReload}
            t={t}
          />
          <ServiceAddonPanel
            title={t('admin.additionalServices')}
            itemType="additionalService"
            items={variant.additionalServices}
            context={context}
            onReload={onReload}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

// ─── Add Variant Form ─────────────────────────────────────────────────────────

function AddVariantForm({
  catKey,
  subKey,
  onDone,
  onCancel,
  t,
}: {
  catKey: string;
  subKey: string;
  onDone: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const toast = useToast();
  const [key, setKey] = useState('');
  const [label, setLabel] = useState<LocalizedText>(emptyLocalized());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await api.put(`/service-catalog/${catKey}/subcategories/${subKey}/variants/${key}`, {
        label,
        services: [],
        addons: [],
        additionalServices: [],
      });
      onDone();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 12, borderRadius: 8, background: THEME.surfaceLight, border: `1px solid ${THEME.borderLight}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={labelStyle}>{t('admin.categoryKey')}</label>
        <input style={inputStyle} value={key} onChange={e => setKey(e.target.value)} placeholder="variant_key" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.nameEn')}</label>
          <input style={inputStyle} value={label.en} onChange={e => setLabel(p => ({ ...p, en: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameKa')}</label>
          <input style={inputStyle} value={label.ka} onChange={e => setLabel(p => ({ ...p, ka: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameRu')}</label>
          <input style={inputStyle} value={label.ru} onChange={e => setLabel(p => ({ ...p, ru: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 13 }}>
          {t('common.cancel')}
        </button>
        <button onClick={save} disabled={saving} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 13 }}>
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ─── Subcategory Detail Panel ─────────────────────────────────────────────────

function SubcategoryDetail({
  sub,
  catKey,
  onReload,
  t,
}: {
  sub: CatalogSubcategory;
  catKey: string;
  onReload: () => void;
  t: (key: string) => string;
}) {
  const { locale } = useLanguage();
  const toast = useToast();
  const [editing, setEditing] = useState<EditingSubcategory>({
    key: sub.key,
    label: sub.label ? { ...sub.label } : emptyLocalized(),
    description: sub.description ? { ...sub.description } : emptyLocalized(),
    iconName: sub.iconName ?? '',
    priceRangeMin: sub.priceRange?.min ?? '',
    priceRangeMax: sub.priceRange?.max ?? '',
    sortOrder: sub.sortOrder ?? 0,
    isActive: sub.isActive ?? true,
    orderDiscountTiers: (sub.orderDiscountTiers ?? []).map(t => ({ minQuantity: t.minQuantity, percent: t.percent })),
  });
  const [saving, setSaving] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string>(sub.variants?.[0]?.key ?? '');

  const toggleActive = async () => {
    const newActive = !editing.isActive;
    setEditing(p => ({ ...p, isActive: newActive }));
    try {
      await api.put(`/service-catalog/${catKey}/subcategories/${sub.key}`, { isActive: newActive });
      toast.success(newActive ? t('admin.activated') : t('admin.deactivated'));
      onReload();
    } catch {
      setEditing(p => ({ ...p, isActive: !newActive }));
      toast.error(t('common.error'));
    }
  };

  const saveSubcategory = async () => {
    setSaving(true);
    try {
      const validOrderTiers = editing.orderDiscountTiers
        .filter(t => t.minQuantity !== '' && t.percent !== '')
        .map(t => ({ minQuantity: Number(t.minQuantity), percent: Number(t.percent) }))
        .sort((a, b) => a.minQuantity - b.minQuantity);
      await api.put(`/service-catalog/${catKey}/subcategories/${sub.key}`, {
        label: editing.label,
        description: cleanDescription(editing.description),
        iconName: editing.iconName,
        priceRange: { min: editing.priceRangeMin, max: editing.priceRangeMax !== '' ? editing.priceRangeMax : undefined },
        sortOrder: editing.sortOrder,
        isActive: editing.isActive,
        ...(validOrderTiers.length > 0 && { orderDiscountTiers: validOrderTiers }),
      });
      toast.success(t('admin.subcategoryUpdated'));
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async (varKey: string) => {
    if (!confirm(t('admin.deleteVariantConfirmation'))) return;
    try {
      await api.delete(`/service-catalog/${catKey}/subcategories/${sub.key}/variants/${varKey}`);
      toast.success(t('admin.variantDeleted'));
      onReload();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const context: ServiceAddonContext = { type: 'subcategory', catKey, subKey: sub.key };
  const variants = sub.variants ?? [];
  const currentVariant = variants.find(v => v.key === activeVariant);

  return (
    <div>
      {/* Subcategory edit form */}
      <div style={{
        padding: 16,
        borderRadius: 8,
        background: THEME.surfaceLight,
        border: `1px solid ${THEME.border}`,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{t('admin.editSubcategory')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              onClick={toggleActive}
              style={{
                width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
                background: editing.isActive ? THEME.success : THEME.border, transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: editing.isActive ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: THEME.textMuted }}>
              {editing.isActive ? t('admin.active') : t('admin.inactive')}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>{t('admin.nameEn')}</label>
            <input style={inputStyle} value={editing.label.en} onChange={e => setEditing(p => ({ ...p, label: { ...p.label, en: e.target.value } }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.nameKa')}</label>
            <input style={inputStyle} value={editing.label.ka} onChange={e => setEditing(p => ({ ...p, label: { ...p.label, ka: e.target.value } }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.nameRu')}</label>
            <input style={inputStyle} value={editing.label.ru} onChange={e => setEditing(p => ({ ...p, label: { ...p.label, ru: e.target.value } }))} />
          </div>
        </div>
        <LocalizedRichText
          value={editing.description}
          onChange={(desc) => setEditing(p => ({ ...p, description: desc }))}
          label={t('admin.description')}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <IconPickerButton value={editing.iconName} onChange={v => setEditing(p => ({ ...p, iconName: v }))} label={t('admin.iconName')} />
          <div>
            <label style={labelStyle}>{t('admin.priceRange')} Min</label>
            <input style={inputStyle} type="number" value={editing.priceRangeMin} onChange={e => setEditing(p => ({ ...p, priceRangeMin: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.priceRange')} Max</label>
            <input style={inputStyle} type="number" value={editing.priceRangeMax} onChange={e => setEditing(p => ({ ...p, priceRangeMax: e.target.value === '' ? '' : Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.sortOrder')}</label>
            <input style={inputStyle} type="number" value={editing.sortOrder} onChange={e => setEditing(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveSubcategory}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
              borderRadius: 7, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 13,
            }}
          >
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            {t('common.save')}
          </button>
        </div>
        {/* Order Discount Tiers */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{t('admin.orderDiscountTiers')}</label>
          <p style={{ fontSize: 11, color: THEME.textDim, marginBottom: 8 }}>{t('admin.orderDiscountHint')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {editing.orderDiscountTiers.map((tier, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>{t('admin.minQuantity')}</label>
                  <input style={inputStyle} type="number" value={tier.minQuantity} onChange={e => {
                    const tiers = [...editing.orderDiscountTiers];
                    tiers[i] = { ...tiers[i], minQuantity: e.target.value === '' ? '' : Number(e.target.value) };
                    setEditing(p => ({ ...p, orderDiscountTiers: tiers }));
                  }} />
                </div>
                <div>
                  <label style={labelStyle}>{t('admin.discountPercent')}</label>
                  <input style={inputStyle} type="number" value={tier.percent} onChange={e => {
                    const tiers = [...editing.orderDiscountTiers];
                    tiers[i] = { ...tiers[i], percent: e.target.value === '' ? '' : Number(e.target.value) };
                    setEditing(p => ({ ...p, orderDiscountTiers: tiers }));
                  }} />
                </div>
                <button
                  onClick={() => {
                    const tiers = editing.orderDiscountTiers.filter((_, j) => j !== i);
                    setEditing(p => ({ ...p, orderDiscountTiers: tiers }));
                  }}
                  style={{ padding: '6px', borderRadius: 4, border: `1px solid ${THEME.border}`, background: 'transparent', cursor: 'pointer', color: THEME.error, height: 32 }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditing(p => ({ ...p, orderDiscountTiers: [...p.orderDiscountTiers, { minQuantity: '', percent: '' }] }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                borderRadius: 5, border: `1px dashed ${THEME.border}`, background: 'transparent',
                color: THEME.textMuted, cursor: 'pointer', fontSize: 11, width: 'fit-content',
              }}
            >
              <Plus size={10} />
              {t('admin.addTier')}
            </button>
          </div>
        </div>
      </div>

      {/* Variants section */}
      {variants.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={t('admin.variants')} count={variants.length} />
          {/* Variant tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {variants.map(v => (
              <button
                key={v.key}
                onClick={() => setActiveVariant(v.key)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: activeVariant === v.key ? THEME.primary : THEME.surface,
                  color: activeVariant === v.key ? 'white' : THEME.textMuted,
                  border: `1px solid ${activeVariant === v.key ? THEME.primary : THEME.border}`,
                  fontWeight: activeVariant === v.key ? 600 : 400,
                }}
              >
                {v.label?.[locale as 'en' | 'ka' | 'ru'] || v.label?.en || v.key}
              </button>
            ))}
          </div>
          {currentVariant && (
            <VariantPanel
              key={currentVariant.key}
              variant={currentVariant}
              catKey={catKey}
              subKey={sub.key}
              onReload={onReload}
              onDelete={() => deleteVariant(currentVariant.key)}
              t={t}
            />
          )}
        </div>
      )}

      {/* Add variant */}
      {addingVariant ? (
        <AddVariantForm
          catKey={catKey}
          subKey={sub.key}
          onDone={() => { setAddingVariant(false); onReload(); }}
          onCancel={() => setAddingVariant(false)}
          t={t}
        />
      ) : (
        <button
          onClick={() => setAddingVariant(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 6, border: `1px dashed ${THEME.border}`, background: 'transparent',
            color: THEME.textMuted, cursor: 'pointer', fontSize: 12, marginBottom: 20,
          }}
        >
          <Plus size={12} />
          {t('admin.addVariant')}
        </button>
      )}

      {/* Subcategory-level services (when no variants) */}
      {variants.length === 0 && (
        <ServiceAddonPanel
          title={t('admin.services')}
          itemType="service"
          items={sub.services}
          context={context}
          onReload={onReload}
          t={t}
        />
      )}

      {/* Addons always shown */}
      <ServiceAddonPanel
        title={t('admin.addons')}
        itemType="addon"
        items={sub.addons}
        context={context}
        onReload={onReload}
        t={t}
      />

      {variants.length === 0 && (
        <ServiceAddonPanel
          title={t('admin.additionalServices')}
          itemType="additionalService"
          items={sub.additionalServices}
          context={context}
          onReload={onReload}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Category Detail Panel ────────────────────────────────────────────────────

function CategoryDetail({
  category,
  onReload,
  onDelete,
  t,
  locale,
}: {
  category: ServiceCatalogCategory;
  onReload: () => void;
  onDelete: () => void;
  t: (key: string) => string;
  locale: string;
}) {
  const toast = useToast();
  const [editingCat, setEditingCat] = useState<EditingCategory>({
    key: category.key,
    label: { ...category.label },
    description: category.description ? { ...category.description } : emptyLocalized(),
    iconName: category.iconName,
    color: category.color,
    minPrice: category.minPrice,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [selectedSubKey, setSelectedSubKey] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSub, setNewSub] = useState<EditingSubcategory>({
    key: '', label: emptyLocalized(), description: emptyLocalized(),
    iconName: '', priceRangeMin: 0, priceRangeMax: '', sortOrder: 0, isActive: true, orderDiscountTiers: [],
  });
  const [savingNewSub, setSavingNewSub] = useState(false);
  const [orderedSubs, setOrderedSubs] = useState(category.subcategories);
  const subReorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setOrderedSubs(category.subcategories); }, [category.subcategories]);

  const selectedSub = category.subcategories.find(s => s.key === selectedSubKey);

  const persistSubOrder = useCallback(async (reordered: CatalogSubcategory[]) => {
    try {
      await api.patch(`/service-catalog/${category.key}/reorder`, {
        keys: reordered.map(s => s.key),
      });
      toast.success(t('admin.reorderSaved'));
      onReload();
    } catch {
      setOrderedSubs(category.subcategories);
      toast.error(t('common.error'));
    }
  }, [category.key, category.subcategories, onReload, t, toast]);

  const handleSubReorder = useCallback((reordered: CatalogSubcategory[]) => {
    setOrderedSubs(reordered);
    if (subReorderTimeoutRef.current) clearTimeout(subReorderTimeoutRef.current);
    subReorderTimeoutRef.current = setTimeout(() => persistSubOrder(reordered), 600);
  }, [persistSubOrder]);

  const toggleCatActive = async () => {
    const newActive = !editingCat.isActive;
    setEditingCat(p => ({ ...p, isActive: newActive }));
    try {
      await api.patch(`/service-catalog/${category.key}`, { isActive: newActive });
      toast.success(newActive ? t('admin.activated') : t('admin.deactivated'));
      onReload();
    } catch {
      setEditingCat(p => ({ ...p, isActive: !newActive }));
      toast.error(t('common.error'));
    }
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      await api.patch(`/service-catalog/${category.key}`, {
        label: editingCat.label,
        description: cleanDescription(editingCat.description),
        iconName: editingCat.iconName,
        color: editingCat.color,
        minPrice: editingCat.minPrice,
        sortOrder: editingCat.sortOrder,
        isActive: editingCat.isActive,
      });
      toast.success(t('admin.categoryUpdated'));
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const saveNewSubcategory = async () => {
    if (!newSub.key.trim()) return;
    setSavingNewSub(true);
    try {
      await api.put(`/service-catalog/${category.key}/subcategories/${newSub.key}`, {
        label: newSub.label,
        description: cleanDescription(newSub.description),
        iconName: newSub.iconName,
        priceRange: { min: newSub.priceRangeMin, max: newSub.priceRangeMax !== '' ? newSub.priceRangeMax : undefined },
        sortOrder: newSub.sortOrder,
        isActive: newSub.isActive,
        variants: [],
        services: [],
        addons: [],
        additionalServices: [],
      });
      toast.success(t('admin.subcategoryUpdated'));
      setAddingSubcategory(false);
      setNewSub({ key: '', label: emptyLocalized(), description: emptyLocalized(), iconName: '', priceRangeMin: 0, priceRangeMax: '', sortOrder: 0, isActive: true, orderDiscountTiers: [] });
      onReload();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingNewSub(false);
    }
  };

  const deleteSubcategory = async (subKey: string) => {
    if (!confirm(t('admin.deleteSubcategoryConfirmation'))) return;
    try {
      await api.delete(`/service-catalog/${category.key}/subcategories/${subKey}`);
      toast.success(t('admin.subcategoryDeleted'));
      if (selectedSubKey === subKey) setSelectedSubKey(null);
      onReload();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const toggleSubExpanded = (key: string) => {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalServices = category.subcategories.reduce((acc, sub) => {
    const direct = (sub.services?.length ?? 0) + (sub.additionalServices?.length ?? 0);
    const fromVariants = (sub.variants ?? []).reduce((va, v) => va + (v.services?.length ?? 0) + (v.additionalServices?.length ?? 0), 0);
    return acc + direct + fromVariants;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Category form */}
      <div style={{
        padding: 20,
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.surfaceLight,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: editingCat.color || THEME.primary }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: THEME.text }}>
              {category.label?.[locale as 'en' | 'ka' | 'ru'] || category.label?.en || category.key}
            </span>
            <span style={{ fontSize: 11, color: THEME.textDim }}>({category.key})</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={saveCategory}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                borderRadius: 7, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 12,
              }}
            >
              {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
              {t('common.save')}
            </button>
            <button
              onClick={() => {
                if (confirm(t('admin.deleteCategoryConfirmation'))) onDelete();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                borderRadius: 7, border: `1px solid ${THEME.error}40`, background: `${THEME.error}10`, color: THEME.error, cursor: 'pointer', fontSize: 12,
              }}
            >
              <Trash2 size={12} />
              {t('common.delete')}
            </button>
          </div>
        </div>

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            onClick={toggleCatActive}
            style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
              background: editingCat.isActive ? THEME.success : THEME.border, transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: editingCat.isActive ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: THEME.textMuted }}>
            {editingCat.isActive ? t('admin.active') : t('admin.inactive')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>{t('admin.nameEn')}</label>
            <input style={inputStyle} value={editingCat.label.en} onChange={e => setEditingCat(p => ({ ...p, label: { ...p.label, en: e.target.value } }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.nameKa')}</label>
            <input style={inputStyle} value={editingCat.label.ka} onChange={e => setEditingCat(p => ({ ...p, label: { ...p.label, ka: e.target.value } }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.nameRu')}</label>
            <input style={inputStyle} value={editingCat.label.ru} onChange={e => setEditingCat(p => ({ ...p, label: { ...p.label, ru: e.target.value } }))} />
          </div>
        </div>
        <LocalizedRichText
          value={editingCat.description}
          onChange={(desc) => setEditingCat(p => ({ ...p, description: desc }))}
          label={t('admin.description')}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <IconPickerButton value={editingCat.iconName} onChange={v => setEditingCat(p => ({ ...p, iconName: v }))} label={t('admin.iconName')} />
          <ColorPickerButton value={editingCat.color} onChange={v => setEditingCat(p => ({ ...p, color: v }))} label={t('admin.colorCode')} />
          <div>
            <label style={labelStyle}>{t('admin.minPrice')}</label>
            <input style={inputStyle} type="number" value={editingCat.minPrice} onChange={e => setEditingCat(p => ({ ...p, minPrice: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('admin.sortOrder')}</label>
            <input style={inputStyle} type="number" value={editingCat.sortOrder} onChange={e => setEditingCat(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 24, padding: '10px 20px',
        background: THEME.surface, borderBottom: `1px solid ${THEME.border}`,
        fontSize: 12,
      }}>
        <span style={{ color: THEME.textMuted }}>{t('admin.subcategories')}: <strong style={{ color: THEME.text }}>{category.subcategories.length}</strong></span>
        <span style={{ color: THEME.textMuted }}>{t('admin.services')}: <strong style={{ color: THEME.text }}>{totalServices}</strong></span>
      </div>

      {/* Split: subcategory list | subcategory detail */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Subcategory sidebar */}
        <div style={{
          width: 220,
          flexShrink: 0,
          borderRight: `1px solid ${THEME.border}`,
          background: THEME.surface,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${THEME.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: THEME.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('admin.subcategories')}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {orderedSubs.length === 0 ? (
              <p style={{ padding: 16, fontSize: 12, color: THEME.textDim, textAlign: 'center' }}>{t('admin.noSubcategories')}</p>
            ) : (
              <Reorder.Group axis="y" values={orderedSubs} onReorder={handleSubReorder} as="div" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {orderedSubs.map(sub => (
                  <Reorder.Item key={sub.key} value={sub} as="div" style={{ listStyle: 'none' }}>
                    <div
                      onClick={() => setSelectedSubKey(selectedSubKey === sub.key ? null : sub.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '9px 12px',
                        cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${THEME.border}`,
                        background: selectedSubKey === sub.key ? `${THEME.primary}15` : 'transparent',
                        borderLeft: selectedSubKey === sub.key ? `2px solid ${THEME.primary}` : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (selectedSubKey !== sub.key) e.currentTarget.style.background = THEME.surfaceHover; }}
                      onMouseLeave={e => { if (selectedSubKey !== sub.key) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div onPointerDown={e => e.stopPropagation()} style={{ cursor: 'grab', color: THEME.textDim, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <GripVertical size={12} />
                      </div>
                      <span style={{ flex: 1, color: selectedSubKey === sub.key ? THEME.primary : THEME.text, fontWeight: selectedSubKey === sub.key ? 600 : 400, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.label?.[locale as 'en' | 'ka' | 'ru'] || sub.label?.en || sub.key}
                      </span>
                      {sub.isActive === false && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${THEME.error}20`, color: THEME.error }}>
                          {t('admin.inactive')}
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteSubcategory(sub.key); }}
                        style={{ padding: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: THEME.error, opacity: 0.6, flexShrink: 0 }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${THEME.border}` }}>
            {addingSubcategory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <label style={labelStyle}>{t('admin.categoryKey')}</label>
                  <input style={inputStyle} value={newSub.key} onChange={e => setNewSub(p => ({ ...p, key: e.target.value }))} placeholder="sub_key" />
                </div>
                <div>
                  <label style={labelStyle}>{t('admin.nameEn')}</label>
                  <input style={inputStyle} value={newSub.label.en} onChange={e => setNewSub(p => ({ ...p, label: { ...p.label, en: e.target.value } }))} />
                </div>
                <div>
                  <label style={labelStyle}>{t('admin.nameKa')}</label>
                  <input style={inputStyle} value={newSub.label.ka} onChange={e => setNewSub(p => ({ ...p, label: { ...p.label, ka: e.target.value } }))} />
                </div>
                <div>
                  <label style={labelStyle}>{t('admin.nameRu')}</label>
                  <input style={inputStyle} value={newSub.label.ru} onChange={e => setNewSub(p => ({ ...p, label: { ...p.label, ru: e.target.value } }))} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setAddingSubcategory(false)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 11 }}>
                    {t('common.cancel')}
                  </button>
                  <button onClick={saveNewSubcategory} disabled={savingNewSub} style={{ flex: 1, padding: '5px', borderRadius: 5, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 11 }}>
                    {t('common.save')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingSubcategory(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px', borderRadius: 6, border: `1px dashed ${THEME.border}`,
                  background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 12,
                }}
              >
                <Plus size={12} />
                {t('admin.addSubcategory')}
              </button>
            )}
          </div>
        </div>

        {/* Subcategory detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {selectedSub ? (
            <SubcategoryDetail
              key={selectedSub.key}
              sub={selectedSub}
              catKey={category.key}
              onReload={onReload}
              t={t}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.5 }}>
              <FolderOpen size={48} color={THEME.textDim} />
              <p style={{ color: THEME.textMuted, fontSize: 14 }}>{t('admin.noSubcategories')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Category Form ────────────────────────────────────────────────────────

function AddCategoryForm({
  onDone,
  onCancel,
  t,
}: {
  onDone: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const toast = useToast();
  const [form, setForm] = useState<EditingCategory>({
    key: '', label: emptyLocalized(), description: emptyLocalized(),
    iconName: '', color: '#C4735B', minPrice: 0, sortOrder: 0, isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.key.trim()) return;
    setSaving(true);
    try {
      await api.post('/service-catalog', {
        key: form.key,
        label: form.label,
        description: cleanDescription(form.description),
        iconName: form.iconName,
        color: form.color,
        minPrice: form.minPrice,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        subcategories: [],
      });
      toast.success(t('admin.categoryCreated'));
      onDone();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: 16,
      background: THEME.surfaceLight,
      borderTop: `1px solid ${THEME.border}`,
    }}>
      <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: THEME.text }}>{t('admin.addCategory')}</div>
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>{t('admin.categoryKey')}</label>
        <input style={inputStyle} value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="category_key" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>{t('admin.nameEn')}</label>
          <input style={inputStyle} value={form.label.en} onChange={e => setForm(p => ({ ...p, label: { ...p.label, en: e.target.value } }))} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameKa')}</label>
          <input style={inputStyle} value={form.label.ka} onChange={e => setForm(p => ({ ...p, label: { ...p.label, ka: e.target.value } }))} />
        </div>
        <div>
          <label style={labelStyle}>{t('admin.nameRu')}</label>
          <input style={inputStyle} value={form.label.ru} onChange={e => setForm(p => ({ ...p, label: { ...p.label, ru: e.target.value } }))} />
        </div>
      </div>
      <LocalizedRichText
        value={form.description}
        onChange={(desc) => setForm(p => ({ ...p, description: desc }))}
        label={t('admin.description')}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <IconPickerButton value={form.iconName} onChange={v => setForm(p => ({ ...p, iconName: v }))} label={t('admin.iconName')} />
        <ColorPickerButton value={form.color} onChange={v => setForm(p => ({ ...p, color: v }))} label={t('admin.colorCode')} />
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${THEME.border}`, background: 'transparent', color: THEME.textMuted, cursor: 'pointer', fontSize: 13 }}>
          {t('common.cancel')}
        </button>
        <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 13 }}>
          {saving && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────

function ServiceCatalogPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();

  const [categories, setCategories] = useState<ServiceCatalogCategory[]>([]);
  const [orderedCategories, setOrderedCategories] = useState<ServiceCatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const catReorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCategory = categories.find(c => c.key === selectedCatKey) ?? null;

  const loadCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/service-catalog/admin/all');
      setCategories(res.data);
      setOrderedCategories(res.data);
    } catch {
      setError(t('admin.failedToLoadCatalog'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated) loadCatalog();
  }, [isAuthenticated, loadCatalog]);

  const handleDelete = async (catKey: string) => {
    try {
      await api.delete(`/service-catalog/${catKey}`);
      toast.success(t('admin.categoryDeleted'));
      setSelectedCatKey(null);
      loadCatalog();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSeed = async () => {
    if (!confirm(t('admin.seedConfirmation'))) return;
    setSeeding(true);
    try {
      await api.post('/service-catalog/seed');
      toast.success(t('admin.seedSuccess'));
      loadCatalog();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSeeding(false);
    }
  };

  const persistCatOrder = useCallback(async (reordered: ServiceCatalogCategory[]) => {
    try {
      await api.patch('/service-catalog/reorder-categories', {
        keys: reordered.map(c => c.key),
      });
      toast.success(t('admin.reorderSaved'));
      loadCatalog();
    } catch {
      setOrderedCategories(categories);
      toast.error(t('common.error'));
    }
  }, [categories, loadCatalog, t, toast]);

  const handleCatReorder = useCallback((reordered: ServiceCatalogCategory[]) => {
    setOrderedCategories(reordered);
    if (catReorderTimeoutRef.current) clearTimeout(catReorderTimeoutRef.current);
    catReorderTimeoutRef.current = setTimeout(() => persistCatOrder(reordered), 600);
  }, [persistCatOrder]);

  const totalSubcategories = categories.reduce((acc, c) => acc + c.subcategories.length, 0);
  const totalServices = categories.reduce((acc, c) =>
    acc + (c.subcategories ?? []).reduce((sa, sub) => {
      const direct = (sub.services?.length ?? 0) + (sub.additionalServices?.length ?? 0);
      const fromVariants = (sub.variants ?? []).reduce((va, v) => va + (v.services?.length ?? 0) + (v.additionalServices?.length ?? 0), 0);
      return sa + direct + fromVariants;
    }, 0), 0);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: THEME.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
            animation: 'pulse 2s infinite',
          }}>
            <Layers size={32} color="white" />
          </div>
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>{t('admin.catalogLoading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: THEME.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: `${THEME.error}20` }}>
            <AlertCircle size={32} color={THEME.error} />
          </div>
          <p style={{ color: THEME.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{error}</p>
          <button
            onClick={loadCatalog}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: THEME.primary, color: 'white', cursor: 'pointer', fontSize: 14 }}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.surface, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: `${THEME.surface}E6`,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${THEME.border}`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
          boxShadow: `0 4px 16px ${THEME.primary}40`,
        }}>
          <Layers size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: THEME.text, margin: 0 }}>{t('admin.serviceCatalog')}</h1>
          <p style={{ fontSize: 12, color: THEME.textMuted, margin: 0 }}>{t('admin.serviceCatalogDesc')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href="/admin"
            style={{
              padding: '7px 14px', borderRadius: 8, border: `1px solid ${THEME.border}`,
              background: THEME.surfaceLight, color: THEME.textMuted, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            {t('admin.catalogManagement')}
          </Link>
          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, border: `1px solid ${THEME.border}`,
              background: THEME.surfaceLight, color: THEME.textMuted, cursor: 'pointer', fontSize: 13,
            }}
          >
            {seeding ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={13} />}
            {t('admin.seedCatalog')}
          </button>
        </div>
      </header>

      {/* Main two-panel layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 65px)' }}>
        {/* Left: Category sidebar */}
        <div style={{
          width: 300,
          flexShrink: 0,
          borderRight: `1px solid ${THEME.border}`,
          background: THEME.surfaceLight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{t('admin.categories')}</span>
              <span style={{ fontSize: 11, color: THEME.textDim }}>{categories.length}</span>
            </div>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: t('admin.totalCategories'), value: categories.length },
                { label: t('admin.totalSubcategories'), value: totalSubcategories },
                { label: t('admin.totalServices'), value: totalServices },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '6px 8px', borderRadius: 6, background: THEME.surface,
                  border: `1px solid ${THEME.border}`, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: THEME.text, fontFamily: 'monospace' }}>{stat.value}</div>
                  <div style={{ fontSize: 9, color: THEME.textDim, marginTop: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {orderedCategories.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <Package size={40} color={THEME.textDim} style={{ margin: '0 auto 8px' }} />
                <p style={{ color: THEME.textMuted, fontSize: 13 }}>{t('admin.noCategoriesFound')}</p>
              </div>
            ) : (
              <Reorder.Group axis="y" values={orderedCategories} onReorder={handleCatReorder} as="div" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {orderedCategories.map(cat => (
                  <Reorder.Item key={cat.key} value={cat} as="div" style={{ listStyle: 'none' }}>
                    <div
                      onClick={() => setSelectedCatKey(selectedCatKey === cat.key ? null : cat.key)}
                      style={{
                        padding: '11px 16px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${THEME.border}`,
                        borderLeft: selectedCatKey === cat.key ? `3px solid ${cat.color || THEME.primary}` : '3px solid transparent',
                        background: selectedCatKey === cat.key ? `${THEME.primary}10` : 'transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (selectedCatKey !== cat.key) e.currentTarget.style.background = THEME.surfaceHover; }}
                      onMouseLeave={e => { if (selectedCatKey !== cat.key) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ cursor: 'grab', color: THEME.textDim, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <GripVertical size={14} />
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color || THEME.primary, flexShrink: 0 }} />
                        <span style={{
                          flex: 1, fontSize: 13, fontWeight: selectedCatKey === cat.key ? 600 : 400,
                          color: selectedCatKey === cat.key ? THEME.text : THEME.textMuted,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {cat.label?.[locale as 'en' | 'ka' | 'ru'] || cat.label?.en || cat.key}
                        </span>
                        <span style={{ fontSize: 10, color: THEME.textDim, flexShrink: 0 }}>{cat.subcategories.length}</span>
                        {cat.isActive === false && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${THEME.error}20`, color: THEME.error, flexShrink: 0 }}>
                            {t('admin.inactive')}
                          </span>
                        )}
                        {cat.isActive !== false && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${THEME.success}20`, color: THEME.success, flexShrink: 0 }}>
                            {t('admin.active')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>

          {/* Add category button / form */}
          {addingCategory ? (
            <AddCategoryForm
              onDone={() => { setAddingCategory(false); loadCatalog(); }}
              onCancel={() => setAddingCategory(false)}
              t={t}
            />
          ) : (
            <div style={{ padding: 12, borderTop: `1px solid ${THEME.border}` }}>
              <button
                onClick={() => setAddingCategory(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', borderRadius: 7, border: `1px dashed ${THEME.primary}60`,
                  background: `${THEME.primary}08`, color: THEME.primary, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                <Plus size={14} />
                {t('admin.addCategory')}
              </button>
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedCategory ? (
            <CategoryDetail
              key={selectedCategory.key}
              category={selectedCategory}
              onReload={loadCatalog}
              onDelete={() => handleDelete(selectedCategory.key)}
              t={t}
              locale={locale}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${THEME.primary}15` }}>
                <Layers size={40} color={THEME.primary} style={{ opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>{t('admin.selectCategory')}</p>
                <p style={{ fontSize: 13, color: THEME.textMuted }}>{t('admin.serviceCatalogDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export with AuthGuard ────────────────────────────────────────────────────

export default function ServiceCatalogPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <ServiceCatalogPageContent />
    </AuthGuard>
  );
}
