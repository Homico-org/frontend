'use client';

import BackButton from '@/components/common/BackButton';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';

// Slugify free text into a stable custom-role key.
const roleSlug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
import {
  Bath,
  BedDouble,
  Briefcase,
  Building2,
  CookingPot,
  Hammer,
  Plus,
  Search,
  Sofa,
  Trees,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

// Wizard draft is autosaved here so a refresh / accidental navigation
// doesn't lose an in-progress project. Cleared on successful create.
const PROJECT_DRAFT_KEY = 'homico:project-draft';

// A picked role: stable `key` (canonical or custom slug) + English `label`
// (used as the cross-locale fallback / stored roleLabel). Display localizes
// via roleDisplay.
interface TeamRole {
  key: string;
  label: string;
}

interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

const projectTypes: { key: string; icon: typeof Hammer }[] = [
  { key: 'full_renovation', icon: Hammer },
  { key: 'kitchen', icon: CookingPot },
  { key: 'bathroom', icon: Bath },
  { key: 'bedroom', icon: BedDouble },
  { key: 'living_room', icon: Sofa },
  { key: 'office', icon: Briefcase },
  { key: 'outdoor', icon: Trees },
  { key: 'new_build', icon: Building2 },
];

const steps = [
  { id: 1, titleKey: 'projects.stepType' },
  { id: 2, titleKey: 'projects.stepDetails' },
  { id: 3, titleKey: 'projects.stepTeam' },
];

export default function StartProjectPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const { error: toastError } = useToast();

  // Roles come from the Service Catalog categories (single source of truth) -
  // each trade a client can need is a real category, not a hardcoded list.
  const catByKey = useMemo(() => {
    const m = new Map<string, { name: string; nameKa: string }>();
    for (const c of categories) m.set(c.key, { name: c.name, nameKa: c.nameKa });
    return m;
  }, [categories]);

  const roleLabelOf = (key: string, fallback?: string): string => {
    const c = catByKey.get(key);
    return c ? pick({ en: c.name, ka: c.nameKa }) : fallback || key;
  };

  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [budget, setBudget] = useState('');
  const [cadastralId, setCadastralId] = useState('');
  const [landArea, setLandArea] = useState('');
  const [floorCount, setFloorCount] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);

  // Site-info fields only make sense for whole-home / new-build scope.
  const showSiteInfo =
    projectType === 'new_build' || projectType === 'full_renovation';
  const [team, setTeam] = useState<TeamRole[]>([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/projects/new');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.city && !location) {
      setLocation(user.city);
    }
  }, [user, location]);

  // ── Draft autosave / resume ──
  // `hydrated` gates autosave until the one-time restore has run, so the
  // initial empty render never clobbers a saved draft.
  const hydratedRef = useRef(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECT_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (d.step) setStep(d.step);
          if (d.projectType) setProjectType(d.projectType);
          if (d.projectName) setProjectName(d.projectName);
          if (d.description) setDescription(d.description);
          if (d.location) setLocation(d.location);
          if (d.coordinates) setCoordinates(d.coordinates);
          if (d.budget) setBudget(d.budget);
          if (d.cadastralId) setCadastralId(d.cadastralId);
          if (d.landArea) setLandArea(d.landArea);
          if (d.floorCount) setFloorCount(d.floorCount);
          if (Array.isArray(d.media) && d.media.length) setMedia(d.media);
          if (Array.isArray(d.team) && d.team.length) setTeam(d.team);
          if (
            d.projectName ||
            d.projectType ||
            d.location ||
            (Array.isArray(d.media) && d.media.length) ||
            (Array.isArray(d.team) && d.team.length)
          ) {
            setDraftRestored(true);
          }
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
          step,
          projectType,
          projectName,
          description,
          location,
          coordinates,
          budget,
          cadastralId,
          landArea,
          floorCount,
          media,
          team,
        }),
      );
    } catch {
      /* quota / private mode - non-fatal */
    }
  }, [
    step,
    projectType,
    projectName,
    description,
    location,
    coordinates,
    budget,
    cadastralId,
    landArea,
    floorCount,
    media,
    team,
  ]);

  const startOver = () => {
    clearDraft();
    setStep(1);
    setProjectType('');
    setProjectName('');
    setDescription('');
    setLocation('');
    setCoordinates(undefined);
    setBudget('');
    setCadastralId('');
    setLandArea('');
    setFloorCount('');
    setMedia([]);
    setTeam([]);
    setDraftRestored(false);
  };

  // Available roles = catalog categories not already on the team, filtered
  // by the search box (matched against the localized label).
  const filteredRoles = categories.filter(
    (c) =>
      !team.find((r) => r.key === c.key) &&
      (!roleSearch ||
        pick({ en: c.name, ka: c.nameKa })
          .toLowerCase()
          .includes(roleSearch.toLowerCase())),
  );

  const addRoleKey = (key: string, label: string) => {
    if (!team.find((r) => r.key === key)) {
      setTeam([...team, { key, label }]);
    }
    setRoleSearch('');
  };

  const addCustomRole = (text: string) => {
    const key = roleSlug(text);
    if (key) addRoleKey(key, text.trim());
  };

  const removeRole = (key: string) => {
    setTeam(team.filter((r) => r.key !== key));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload media in parallel -> collect URLs (same pattern as post-job).
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

      // 2. Each picked role becomes an open engagement (pros quote on it
      //    later; client can switch a role to invite-mode in the dashboard).
      const engagements = team.map((role, i) => ({
        id: `E${i + 1}`,
        roleKey: role.key,
        roleLabel: role.label,
        mode: 'open' as const,
      }));

      const budgetMax = budget ? Number(budget) : undefined;

      // 3. Create the project.
      const res = await api.post('/projects', {
        category: projectType,
        title: projectName,
        description: description || projectName,
        location,
        address: location,
        budgetMax: Number.isFinite(budgetMax) ? budgetMax : undefined,
        currency: 'GEL',
        photos,
        coverImage: photos[0],
        engagements,
        cadastralId: showSiteInfo && cadastralId ? cadastralId : undefined,
        landArea: showSiteInfo && landArea ? Number(landArea) : undefined,
        floorCount: showSiteInfo && floorCount ? Number(floorCount) : undefined,
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

  const canGoNext = () => {
    if (step === 1) return projectType !== '';
    if (step === 2) return projectName.length > 2 && location !== '';
    if (step === 3) return true;
    return false;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  const summaryRows: { label: string; value: string; step: number }[] = [
    {
      label: t('projects.reviewType'),
      value: projectType ? t(`projects.types.${projectType}`) : '',
      step: 1,
    },
    { label: t('projects.nameLabel'), value: projectName, step: 2 },
    { label: t('common.location'), value: location, step: 2 },
    ...(budget
      ? [
          {
            label: t('projects.budgetLabel'),
            value: `${Number(budget).toLocaleString('en-US').replace(/,/g, ' ')} ₾`,
            step: 2,
          },
        ]
      : []),
    ...(showSiteInfo && (cadastralId || landArea || floorCount)
      ? [
          {
            label: t('projects.siteDetails'),
            value: [
              cadastralId,
              landArea ? `${landArea} მ²` : '',
              floorCount ? `${floorCount}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
            step: 2,
          },
        ]
      : []),
    ...(media.length > 0
      ? [{ label: t('common.photos'), value: String(media.length), step: 2 }]
      : []),
  ];

  return (
    <div className="py-2">
      <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <BackButton variant="minimal" label={t('common.back')} className="mb-4" />
            <h1 className="text-2xl font-bold text-[var(--hm-fg-primary)]">{t('projects.startTitle')}</h1>
            <p className="text-[var(--hm-fg-muted)] mt-1">{t('projects.startSubtitle')}</p>
          </div>

          {/* Restored-draft notice */}
          {draftRestored && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-3">
              <p className="text-[13px] text-[var(--hm-fg-secondary)]">
                {t('projects.draftRestored')}
              </p>
              <button
                type="button"
                onClick={startOver}
                className="shrink-0 text-[13px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80 transition-opacity"
              >
                {t('projects.startFresh')}
              </button>
            </div>
          )}

          {/* Stepper */}
          <div className="mb-8">
            <Stepper
              steps={steps.map(s => ({ key: String(s.id), label: t(s.titleKey) }))}
              currentIndex={step - 1}
            />
          </div>

          {/* Content */}
          <Card variant="elevated" className="p-6">
            {/* Step 1: Project Type */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">{t('projects.q1Title')}</h2>
                <p className="text-sm text-[var(--hm-fg-muted)] mb-4">{t('projects.q1Subtitle')}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    const active = projectType === type.key;
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setProjectType(type.key)}
                        className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 ${
                          active
                            ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.06]'
                            : 'border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] hover:border-[var(--hm-brand-500)]/40'
                        }`}
                      >
                        <span
                          className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 group-hover:scale-105"
                          style={{
                            backgroundColor: active
                              ? 'var(--hm-brand-500)'
                              : 'var(--hm-bg-tertiary)',
                            color: active ? '#fff' : 'var(--hm-brand-500)',
                          }}
                        >
                          <Icon className="w-5 h-5" strokeWidth={1.75} />
                        </span>
                        <span
                          className={`text-[13px] font-semibold leading-tight ${
                            active
                              ? 'text-[var(--hm-brand-500)]'
                              : 'text-[var(--hm-fg-primary)]'
                          }`}
                        >
                          {t(`projects.types.${type.key}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">{t('projects.detailsTitle')}</h2>
                  <p className="text-sm text-[var(--hm-fg-muted)] mb-4">{t('projects.detailsSubtitle')}</p>
                </div>

                {/* Project Name */}
                <FormGroup>
                  <Label>{t('projects.nameLabel')}</Label>
                  <Input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={t('projects.namePlaceholder')}
                  />
                </FormGroup>

                {/* Description */}
                <FormGroup>
                  <Label>{t('common.description')} <span className="text-[var(--hm-fg-muted)] font-normal">({t('common.optional')})</span></Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('projects.descriptionPlaceholder')}
                    rows={3}
                  />
                </FormGroup>

                {/* Location */}
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

                {/* Budget */}
                <FormGroup>
                  <Label>{t('projects.budgetLabel')} <span className="text-[var(--hm-fg-muted)] font-normal">({t('common.optional')})</span></Label>
                  <Input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setBudget(value);
                      }
                    }}
                    placeholder="0"
                    leftIcon={<span className="text-[var(--hm-fg-muted)]">$</span>}
                  />
                </FormGroup>

                {/* Media Upload */}
                <FormGroup>
                  <Label>{t('common.photos')} <span className="text-[var(--hm-fg-muted)] font-normal">({t('common.optional')})</span></Label>
                  <MediaUpload
                    value={media}
                    onChange={setMedia}
                    maxFiles={10}
                    maxSizeMB={50}
                  />
                </FormGroup>

                {/* Site details - only for whole-home / new-build scope */}
                {showSiteInfo && (
                  <div className="rounded-xl border border-[var(--hm-border-subtle)] p-4">
                    <p className="text-[13px] font-semibold text-[var(--hm-fg-primary)] mb-3">
                      {t('projects.siteDetails')}{' '}
                      <span className="text-[var(--hm-fg-muted)] font-normal">
                        ({t('common.optional')})
                      </span>
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
                )}
              </div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <div>
                {/* Review summary */}
                <div className="mb-6 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] p-4">
                  <h3 className="text-[13px] font-semibold text-[var(--hm-fg-primary)] mb-2">
                    {t('projects.reviewTitle')}
                  </h3>
                  <dl className="divide-y divide-[var(--hm-border-subtle)]">
                    {summaryRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <dt className="shrink-0 text-[13px] text-[var(--hm-fg-muted)]">
                          {row.label}
                        </dt>
                        <dd className="flex min-w-0 items-center gap-2 text-right">
                          <span className="truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                            {row.value || '-'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(row.step)}
                            className="shrink-0 text-xs font-semibold text-[var(--hm-brand-500)] hover:opacity-80 transition-opacity"
                          >
                            {t('common.edit')}
                          </button>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">{t('projects.teamTitle')}</h2>
                <p className="text-sm text-[var(--hm-fg-muted)] mb-4">
                  {t('projects.teamSubtitle')}
                </p>

                {/* Selected Team */}
                {team.length > 0 && (
                  <div className="mb-4 p-3 bg-[var(--hm-bg-page)] rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {team.map((role) => (
                        <Badge
                          key={role.key}
                          variant="secondary"
                          size="default"
                          onClick={() => removeRole(role.key)}
                          className="cursor-pointer hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)] hover:border-[var(--hm-error-500)]/20 transition-colors"
                        >
                          {roleLabelOf(role.key, role.label)}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search & Add */}
                <div className="mb-3">
                  <Input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder={t('projects.searchRoles')}
                    leftIcon={<Search className="w-5 h-5" />}
                  />
                </div>

                {/* Available Roles */}
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                  {filteredRoles.map((c) => (
                    <Badge
                      key={c.key}
                      variant="secondary"
                      size="default"
                      onClick={() => addRoleKey(c.key, c.name)}
                      className="cursor-pointer hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    >
                      {pick({ en: c.name, ka: c.nameKa })}
                      <Plus className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                {filteredRoles.length === 0 && roleSearch && (
                  <Button
                    variant="link"
                    onClick={() => addCustomRole(roleSearch)}
                    className="mt-2"
                  >
                    {t('projects.addCustomRole', { role: roleSearch })}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                {t('common.back')}
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
              >
                {t('common.continue')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting
                  ? t('projects.creating')
                  : team.length > 0
                    ? t('projects.createCtaWithRoles', { count: team.length })
                    : t('projects.createCta')}
              </Button>
            )}
          </div>
        </div>
    </div>
  );
}
