'use client';

import InviteProModal from '@/components/projects/InviteProModal';
import ProjectDocuments, {
  ProjectDoc,
} from '@/components/projects/ProjectDocuments';
import ProjectDecisions, {
  ProjectDecision,
} from '@/components/projects/ProjectDecisions';
import ProjectShopping, {
  ProjectProduct,
} from '@/components/projects/ProjectShopping';
import ProjectSelections, {
  Selection,
} from '@/components/projects/ProjectSelections';
import ProjectRooms, { Room } from '@/components/projects/ProjectRooms';
import { ScopeItem } from '@/components/projects/ProjectScope';
import { TableCard, Pill } from '@/components/projects/TableCard';
import AddRoleModal from '@/components/projects/AddRoleModal';
import AddMilestoneModal from '@/components/projects/AddMilestoneModal';
import AddServiceModal from '@/components/projects/AddServiceModal';
import ImageLightbox from '@/components/common/ImageLightbox';
import EditProjectModal from '@/components/projects/EditProjectModal';
import EditRoleModal from '@/components/projects/EditRoleModal';
import EditStepModal from '@/components/projects/EditStepModal';
import { ConfirmModal } from '@/components/ui/Modal';
import BookingModal from '@/components/professionals/BookingModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useCountryLink } from '@/hooks/useCountry';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  ArrowRight,
  CalendarPlus,
  Check,
  FileText,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  UserCircle,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type EngagementStatus =
  | 'draft'
  | 'invited'
  | 'open'
  | 'hired'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Engagement {
  id: string;
  roleKey: string;
  roleLabel: string;
  scope?: string;
  budget?: number;
  mode: 'invite' | 'open';
  status: EngagementStatus;
  assignedProId?:
    | {
        id?: string;
        _id?: string;
        name?: string;
        avatar?: string;
        phone?: string;
        title?: string;
        yearsExperience?: number;
        basePrice?: number;
        maxPrice?: number;
        currency?: string;
        avgRating?: number;
        totalReviews?: number;
        verificationStatus?: string;
      }
    | string;
  jobId?: string;
  proposalId?: string;
  projectTrackingId?: string;
  bookingId?: string;
  phase?: string;
  stepId?: string;
  designApproval?: {
    phase?: 'concept' | 'schematic' | 'detailed' | 'construction';
    status: 'none' | 'pending' | 'approved' | 'changes_requested';
    note?: string;
  };
  // Enriched by the /dashboard endpoint from the per-worker workspace.
  stage?: string;
  workspaceProgress?: number;
}

interface ProjectStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
}

// Renovation phases, in timeline order.
const PROJECT_PHASES: { key: string; labelKey: string }[] = [
  { key: 'design', labelKey: 'projects.phaseDesign' },
  { key: 'permits', labelKey: 'projects.phasePermits' },
  { key: 'construction', labelKey: 'projects.phaseConstruction' },
  { key: 'finishing', labelKey: 'projects.phaseFinishing' },
];

const PHASE_KEYS = ['design', 'permits', 'construction', 'finishing'];
// Bucket an engagement into a phase. Anything missing or with an unexpected
// value falls back to construction, so every role is always counted somewhere.
const phaseKeyOf = (e: { phase?: string }): string =>
  e.phase && PHASE_KEYS.includes(e.phase) ? e.phase : 'construction';

interface ActivityItem {
  engagementId: string;
  roleLabel: string;
  eventType?: string;
  userName?: string;
  userRole?: string;
  metadata?: { description?: string; toStage?: string; fileName?: string };
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'active' | 'done' | 'blocked';
  sortOrder: number;
  phase?: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  photos?: string[];
  coverImage?: string;
  progress: number;
  status: string;
  engagements: Engagement[];
  steps?: ProjectStep[];
  milestones: Milestone[];
  activity?: ActivityItem[];
  documents?: ProjectDoc[];
  decisions?: ProjectDecision[];
  products?: ProjectProduct[];
  selections?: Selection[];
  rooms?: Room[];
  scopeItems?: ScopeItem[];
  phases?: { key: string; progress: number; roleCount: number }[];
  currentPhase?: string;
  budget?: { planned: number; committed: number };
  procurement?: {
    total: number;
    toBuy: number;
    ordered: number;
    delivered: number;
    count: number;
  };
  viewerRole?: 'client' | 'pro';
  cadastralId?: string;
  landArea?: number;
  floorCount?: number;
  propertyType?: string;
}

type TFn = (key: string, params?: Record<string, string | number>) => string;

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger';

const ENGAGEMENT_BADGE: Record<
  EngagementStatus,
  { labelKey: string; variant: BadgeVariant }
> = {
  draft: { labelKey: 'projects.statusDraft', variant: 'secondary' },
  invited: { labelKey: 'projects.statusInvited', variant: 'info' },
  open: { labelKey: 'projects.statusOpen', variant: 'warning' },
  hired: { labelKey: 'projects.statusHired', variant: 'success' },
  in_progress: { labelKey: 'projects.statusInProgress', variant: 'info' },
  completed: { labelKey: 'projects.statusCompleted', variant: 'success' },
  cancelled: { labelKey: 'projects.statusCancelled', variant: 'secondary' },
};

function describeActivity(ev: ActivityItem, t: TFn): string {
  switch (ev.eventType) {
    case 'stage_changed':
      return t('projects.actMovedTo', {
        stage: ev.metadata?.toStage?.replace(/_/g, ' ') || '',
      });
    case 'message_sent':
      return t('projects.actSentMessage');
    case 'attachment_added':
      return t('projects.actAddedFile');
    case 'project_created':
      return t('projects.actStartedWorkspace');
    case 'project_completed':
      return t('projects.actCompletedWork');
    case 'price_updated':
      return t('projects.actUpdatedPrice');
    case 'deadline_updated':
      return t('projects.actUpdatedDeadline');
    default:
      return ev.metadata?.description || t('projects.actMadeUpdate');
  }
}

// Lari amount with a space thousand-separator (Georgian style: "8 000 ₾").
function formatGel(n: number | undefined): string {
  return `${Math.round(n || 0)
    .toLocaleString('en-US')
    .replace(/,/g, ' ')} ₾`;
}

function relativeTime(iso: string, t: TFn): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('projects.justNow');
  if (mins < 60) return t('projects.minsAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('projects.hoursAgo', { n: hrs });
  const days = Math.floor(hrs / 24);
  return t('projects.daysAgo', { n: days });
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?|$)/i;
function looksLikeImage(url?: string, fileType?: string): boolean {
  if (!url) return false;
  if (fileType?.startsWith('image/')) return true;
  return IMAGE_EXT.test(url) || url.startsWith('data:image');
}

function collectProjectImages(project: Project): string[] {
  const urls = [
    ...(project.photos ?? []),
    ...(project.coverImage ? [project.coverImage] : []),
    ...(project.documents ?? [])
      .filter((d) => looksLikeImage(d.url, d.fileType))
      .map((d) => d.url),
    ...(project.products ?? [])
      .map((p) => p.imageUrl)
      .filter((u): u is string => !!u),
  ];
  return Array.from(new Set(urls.filter(Boolean)));
}

// Top-level tabs after the 2026 "back to simple" pass: four standard surfaces.
const TOP_TABS = ['overview', 'plan', 'rooms', 'library'] as const;

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cl = useCountryLink();
  const toast = useToast();
  const { t, pick, locale } = useLanguage();
  const { categories } = useCategories();
  const { user } = useAuth();

  // Localized role display: engagement.roleKey is a catalog category key
  // (or a custom slug). Resolution order: catalog -> i18n bundle -> stored
  // label -> raw key.
  const roleLabelOf = useCallback(
    (key: string, fallback?: string): string => {
      const c = categories.find((cat) => cat.key === key);
      if (c) return pick({ en: c.name, ka: c.nameKa });
      const i18nLabel = t(`projects.roles.${key}`);
      if (i18nLabel && i18nLabel !== `projects.roles.${key}`) {
        return i18nLabel;
      }
      return fallback || key;
    },
    [categories, pick, t],
  );

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyEngagementId, setBusyEngagementId] = useState<string | null>(null);
  // Pro picker: 'invite' fires the invite API, 'book' opens the booking modal.
  const [picker, setPicker] = useState<{
    eng: Engagement;
    purpose: 'invite' | 'book';
  } | null>(null);
  const [booking, setBooking] = useState<{
    pro: { id: string; name: string };
    engagementId: string;
  } | null>(null);

  const [showAddRole, setShowAddRole] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editRoleEng, setEditRoleEng] = useState<Engagement | null>(null);
  const [editMs, setEditMs] = useState<Milestone | null>(null);
  const [editStep, setEditStep] = useState<
    { mode: 'create' } | { mode: 'edit'; step: ProjectStep } | null
  >(null);
  const [removeStep, setRemoveStep] = useState<{ id: string; name: string } | null>(null);
  // Add/edit a service (scope item) under a step. stepId omitted = unassigned.
  const [serviceModal, setServiceModal] = useState<{
    stepId?: string;
    item?: ScopeItem;
  } | null>(null);
  const [removeServiceId, setRemoveServiceId] = useState<string | null>(null);
  // Add a person (role/engagement) under a step. undefined stepId = unassigned.
  const [addPersonStepId, setAddPersonStepId] = useState<string | null>(null);
  // Upload a document into a step: holds the target stepId while the file
  // dialog is open (or '' for an unassigned doc).
  const stepDocInputRef = useRef<HTMLInputElement>(null);
  const [docUploadStepId, setDocUploadStepId] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    kind: 'role' | 'milestone';
    id: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  // Full-screen image viewer: holds the image set + the index to open at.
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const openLightbox = (images: string[], index = 0) => {
    if (images.length > 0) setLightbox({ images, index });
  };

  // Deep-linkable tabs. Legacy subsystem deep-links remap to the standard
  // surface that absorbed them so notification emails and old bookmarks land
  // somewhere sensible.
  const [activeTab, setActiveTab] = useState<string>(() => {
    const tp = searchParams.get('tab');
    const legacyMap: Record<string, string> = {
      timeline: 'overview',
      team: 'plan',
      scope: 'plan',
      materials: 'rooms',
      selections: 'rooms',
      shopping: 'rooms',
      renders: 'library',
      documents: 'library',
      decisions: 'library',
    };
    if (tp && (TOP_TABS as readonly string[]).includes(tp)) return tp;
    if (tp && legacyMap[tp]) return legacyMap[tp];
    return 'overview';
  });

  useEffect(() => {
    const current = searchParams.get('tab') || 'overview';
    if (current === activeTab) return;
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    if (activeTab === 'overview') sp.delete('tab');
    else sp.set('tab', activeTab);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/projects/${projectId}/dashboard`);
      setProject(res.data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [load]);

  const acceptInvite = async (eng: Engagement) => {
    setBusyEngagementId(eng.id);
    try {
      await api.post(`/projects/${projectId}/engagements/${eng.id}/accept`);
      await load();
      toast.success(t('projects.inviteAcceptedTitle'));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('projects.tryAgain');
      toast.error(t('projects.tryAgain'), message);
    } finally {
      setBusyEngagementId(null);
    }
  };

  const declineInvite = async (eng: Engagement) => {
    setBusyEngagementId(eng.id);
    try {
      await api.post(`/projects/${projectId}/engagements/${eng.id}/decline`);
      await load();
      toast.success(t('projects.inviteDeclinedTitle'));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('projects.tryAgain');
      toast.error(t('projects.tryAgain'), message);
    } finally {
      setBusyEngagementId(null);
    }
  };

  const handlePick = async (pro: { id: string; name: string }) => {
    if (!picker) return;
    if (picker.purpose === 'book') {
      setBooking({ pro, engagementId: picker.eng.id });
      return;
    }
    try {
      await api.post(
        `/projects/${projectId}/engagements/${picker.eng.id}/invite`,
        { proId: pro.id },
      );
      await load();
      toast.success(
        t('projects.inviteSentTitle'),
        t('projects.inviteSentBody', {
          role: roleLabelOf(picker.eng.roleKey, picker.eng.roleLabel),
        }),
      );
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('projects.tryAgain');
      toast.error(t('projects.couldNotInvite'), message);
    }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.patch(`/projects/${projectId}`, { coverImage: url });
      await load();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const toggleMilestoneDone = async (ms: Milestone) => {
    const next = ms.status === 'done' ? 'pending' : 'done';
    try {
      await api.patch(`/projects/${projectId}/milestones/${ms.id}`, {
        status: next,
      });
      await load();
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const path =
        removeTarget.kind === 'role'
          ? `/projects/${projectId}/engagements/${removeTarget.id}`
          : `/projects/${projectId}/milestones/${removeTarget.id}`;
      await api.delete(path);
      await load();
      setRemoveTarget(null);
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setRemoving(false);
    }
  };

  // Invite / book a pro for a single service line. Creates (or reuses) the
  // engagement behind the service via the backend, then hands off to the
  // existing pro picker so the standard hire flow runs.
  const inviteProForService = async (
    item: ScopeItem,
    purpose: 'invite' | 'book',
  ) => {
    try {
      const res = await api.post(
        `/projects/${projectId}/scope-items/${item.id}/engagement`,
      );
      const updated = res.data as Project;
      setProject(updated);
      const fresh = (updated.scopeItems ?? []).find((s) => s.id === item.id);
      const eng = updated.engagements.find(
        (e) => e.id === fresh?.engagementId,
      );
      if (eng) setPicker({ eng, purpose });
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  const removeService = async () => {
    if (!removeServiceId) return;
    try {
      await api.delete(`/projects/${projectId}/scope-items/${removeServiceId}`);
      await load();
      setRemoveServiceId(null);
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  // Upload a file and file it as a document under the chosen step.
  const uploadStepDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.post(`/projects/${projectId}/documents`, {
        name: file.name,
        url,
        fileType: file.type || undefined,
        stepId: docUploadStepId || undefined,
      });
      await load();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setDocUploading(false);
      setDocUploadStepId(null);
      if (stepDocInputRef.current) stepDocInputRef.current.value = '';
    }
  };

  const removeDoc = async (docId: string) => {
    try {
      await api.delete(`/projects/${projectId}/documents/${docId}`);
      await load();
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  const triggerStepDocUpload = (stepId?: string) => {
    setDocUploadStepId(stepId ?? '');
    stepDocInputRef.current?.click();
  };

  // File an existing person (engagement) under a different step ('' detaches).
  const moveEngagementToStep = async (engId: string, stepId: string) => {
    try {
      await api.patch(`/projects/${projectId}/engagements/${engId}`, {
        stepId: stepId || '',
      });
      await load();
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  const isPro = project?.viewerRole === 'pro';
  const isMine = (eng: Engagement): boolean => {
    const p = eng.assignedProId;
    const pid =
      typeof p === 'object'
        ? ((p as { _id?: string; id?: string })._id ||
          (p as { id?: string }).id)
        : undefined;
    return !!pid && !!user?.id && pid === user.id;
  };

  const dateLocale =
    locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE';
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
    });


  // ---- Render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-12 pt-5 sm:px-6">
        <div className="animate-pulse">
          <div className="h-7 w-1/2 max-w-xs rounded-lg bg-[var(--hm-bg-tertiary)]" />
          <div className="mt-3 h-4 w-40 rounded bg-[var(--hm-bg-tertiary)]" />
          <div className="mt-5 h-2 w-full rounded-full bg-[var(--hm-bg-tertiary)]" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-[var(--hm-bg-tertiary)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-12 pt-5 sm:px-6">
        <Card variant="elevated" className="p-10 text-center">
          <p className="text-[var(--hm-fg-secondary)]">
            {t('projects.couldntLoad')}
          </p>
        </Card>
      </div>
    );
  }

  const photoUrls = collectProjectImages(project);
  const planned = project.budget?.planned ?? 0;
  const committed = project.budget?.committed ?? 0;
  const materialsTotal = project.procurement?.total ?? 0;
  const spent = committed + materialsTotal;
  const budgetValue = planned > 0 ? planned : spent;

  const orderedMilestones = [...project.milestones].sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (ad !== bd) return ad - bd;
    return a.sortOrder - b.sortOrder;
  });

  const activity = (project.activity ?? []).slice(0, 8);

  const tabs = [
    { id: 'overview', label: t('projects.tabOverview') },
    { id: 'plan', label: t('projects.tabPlan') },
    { id: 'rooms', label: t('projects.tabRooms') },
    { id: 'library', label: t('projects.tabLibrary') },
  ];

  const sectionTitle = (text: string) => (
    <h2 className="text-[18px] font-bold text-[var(--hm-fg-primary)]">{text}</h2>
  );

  return (
    <>
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-5 sm:px-6">
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadCover}
        />
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          ref={stepDocInputRef}
          type="file"
          className="hidden"
          onChange={uploadStepDoc}
        />

        {/* ---- Header (minimalist) ------------------------------------ */}
        <header className="flex items-start gap-4">
          {/* Small, restrained cover thumbnail. Owner taps to change it;
              viewers tap to open it in the lightbox. */}
          <button
            type="button"
            onClick={() => {
              if (!isPro) coverInputRef.current?.click();
              else if (project.coverImage)
                openLightbox(
                  photoUrls,
                  Math.max(0, photoUrls.indexOf(project.coverImage as string)),
                );
            }}
            disabled={coverUploading || (isPro && !project.coverImage)}
            aria-label={project.coverImage ? project.title : t('projects.addCover')}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-brand-500)] disabled:cursor-default sm:h-16 sm:w-16"
          >
            {project.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storage.getOptimizedImageUrl(project.coverImage, 'feedCard')}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                <ImagePlus className="h-5 w-5" />
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="truncate text-[22px] font-bold leading-tight text-[var(--hm-fg-primary)] sm:text-[26px]">
                {project.title}
              </h1>
              {!isPro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditProject(true)}
                  leftIcon={<Pencil />}
                  className="shrink-0"
                >
                  {t('common.edit')}
                </Button>
              )}
            </div>
            {/* Meta line: status + location + size, all in calm muted text */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[var(--hm-fg-muted)]">
              <span className="text-[var(--hm-fg-secondary)]">
                {t(`status.${project.status}`)}
              </span>
              {project.location && (
                <>
                  <span aria-hidden>·</span>
                  <span>{project.location}</span>
                </>
              )}
              {!!project.landArea && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {project.landArea} {t('projects.sqm')}
                  </span>
                </>
              )}
              {!!project.floorCount && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {t('projects.floorsCount', { count: project.floorCount })}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Thin progress line */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-[var(--hm-fg-muted)]">
            <span>{t('projects.overallProgress')}</span>
            <span className="tabular-nums text-[var(--hm-fg-secondary)]">
              {project.progress}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
            <div
              className="h-full rounded-full bg-[var(--hm-brand-500)] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
            />
          </div>
        </div>

        {/* ---- Tabs ---------------------------------------------------- */}
        <div className="mt-6 border-b border-[var(--hm-border-subtle)]">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
            scrollable
            groupId="project"
            className="border-0"
          />
        </div>

        <div className="mt-6">
          {/* ===== OVERVIEW (two-column dashboard) ===== */}
          {activeTab === 'overview' &&
            (() => {
              const remaining = Math.max(0, planned - spent);
              const budgetPct =
                planned > 0
                  ? Math.min(100, Math.round((spent / planned) * 100))
                  : 0;
              const assignedPros = project.engagements
                .filter((e) => typeof e.assignedProId === 'object')
                .map((e) => ({
                  eng: e,
                  pro: e.assignedProId as { name?: string; avatar?: string },
                }));
              const metaCard =
                'rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4';
              const eyebrow =
                'text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]';
              const detailRow = (label: string, value?: React.ReactNode) =>
                value ? (
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--hm-border-subtle)] py-2 text-[13px] last:border-0">
                    <span className="text-[var(--hm-fg-muted)]">{label}</span>
                    <span className="min-w-0 truncate text-right font-medium text-[var(--hm-fg-primary)]">
                      {value}
                    </span>
                  </div>
                ) : null;

              return (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  {/* LEFT: content stream */}
                  <div className="flex min-w-0 flex-col gap-8">
                    {/* Gallery (leads the page) */}
                    {photoUrls.length > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          {sectionTitle(t('projects.visualsTitle'))}
                          <span className="text-[13px] text-[var(--hm-fg-muted)]">
                            {t('projects.heroPhotoCountNoDate', {
                              count: photoUrls.length,
                            })}
                          </span>
                        </div>
                        <div className="columns-2 gap-3 [column-fill:_balance] sm:columns-3">
                          {photoUrls.slice(0, 9).map((url, i) => {
                            const overflow = photoUrls.length - 9;
                            const isLast = i === 8 && overflow > 0;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => openLightbox(photoUrls, i)}
                                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-[var(--hm-bg-tertiary)]"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={storage.getOptimizedImageUrl(url, 'feedCard')}
                                  alt=""
                                  loading="lazy"
                                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                                {isLast && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--hm-n-900)]/55 text-[20px] font-bold text-white">
                                    +{overflow}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

              {/* Timeline (milestones folded into Overview) */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  {sectionTitle(t('projects.tabTimeline'))}
                  {!isPro && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMilestone(true)}
                      leftIcon={<Plus />}
                    >
                      {t('projects.addMilestone')}
                    </Button>
                  )}
                </div>
                {orderedMilestones.length === 0 ? (
                  <Card variant="outlined" className="p-6">
                    <p className="text-[14px] text-[var(--hm-fg-secondary)]">
                      {t('projects.noMilestonesYet')}
                    </p>
                  </Card>
                ) : (
                  <Card variant="outlined">
                    <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                      {orderedMilestones.map((ms) => {
                        const done = ms.status === 'done';
                        const active = ms.status === 'active';
                        const overdue =
                          !done &&
                          !!ms.dueDate &&
                          new Date(ms.dueDate).getTime() < Date.now();
                        return (
                          <div
                            key={ms.id}
                            className="flex items-start gap-3 px-4 py-3"
                          >
                            <button
                              type="button"
                              disabled={isPro}
                              onClick={() => toggleMilestoneDone(ms)}
                              aria-label={ms.title}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                done
                                  ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                                  : 'border-[var(--hm-border-strong)] bg-transparent'
                              } ${isPro ? 'cursor-default' : 'hover:border-[var(--hm-brand-500)]'}`}
                            >
                              {done && <Check className="h-3 w-3" strokeWidth={3} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className={`text-[15px] font-semibold ${
                                    done
                                      ? 'text-[var(--hm-fg-muted)] line-through'
                                      : 'text-[var(--hm-fg-primary)]'
                                  }`}
                                >
                                  {ms.title}
                                </h4>
                                {!isPro && (
                                  <div className="flex shrink-0 items-center">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setEditMs(ms)}
                                      aria-label={t('common.edit')}
                                    >
                                      <Pencil />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() =>
                                        setRemoveTarget({
                                          kind: 'milestone',
                                          id: ms.id,
                                        })
                                      }
                                      aria-label={t('common.delete')}
                                    >
                                      <Trash2 />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {ms.description && (
                                <p className="mt-0.5 text-[13px] text-[var(--hm-fg-secondary)]">
                                  {ms.description}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {ms.dueDate && (
                                  <span
                                    className={`text-[12px] ${
                                      overdue
                                        ? 'font-semibold text-[var(--hm-error-500)]'
                                        : 'text-[var(--hm-fg-muted)]'
                                    }`}
                                  >
                                    {fmtDate(ms.dueDate)}
                                    {overdue && ` · ${t('status.overdue')}`}
                                  </span>
                                )}
                                {active && (
                                  <Badge variant="info">
                                    {t('projects.phaseActive')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>
                )}
              </section>

              {/* Recent activity */}
              {activity.length > 0 && (
                <section>
                  <div className="mb-3">{sectionTitle(t('projects.activityTitle'))}</div>
                  <Card variant="outlined">
                    <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                      {activity.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--hm-brand-500)]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] text-[var(--hm-fg-primary)]">
                              <span className="font-semibold">
                                {roleLabelOf(ev.roleLabel, ev.roleLabel)}
                              </span>{' '}
                              {describeActivity(ev, t)}
                            </p>
                            <span className="text-[12px] text-[var(--hm-fg-muted)]">
                              {relativeTime(ev.createdAt, t)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </section>
              )}

                  </div>

                  {/* RIGHT: sticky meta rail */}
                  <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
                    {/* Budget */}
                    <div className={metaCard}>
                      <span className={eyebrow}>{t('projects.statBudgetLabel')}</span>
                      <div className="mt-1 text-[26px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                        {formatGel(budgetValue)}
                      </div>
                      {planned > 0 && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                          <div
                            className="h-full rounded-full bg-[var(--hm-brand-500)]"
                            style={{ width: `${budgetPct}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-3 flex flex-col">
                        {detailRow(t('projects.rollupLabor'), formatGel(committed))}
                        {detailRow(
                          t('projects.rollupMaterials'),
                          formatGel(materialsTotal),
                        )}
                        {planned > 0 &&
                          detailRow(
                            t('projects.rollupRemaining'),
                            formatGel(remaining),
                          )}
                      </div>
                    </div>

                    {/* Team */}
                    <div className={metaCard}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={eyebrow}>
                          {t('projects.statTeamLabel')}
                          {project.engagements.length > 0
                            ? ` · ${project.engagements.length}`
                            : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('plan')}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80"
                        >
                          {t('common.viewAll')}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {assignedPros.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          {assignedPros.slice(0, 5).map(({ eng, pro }) => (
                            <div key={eng.id} className="flex items-center gap-2.5">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                                {pro.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={storage.getOptimizedImageUrl(
                                      pro.avatar,
                                      'avatar',
                                    )}
                                    alt={pro.name || ''}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserCircle className="h-4 w-4 text-[var(--hm-fg-muted)]" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                                  {pro.name}
                                </div>
                                <div className="truncate text-[11px] text-[var(--hm-fg-muted)]">
                                  {roleLabelOf(eng.roleKey, eng.roleLabel)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : !isPro ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('plan')}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--hm-border-strong)] py-3 text-[13px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
                        >
                          <UserPlus className="h-4 w-4" />
                          {t('projects.addRoleTitle')}
                        </button>
                      ) : (
                        <p className="text-[13px] text-[var(--hm-fg-muted)]">
                          {t('projects.noRolesYet')}
                        </p>
                      )}
                    </div>

                    {/* Details */}
                    <div className={metaCard}>
                      <span className={eyebrow}>{t('projects.statusLabel')}</span>
                      <div className="mt-2 flex flex-col">
                        {detailRow(
                          t('projects.statusLabel'),
                          <Pill
                            tone={
                              project.status === 'completed'
                                ? 'success'
                                : project.status === 'in_progress' ||
                                    project.status === 'active'
                                  ? 'info'
                                  : 'neutral'
                            }
                          >
                            {t(`status.${project.status}`)}
                          </Pill>,
                        )}
                        {detailRow(t('projects.locationLabel'), project.location)}
                        {detailRow(
                          t('projects.landAreaLabel'),
                          project.landArea
                            ? `${project.landArea} ${t('projects.sqm')}`
                            : undefined,
                        )}
                        {detailRow(
                          t('projects.floorCountLabel'),
                          project.floorCount || undefined,
                        )}
                        {detailRow(
                          t('projects.cadastralLabel'),
                          project.cadastralId,
                        )}
                        {detailRow(
                          t('projects.materialsRoomsLabel'),
                          project.rooms?.length || undefined,
                        )}
                      </div>
                    </div>
                  </aside>
                </div>
              );
            })()}

          {/* ===== PLAN (steps -> services -> pro per service) ===== */}
          {activeTab === 'plan' &&
            (() => {
              const steps = (project.steps ?? [])
                .slice()
                .sort((a, b) => a.order - b.order);
              const stepIds = new Set(steps.map((s) => s.id));
              const services = project.scopeItems ?? [];
              const roomName = (roomId?: string) =>
                roomId
                  ? (project.rooms ?? []).find((r) => r.id === roomId)?.name
                  : undefined;

              const servicePro = (svc: ScopeItem) => {
                const eng = svc.engagementId
                  ? project.engagements.find((e) => e.id === svc.engagementId)
                  : undefined;
                if (!eng) {
                  if (isPro)
                    return (
                      <span className="text-[13px] text-[var(--hm-fg-muted)]">
                        —
                      </span>
                    );
                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => inviteProForService(svc, 'invite')}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--hm-brand-500)] px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)] hover:text-white"
                      >
                        <UserPlus className="h-3 w-3" />
                        {t('projects.invitePro')}
                      </button>
                      <button
                        type="button"
                        onClick={() => inviteProForService(svc, 'book')}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--hm-border-strong)] px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        {t('projects.book')}
                      </button>
                    </div>
                  );
                }
                const proObj =
                  typeof eng.assignedProId === 'object'
                    ? eng.assignedProId
                    : undefined;
                const badge = ENGAGEMENT_BADGE[eng.status];
                const tone: 'neutral' | 'info' | 'success' | 'warning' =
                  eng.status === 'hired' || eng.status === 'completed'
                    ? 'success'
                    : eng.status === 'in_progress'
                      ? 'info'
                      : eng.status === 'open' || eng.status === 'invited'
                        ? 'warning'
                        : 'neutral';
                return (
                  <div className="flex min-w-0 items-center gap-2">
                    {proObj?.name && (
                      <span className="truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                        {proObj.name}
                      </span>
                    )}
                    <Pill tone={tone}>{t(badge.labelKey)}</Pill>
                  </div>
                );
              };

              const SVC_GRID =
                'sm:grid-cols-[minmax(0,2.2fr)_92px_100px_minmax(120px,1.3fr)_2.25rem]';

              const serviceTable = (rows: ScopeItem[]) => (
                <div>
                  <div
                    className={`hidden ${SVC_GRID} border-b border-[var(--hm-border-subtle)] pb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--hm-fg-muted)] sm:grid sm:gap-3`}
                  >
                    <span>{t('projects.servicesLabel')}</span>
                    <span>{t('projects.quantity')}</span>
                    <span>{t('projects.total')}</span>
                    <span>{t('projects.invitePro')}</span>
                    <span />
                  </div>
                  {rows.map((svc) => {
                    const total = (svc.quantity || 0) * (svc.unitPrice || 0);
                    const rn = roomName(svc.roomId);
                    return (
                      <div
                        key={svc.id}
                        className={`flex flex-col gap-1.5 border-b border-[var(--hm-border-subtle)] py-3 last:border-0 sm:grid ${SVC_GRID} sm:items-center sm:gap-3`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                            {svc.name}
                          </div>
                          <div className="truncate text-[12px] text-[var(--hm-fg-muted)]">
                            {rn || t('projects.wholeObject')}
                            {svc.note ? ` · ${svc.note}` : ''}
                          </div>
                        </div>
                        <div className="text-[13px] tabular-nums text-[var(--hm-fg-secondary)]">
                          {svc.quantity
                            ? `${svc.quantity} ${svc.unitLabel || ''}`.trim()
                            : '—'}
                        </div>
                        <div className="text-[14px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                          {total > 0 ? formatGel(total) : '—'}
                        </div>
                        <div className="min-w-0">{servicePro(svc)}</div>
                        {!isPro ? (
                          <div className="flex items-center justify-start gap-0.5 sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setServiceModal({ stepId: svc.stepId, item: svc })
                              }
                              aria-label={t('common.edit')}
                              className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemoveServiceId(svc.id)}
                              aria-label={t('common.delete')}
                              className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              );

              // Compact, clean person row (replaces the heavy engagement card).
              const brandPill =
                'inline-flex items-center gap-1 rounded-full border border-[var(--hm-brand-500)] px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)] hover:text-white disabled:opacity-60';
              const neutralPill =
                'inline-flex items-center gap-1 rounded-full border border-[var(--hm-border-strong)] px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)] disabled:opacity-60';
              const rowLink =
                'inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:underline';

              const personActions = (eng: Engagement) => {
                const jobId = typeof eng.jobId === 'string' ? eng.jobId : undefined;
                const mine = isMine(eng);
                const busy = busyEngagementId === eng.id;
                if (eng.status === 'draft' && !isPro)
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setPicker({ eng, purpose: 'invite' })}
                        className={brandPill}
                      >
                        <UserPlus className="h-3 w-3" />
                        {t('projects.invite')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPicker({ eng, purpose: 'book' })}
                        className={neutralPill}
                      >
                        <CalendarPlus className="h-3 w-3" />
                        {t('projects.book')}
                      </button>
                    </>
                  );
                if (eng.status === 'open' && jobId && !isPro)
                  return (
                    <Link
                      href={cl(`/my-jobs/${jobId}/proposals`)}
                      className={rowLink}
                    >
                      {t('projects.viewQuotes')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  );
                if (eng.status === 'invited' && mine)
                  return (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => acceptInvite(eng)}
                        className={brandPill}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                        {t('projects.acceptInvite')}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => declineInvite(eng)}
                        className={neutralPill}
                      >
                        {t('projects.declineInvite')}
                      </button>
                    </>
                  );
                if (
                  (eng.status === 'hired' ||
                    eng.status === 'in_progress' ||
                    eng.status === 'completed') &&
                  (!isPro || mine)
                ) {
                  if (jobId)
                    return (
                      <Link href={cl(`/my-jobs/${jobId}`)} className={rowLink}>
                        {t('projects.openWorkspace')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    );
                  if (eng.bookingId)
                    return (
                      <Link
                        href={cl(`/bookings/${eng.bookingId}`)}
                        className={rowLink}
                      >
                        {t('projects.viewBooking')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    );
                }
                return null;
              };

              const personRow = (eng: Engagement) => {
                const proObj =
                  typeof eng.assignedProId === 'object'
                    ? eng.assignedProId
                    : undefined;
                const proName = proObj?.name;
                const badge = ENGAGEMENT_BADGE[eng.status];
                const tone: 'neutral' | 'info' | 'success' | 'warning' =
                  eng.status === 'hired' || eng.status === 'completed'
                    ? 'success'
                    : eng.status === 'in_progress'
                      ? 'info'
                      : eng.status === 'open' || eng.status === 'invited'
                        ? 'warning'
                        : 'neutral';
                return (
                  <div
                    key={eng.id}
                    className="flex flex-col gap-2 border-b border-[var(--hm-border-subtle)] py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                        {proObj?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={storage.getOptimizedImageUrl(
                              proObj.avatar,
                              'avatar',
                            )}
                            alt={proName || ''}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-4 w-4 text-[var(--hm-fg-muted)]" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                          {proName || roleLabelOf(eng.roleKey, eng.roleLabel)}
                        </div>
                        <div className="truncate text-[12px] text-[var(--hm-fg-muted)]">
                          {proName
                            ? roleLabelOf(eng.roleKey, eng.roleLabel)
                            : eng.scope || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      <Pill tone={tone}>{t(badge.labelKey)}</Pill>
                      {personActions(eng)}
                      {!isPro && steps.length > 0 && (
                        <select
                          value={eng.stepId || ''}
                          onChange={(e) =>
                            moveEngagementToStep(eng.id, e.target.value)
                          }
                          aria-label={t('projects.addStep')}
                          className="h-7 rounded-full border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-2.5 text-[12px] text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-fg-primary)]"
                        >
                          <option value="">{t('projects.unassignedStep')}</option>
                          {steps.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {!isPro && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditRoleEng(eng)}
                            aria-label={t('common.edit')}
                            className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {['draft', 'invited', 'open', 'cancelled'].includes(
                            eng.status,
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                setRemoveTarget({ kind: 'role', id: eng.id })
                              }
                              aria-label={t('common.delete')}
                              className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              };

              const docRow = (d: ProjectDoc) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 border-b border-[var(--hm-border-subtle)] py-2.5 last:border-0"
                >
                  <FileText className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)]" />
                  <a
                    href={storage.getFileUrl(d.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)]"
                  >
                    {d.name}
                  </a>
                  {!isPro && (
                    <button
                      type="button"
                      onClick={() => removeDoc(d.id)}
                      aria-label={t('common.delete')}
                      className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );

              // A labelled sub-section inside a step card (People / Works / Docs).
              const Section = ({
                label,
                count,
                addLabel,
                onAdd,
                empty,
                children,
              }: {
                label: string;
                count: number;
                addLabel: string;
                onAdd?: () => void;
                empty: string;
                children: React.ReactNode;
              }) => (
                <div className="border-t border-[var(--hm-border-subtle)] pt-3 first:border-0 first:pt-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
                      {label}
                      {count > 0 ? ` · ${count}` : ''}
                    </span>
                    {!isPro && onAdd && (
                      <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
                      >
                        <Plus className="h-3 w-3" />
                        {addLabel}
                      </button>
                    )}
                  </div>
                  {count > 0 ? (
                    children
                  ) : (
                    <p className="py-1 text-[13px] text-[var(--hm-fg-muted)]">
                      {empty}
                    </p>
                  )}
                </div>
              );

              const stepBody = (
                stepId: string | undefined,
                engs: Engagement[],
                svcs: ScopeItem[],
                ds: ProjectDoc[],
                showDocs: boolean,
              ) => (
                <div className="flex flex-col gap-4">
                  <Section
                    label={t('projects.peopleLabel')}
                    count={engs.length}
                    addLabel={t('projects.addPerson')}
                    onAdd={
                      stepId
                        ? () => setAddPersonStepId(stepId)
                        : () => setShowAddRole(true)
                    }
                    empty={t('projects.noPeopleInStep')}
                  >
                    <div>{engs.map(personRow)}</div>
                  </Section>

                  <Section
                    label={t('projects.servicesLabel')}
                    count={svcs.length}
                    addLabel={t('projects.addService')}
                    onAdd={() => setServiceModal({ stepId })}
                    empty={t('projects.noServicesInStep')}
                  >
                    {serviceTable(svcs)}
                  </Section>

                  {showDocs && (
                    <Section
                      label={t('projects.documentsLabel')}
                      count={ds.length}
                      addLabel={t('projects.addDocument')}
                      onAdd={() => triggerStepDocUpload(stepId)}
                      empty={t('projects.noDocsInStep')}
                    >
                      <div>{ds.map(docRow)}</div>
                    </Section>
                  )}
                </div>
              );

              const stepActions = (s: ProjectStep) =>
                !isPro ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditStep({ mode: 'edit', step: s })}
                      aria-label={t('common.edit')}
                      className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveStep({ id: s.id, name: s.name })}
                      aria-label={t('common.delete')}
                      className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null;

              const docs = project.documents ?? [];
              const unassignedServices = services.filter(
                (s) => !s.stepId || !stepIds.has(s.stepId),
              );
              const unassignedRoles = project.engagements.filter(
                (e) =>
                  (!e.stepId || !stepIds.has(e.stepId)) &&
                  !services.some((s) => s.engagementId === e.id),
              );
              const isEmpty =
                steps.length === 0 &&
                services.length === 0 &&
                project.engagements.length === 0;

              return (
                <div className="flex flex-col gap-4">
                  {!isPro && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => setEditStep({ mode: 'create' })}
                        leftIcon={<Plus />}
                      >
                        {t('projects.addStep')}
                      </Button>
                    </div>
                  )}

                  {isEmpty ? (
                    <Card variant="outlined" className="p-8 text-center">
                      <p className="mb-4 text-[14px] text-[var(--hm-fg-secondary)]">
                        {t('projects.noStepsYet')}
                      </p>
                      {!isPro && (
                        <Button
                          onClick={() => setEditStep({ mode: 'create' })}
                          leftIcon={<Plus />}
                        >
                          {t('projects.addStep')}
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <>
                      {steps.map((s) => {
                        const engs = project.engagements.filter(
                          (e) => e.stepId === s.id,
                        );
                        const svc = services.filter((x) => x.stepId === s.id);
                        const ds = docs.filter((d) => d.stepId === s.id);
                        return (
                          <TableCard
                            key={s.id}
                            title={s.name}
                            action={stepActions(s)}
                          >
                            {stepBody(s.id, engs, svc, ds, true)}
                          </TableCard>
                        );
                      })}

                      {(unassignedServices.length > 0 ||
                        unassignedRoles.length > 0) && (
                        <TableCard title={t('projects.unassignedStep')}>
                          {stepBody(
                            undefined,
                            unassignedRoles,
                            unassignedServices,
                            [],
                            false,
                          )}
                        </TableCard>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

          {/* ===== ROOMS (rooms + products + selections) ===== */}
          {activeTab === 'rooms' && (
            <div className="flex flex-col gap-10">
              <ProjectRooms
                projectId={projectId}
                rooms={project.rooms ?? []}
                canManage={!isPro}
                onChanged={load}
              />
              <ProjectShopping
                projectId={projectId}
                products={project.products ?? []}
                rooms={project.rooms ?? []}
                canManage={!isPro}
                onChanged={load}
              />
              <ProjectSelections
                projectId={projectId}
                selections={project.selections ?? []}
                rooms={project.rooms ?? []}
                canManage={!isPro}
                canReview={!isPro}
                onChanged={load}
              />
            </div>
          )}

          {/* ===== LIBRARY / FILES ===== */}
          {activeTab === 'library' && (
            <div className="flex flex-col gap-10">
              <ProjectDocuments
                projectId={projectId}
                documents={project.documents ?? []}
                canManage={!isPro}
                onChanged={load}
              />
              <ProjectDecisions
                projectId={projectId}
                decisions={project.decisions ?? []}
                canManage={!isPro}
                onChanged={load}
              />
            </div>
          )}
        </div>
      </div>

      {/* ---- Modals ---------------------------------------------------- */}
      {picker && (
        <InviteProModal
          isOpen={!!picker}
          onClose={() => setPicker(null)}
          roleLabel={roleLabelOf(picker.eng.roleKey, picker.eng.roleLabel)}
          roleKey={picker.eng.roleKey}
          actionLabel={
            picker.purpose === 'book' ? t('projects.select') : t('projects.invite')
          }
          onPick={handlePick}
        />
      )}

      {booking && (
        <BookingModal
          isOpen={!!booking}
          onClose={() => {
            setBooking(null);
            load();
          }}
          professionalId={booking.pro.id}
          professionalName={booking.pro.name}
          projectId={projectId}
          engagementId={booking.engagementId}
        />
      )}

      {showAddRole && (
        <AddRoleModal
          isOpen={showAddRole}
          onClose={() => setShowAddRole(false)}
          projectId={projectId}
          existingKeys={project?.engagements.map((e) => e.roleKey) ?? []}
          onAdded={load}
        />
      )}

      {addPersonStepId && (
        <AddRoleModal
          isOpen={!!addPersonStepId}
          onClose={() => setAddPersonStepId(null)}
          projectId={projectId}
          existingKeys={project?.engagements.map((e) => e.roleKey) ?? []}
          stepId={addPersonStepId}
          onAdded={load}
        />
      )}

      {serviceModal && (
        <AddServiceModal
          isOpen={!!serviceModal}
          onClose={() => setServiceModal(null)}
          projectId={projectId}
          stepId={serviceModal.stepId}
          rooms={project.rooms ?? []}
          steps={project.steps ?? []}
          item={serviceModal.item}
          onSaved={load}
        />
      )}

      {removeServiceId && (
        <ConfirmModal
          isOpen={!!removeServiceId}
          onClose={() => setRemoveServiceId(null)}
          onConfirm={removeService}
          variant="danger"
          title={t('common.delete')}
          description={t('projects.removeConfirm')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
        />
      )}

      {editStep && (
        <EditStepModal
          isOpen={!!editStep}
          onClose={() => setEditStep(null)}
          projectId={projectId}
          step={editStep.mode === 'edit' ? editStep.step : undefined}
          onSaved={load}
        />
      )}

      {removeStep && (
        <ConfirmModal
          isOpen={!!removeStep}
          onClose={() => setRemoveStep(null)}
          onConfirm={async () => {
            if (!removeStep) return;
            try {
              await api.delete(`/projects/${projectId}/steps/${removeStep.id}`);
              await load();
              toast.success(t('projects.stepRemoved'));
            } catch (err) {
              toast.error(
                t('projects.tryAgain'),
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message,
              );
            } finally {
              setRemoveStep(null);
            }
          }}
          variant="danger"
          title={t('projects.removeStepTitle')}
          description={t('projects.removeStepConfirm', { name: removeStep.name })}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
        />
      )}

      {showAddMilestone && (
        <AddMilestoneModal
          isOpen={showAddMilestone}
          onClose={() => setShowAddMilestone(false)}
          projectId={projectId}
          onAdded={load}
        />
      )}

      {showEditProject && project && (
        <EditProjectModal
          isOpen={showEditProject}
          onClose={() => setShowEditProject(false)}
          projectId={projectId}
          initial={{
            title: project.title,
            description: project.description,
            location: project.location,
            budgetMax: project.budgetMax,
            status: project.status,
            cadastralId: project.cadastralId,
            landArea: project.landArea,
            floorCount: project.floorCount,
          }}
          onSaved={load}
        />
      )}

      {editRoleEng && (
        <EditRoleModal
          isOpen={!!editRoleEng}
          onClose={() => setEditRoleEng(null)}
          projectId={projectId}
          engagement={{
            id: editRoleEng.id,
            roleLabel: roleLabelOf(editRoleEng.roleKey, editRoleEng.roleLabel),
            scope: editRoleEng.scope,
            budget: editRoleEng.budget,
            phase: editRoleEng.phase,
          }}
          onSaved={load}
        />
      )}

      {editMs && (
        <AddMilestoneModal
          isOpen={!!editMs}
          onClose={() => setEditMs(null)}
          projectId={projectId}
          onAdded={load}
          milestone={{
            id: editMs.id,
            title: editMs.title,
            description: editMs.description,
            dueDate: editMs.dueDate,
          }}
        />
      )}

      {removeTarget && (
        <ConfirmModal
          isOpen={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
          variant="danger"
          title={t('common.delete')}
          description={t('projects.removeConfirm')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          isLoading={removing}
        />
      )}

      {lightbox && (
        <ImageLightbox
          isOpen={!!lightbox}
          onClose={() => setLightbox(null)}
          images={lightbox.images.map((u) => storage.getFileUrl(u))}
          initialIndex={lightbox.index}
          ariaLabel={project.title}
        />
      )}
    </>
  );
}
