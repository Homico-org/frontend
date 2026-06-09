'use client';

import BackButton from '@/components/common/BackButton';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import AddSpaceModal, { SpaceInput } from '@/components/projects/AddSpaceModal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Boxes, Pencil, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Draft autosaved here so a refresh doesn't lose an in-progress project.
const PROJECT_DRAFT_KEY = 'homico:project-draft';

// A project has no required "type" - it's a renovation umbrella. We still
// send a category to the backend (it's a required field) but it's not a
// user choice; everything else (spaces, steps, services, team) is built on
// the project page after creation.
const DEFAULT_CATEGORY = 'full_renovation';

interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

// Mono-caps eyebrow that opens a section on the single-page form.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-muted)]">
      {children}
    </p>
  );
}

export default function StartProjectPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { error: toastError } = useToast();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number } | undefined
  >();
  const [budget, setBudget] = useState('');
  const [cadastralId, setCadastralId] = useState('');
  const [landArea, setLandArea] = useState('');
  const [floorCount, setFloorCount] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [showSite, setShowSite] = useState(false);
  const [spaces, setSpaces] = useState<(SpaceInput & { id: string })[]>([]);
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<
    (SpaceInput & { id: string }) | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/projects/new');
    }
  }, [user, authLoading, router]);

  // Note: we deliberately do NOT pre-fill location from user.city - doing so
  // re-populated the field every time it was cleared, so the address couldn't
  // be emptied. The user types or picks the location themselves.

  // ── Draft autosave / resume ──
  const hydratedRef = useRef(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECT_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (d.projectName) setProjectName(d.projectName);
          if (d.description) setDescription(d.description);
          if (d.location) setLocation(d.location);
          if (d.coordinates) setCoordinates(d.coordinates);
          if (d.budget) setBudget(d.budget);
          if (d.cadastralId) setCadastralId(d.cadastralId);
          if (d.landArea) setLandArea(d.landArea);
          if (d.floorCount) setFloorCount(d.floorCount);
          if (d.cadastralId || d.landArea || d.floorCount) setShowSite(true);
          if (Array.isArray(d.media) && d.media.length) setMedia(d.media);
          if (d.projectName || d.location) setDraftRestored(true);
        }
      }
    } catch {
      /* ignore malformed draft */
    }
    hydratedRef.current = true;
  }, []);

  const clearDraft = () => {
    try {
      localStorage.removeItem(PROJECT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        PROJECT_DRAFT_KEY,
        JSON.stringify({
          projectName,
          description,
          location,
          coordinates,
          budget,
          cadastralId,
          landArea,
          floorCount,
          media,
        }),
      );
    } catch {
      /* quota / private mode - non-fatal */
    }
  }, [
    projectName,
    description,
    location,
    coordinates,
    budget,
    cadastralId,
    landArea,
    floorCount,
    media,
  ]);

  const startOver = () => {
    clearDraft();
    setProjectName('');
    setDescription('');
    setLocation('');
    setCoordinates(undefined);
    setBudget('');
    setCadastralId('');
    setLandArea('');
    setFloorCount('');
    setMedia([]);
    setShowSite(false);
    setSpaces([]);
    setSpaceModalOpen(false);
    setEditingSpace(null);
    setDraftRestored(false);
  };

  // Stable id that won't collide after a space is removed and another added.
  const genId = (prev: { id: string }[]) => {
    const max = prev.reduce((m, s) => {
      const n = parseInt(s.id.replace(/\D/g, ''), 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `RM${max + 1}`;
  };

  // Quick presets add by name only; duplicates are ignored.
  const addSpace = (sp: SpaceInput) => {
    const n = sp.name.trim();
    if (!n) return;
    setSpaces((prev) =>
      prev.some((s) => s.name.toLowerCase() === n.toLowerCase())
        ? prev
        : [...prev, { ...sp, id: genId(prev), name: n }],
    );
  };

  // The modal returns a fully-detailed space - either new or an edit (has id).
  const upsertSpace = (sp?: SpaceInput) => {
    if (!sp) return;
    const n = sp.name.trim();
    if (!n) return;
    setSpaces((prev) => {
      if (sp.id && prev.some((s) => s.id === sp.id)) {
        return prev.map((s) =>
          s.id === sp.id ? { ...s, ...sp, id: s.id, name: n } : s,
        );
      }
      if (prev.some((s) => s.name.toLowerCase() === n.toLowerCase())) {
        return prev;
      }
      return [...prev, { ...sp, id: genId(prev), name: n }];
    });
  };

  const removeSpace = (id: string) =>
    setSpaces((prev) => prev.filter((s) => s.id !== id));

  const openAddSpace = () => {
    setEditingSpace(null);
    setSpaceModalOpen(true);
  };
  const openEditSpace = (s: SpaceInput & { id: string }) => {
    setEditingSpace(s);
    setSpaceModalOpen(true);
  };
  const closeSpaceModal = () => {
    setSpaceModalOpen(false);
    setEditingSpace(null);
  };

  // m² shown when an area is set or derivable from length x width.
  const spaceMeta = (s: SpaceInput) => {
    const parts: string[] = [];
    const area =
      s.area ??
      (s.length && s.width
        ? Math.round(s.length * s.width * 100) / 100
        : undefined);
    if (area) parts.push(`${area} m²`);
    if (s.budget) {
      parts.push(
        `${Math.round(s.budget).toLocaleString('en-US').replace(/,/g, ' ')} ₾`,
      );
    }
    return parts.join(' · ');
  };

  const presets = [
    t('projects.spaceKitchen'),
    t('projects.spaceBathroom'),
    t('projects.spaceBedroom'),
    t('projects.spaceLiving'),
    t('projects.spaceBalcony'),
    t('projects.spaceHall'),
  ].filter(
    (s) => !spaces.some((x) => x.name.toLowerCase() === s.toLowerCase()),
  );

  const canCreate =
    projectName.trim().length > 2 && location !== '' && spaces.length > 0;

  const handleSubmit = async () => {
    if (!canCreate) return;
    setIsSubmitting(true);
    try {
      // 1. Upload media in parallel -> collect URLs.
      const photos: string[] = [];
      if (media.length > 0) {
        const uploaded = await Promise.all(
          media.map(async (item) => {
            const fd = new FormData();
            fd.append('file', item.file);
            const res = await api.post('/upload', fd);
            return (res.data.url || res.data.filename) as string;
          }),
        );
        photos.push(...uploaded);
      }

      const budgetMax = budget ? Number(budget) : undefined;

      // 2. Create the project. Team / spaces / steps / services are added on
      //    the project page afterward.
      const res = await api.post('/projects', {
        category: DEFAULT_CATEGORY,
        title: projectName.trim(),
        description: description || projectName.trim(),
        location,
        address: location,
        budgetMax: Number.isFinite(budgetMax) ? budgetMax : undefined,
        currency: 'GEL',
        photos,
        coverImage: photos[0],
        rooms: spaces.map((s, i) => ({
          id: s.id || `RM${i + 1}`,
          name: s.name,
          length: s.length,
          width: s.width,
          height: s.height,
          area: s.area,
          budget: s.budget,
          note: s.note,
        })),
        cadastralId: cadastralId || undefined,
        landArea: landArea ? Number(landArea) : undefined,
        floorCount: floorCount ? Number(floorCount) : undefined,
      });

      const projectId = res.data?._id || res.data?.id;
      if (projectId) {
        clearDraft();
        router.push(`/projects/${projectId}`);
        return;
      }
      toastError(t('projects.createError'));
    } catch (error) {
      console.error('Failed to create project:', error);
      toastError(t('projects.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-28">
      <div className="mx-auto w-full max-w-[560px] px-4 pt-3 sm:px-6">
        <BackButton
          variant="minimal"
          label={t('common.back')}
          fallbackHref="/projects"
          className="mb-5"
        />

        <header className="mb-7">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--hm-fg-muted)]">
            {t('projects.startTitle')}
          </p>
          <h1 className="font-display text-[26px] font-bold italic leading-[1.05] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[34px]">
            {t('projects.newProject')}
          </h1>
        </header>

        {draftRestored && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-3">
            <p className="text-[13px] text-[var(--hm-fg-secondary)]">
              {t('projects.draftRestored')}
            </p>
            <button
              type="button"
              onClick={startOver}
              className="shrink-0 text-[13px] font-semibold text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
            >
              {t('projects.startFresh')}
            </button>
          </div>
        )}

        <section className="space-y-6">
          <SectionLabel>{t('projects.detailsTitle')}</SectionLabel>

          <FormGroup>
            <Label>{t('projects.nameLabel')}</Label>
            <Input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('projects.namePlaceholder')}
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('common.location')}</Label>
            <LocationPicker
              value={location}
              onChange={(address, coords) => {
                setLocation(address);
                setCoordinates(coords);
              }}
              placeholder={t('projects.locationPlaceholder')}
            />
          </FormGroup>

          <FormGroup>
            <Label>
              {t('projects.budgetLabel')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <Input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) >= 0) setBudget(value);
              }}
              placeholder="0"
              leftIcon={<span className="text-[var(--hm-fg-muted)]">₾</span>}
            />
          </FormGroup>

          <FormGroup>
            <Label>
              {t('common.description')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('projects.descriptionPlaceholder')}
              rows={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>
              {t('common.photos')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <MediaUpload
              value={media}
              onChange={setMedia}
              maxFiles={10}
              maxSizeMB={50}
            />
          </FormGroup>

          {/* Site details - collapsed by default; for whole-home / new-build. */}
          {showSite ? (
            <div className="rounded-2xl border border-[var(--hm-border-subtle)] p-4">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
                {t('projects.siteDetails')} · {t('common.optional')}
              </p>
              <div className="space-y-4">
                <FormGroup>
                  <Label>{t('projects.cadastralLabel')}</Label>
                  <Input
                    type="text"
                    value={cadastralId}
                    onChange={(e) => setCadastralId(e.target.value)}
                    placeholder="01.10.01.001.001"
                  />
                </FormGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FormGroup>
                    <Label>{t('projects.landAreaLabel')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="0"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>{t('projects.floorCountLabel')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={floorCount}
                      onChange={(e) => setFloorCount(e.target.value)}
                      placeholder="0"
                    />
                  </FormGroup>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSite(true)}
              className="text-[13px] font-medium text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
            >
              + {t('projects.siteDetails')}
            </button>
          )}
        </section>
        <section className="mt-9 space-y-4 border-t border-[var(--hm-border-subtle)] pt-8">
          <div className="flex items-baseline justify-between">
            <SectionLabel>{t('projects.spacesTitle')}</SectionLabel>
            {spaces.length > 0 && (
              <span className="font-mono text-[10px] tabular-nums tracking-[0.14em] text-[var(--hm-brand-500)]">
                {String(spaces.length).padStart(2, '0')}
              </span>
            )}
          </div>
          <p className="-mt-2 max-w-[44ch] text-[13px] leading-relaxed text-[var(--hm-fg-muted)]">
            {t('projects.spacesHint')}
          </p>

          {/* Empty state - illustration + guidance until the first space */}
          {spaces.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--hm-border-strong)] px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
                <Boxes className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <p className="max-w-[34ch] text-[13px] leading-relaxed text-[var(--hm-fg-muted)]">
                {t('projects.spacesEmpty')}
              </p>
              <Button
                size="sm"
                onClick={openAddSpace}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {t('projects.roomAdd')}
              </Button>
            </div>
          )}

          {/* Space cards + the add tile sharing one grid */}
          {spaces.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {spaces.map((s, i) => {
              const meta = spaceMeta(s);
              return (
                <div
                  key={s.id}
                  className="group flex items-center gap-3.5 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-3 transition-colors hover:border-[var(--hm-brand-500)]/40"
                >
                  <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-[var(--hm-fg-subtle)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditSpace(s)}
                    className="flex min-w-0 flex-1 flex-col text-left"
                  >
                    <span className="truncate text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                      {s.name}
                    </span>
                    <span
                      className={`truncate text-[12px] ${
                        meta
                          ? 'text-[var(--hm-fg-muted)]'
                          : 'text-[var(--hm-fg-subtle)]'
                      }`}
                    >
                      {meta || t('projects.spaceTapToDetail')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditSpace(s)}
                    aria-label={t('common.edit')}
                    className="hidden shrink-0 rounded-lg p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-brand-500)] group-hover:block"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSpace(s.id)}
                    aria-label={t('common.delete')}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-error-500)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={openAddSpace}
              className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--hm-border-strong)] px-4 py-3 text-[14px] font-medium text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/[0.04] hover:text-[var(--hm-brand-500)]"
            >
              <Plus className="h-4 w-4" />
              {t('projects.roomAdd')}
            </button>
          </div>
          )}

          {/* One-tap presets for the common rooms not yet added */}
          {presets.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
                {t('projects.spacesQuickAdd')}
              </p>
              <div className="flex flex-wrap gap-2">
                {presets.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSpace({ name: s })}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--hm-border-subtle)] px-3 py-1.5 text-[13px] text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/[0.04] hover:text-[var(--hm-brand-500)]"
                  >
                    <Plus className="h-3 w-3" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add / edit space modal - rendered at the page root (portals to body) */}
      {spaceModalOpen && (
        <AddSpaceModal
          isOpen={spaceModalOpen}
          onClose={closeSpaceModal}
          item={editingSpace ?? undefined}
          onSaved={(space) => {
            upsertSpace(space);
            closeSpaceModal();
          }}
        />
      )}

      {/* Sticky action footer */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hm-border-subtle)]"
        style={{ backgroundColor: 'var(--hm-bg-elevated)' }}
      >
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-[12px] text-[var(--hm-fg-muted)]">
            {!canCreate ? t('projects.createNeeds') : location}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!canCreate || isSubmitting}
            loading={isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? t('projects.creating') : t('projects.createCta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
