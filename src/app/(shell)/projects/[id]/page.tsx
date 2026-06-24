'use client';

import InviteProModal from '@/components/projects/InviteProModal';
import ProjectClientView from '@/components/projects/ProjectClientView';
import ProjectDesignerActions from '@/components/projects/ProjectDesignerActions';
import ProjectDocuments, {
  ProjectDoc,
} from '@/components/projects/ProjectDocuments';
import { ProjectDecision } from '@/components/projects/ProjectDecisions';
import ProjectShopping, {
  ProjectProduct,
  ProductLogEntry,
} from '@/components/projects/ProjectShopping';
import ProjectSelections, {
  Selection,
} from '@/components/projects/ProjectSelections';
import ProjectMoodboard, { MoodboardItem } from '@/components/projects/ProjectMoodboard';
import { Room } from '@/components/projects/ProjectRooms';
import { ScopeItem } from '@/components/projects/ProjectScope';
import { TableCard, Pill } from '@/components/projects/TableCard';
import AddServiceModal from '@/components/projects/AddServiceModal';
import ImportEstimateModal from '@/components/projects/ImportEstimateModal';
import AddProductModal from '@/components/projects/AddProductModal';
import AddFilesModal from '@/components/projects/AddFilesModal';
import DocumentReviewModal from '@/components/projects/DocumentReviewModal';
import SpaceModal from '@/components/projects/SpaceModal';
import ImageLightbox from '@/components/common/ImageLightbox';
import EditProjectModal from '@/components/projects/EditProjectModal';
import MilestonePaymentsPanel from '@/components/projects/MilestonePaymentsPanel';
import EditRoleModal from '@/components/projects/EditRoleModal';
import EditStepModal from '@/components/projects/EditStepModal';
import { ConfirmModal } from '@/components/ui/Modal';
import BookingModal from '@/components/professionals/BookingModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/Card';
import ProjectTabs from '@/components/projects/ProjectTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useCountryLink } from '@/hooks/useCountry';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarPlus,
  Check,
  ChevronDown,
  Combine,
  ChevronUp,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Images,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  UserCircle,
  UserPlus,
  Wallet,
  Wrench,
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
  canManage?: boolean;
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
  productLog?: ProductLogEntry[];
  selections?: Selection[];
  rooms?: Room[];
  scopeItems?: ScopeItem[];
  moodboardItems?: MoodboardItem[];
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
  viewerRole?: 'client' | 'editor' | 'worker';
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

// Circular progress ring for the hero. The dasharray trick: r=15.9155 gives a
// circumference of ~100, so `${v}, 100` fills v percent of the ring.
function ProgressRing({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="relative h-[56px] w-[56px] shrink-0 sm:h-[60px] sm:w-[60px]">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="var(--hm-bg-tertiary)"
          strokeWidth="3.4"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="var(--hm-brand-500)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={`${v}, 100`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] font-bold tabular-nums text-[var(--hm-fg-primary)] sm:text-[15px]">
          {v}%
        </span>
      </div>
    </div>
  );
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
    // Per-space galleries (renders / photos tied to each space) roll up here.
    ...(project.rooms ?? []).flatMap((r) => r.photos ?? []),
    ...(project.documents ?? [])
      .filter((d) => looksLikeImage(d.url, d.fileType))
      .map((d) => d.url),
    // NOTE: product images (shopping thumbnails) are deliberately excluded -
    // they are catalog photos, not project visuals.
  ];
  return Array.from(new Set(urls.filter(Boolean)));
}

// Top-level tabs after the 2026 "back to simple" pass: four standard surfaces.
const TOP_TABS = ['overview', 'plan', 'rooms', 'materials', 'moodboard', 'shopping', 'library'] as const;

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
  const { user, isLoading: authLoading } = useAuth();

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
  // Bounds the silent auto-retries for transient dashboard failures (e.g. a
  // backend restart or a brief network blip right after login) so a momentary
  // outage self-heals instead of stranding the user on the error screen.
  const retriesRef = useRef(0);
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

  const [showEditProject, setShowEditProject] = useState(false);
  const [editRoleEng, setEditRoleEng] = useState<Engagement | null>(null);
  const [editStep, setEditStep] = useState<
    { mode: 'create' } | { mode: 'edit'; step: ProjectStep } | null
  >(null);
  const [removeStep, setRemoveStep] = useState<{ id: string; name: string } | null>(null);
  // Add/edit a service (scope item) under a step. stepId omitted = unassigned.
  const [serviceModal, setServiceModal] = useState<{
    stepId?: string;
    roomId?: string;
    item?: ScopeItem;
  } | null>(null);
  const [removeServiceId, setRemoveServiceId] = useState<string | null>(null);
  // Spaces tab: add/edit a space, add/edit a product, per-space photo upload.
  const [spaceModal, setSpaceModal] = useState<{ space?: Room } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [removeSpaceId, setRemoveSpaceId] = useState<string | null>(null);
  const [productModal, setProductModal] = useState<{
    roomId?: string;
    item?: ProjectProduct;
  } | null>(null);
  const [removeProductId, setRemoveProductId] = useState<string | null>(null);
  // When set, the Spaces tab shows only this space ('' = whole-object bucket).
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const roomPhotoInputRef = useRef<HTMLInputElement>(null);
  const [photoRoomId, setPhotoRoomId] = useState<string | null>(null);
  const [roomPhotoUploading, setRoomPhotoUploading] = useState(false);
  // Custom per-space file groups (renders etc.): upload + review/version/comment.
  const [filesModal, setFilesModal] = useState<{
    roomId?: string;
    group?: string;
  } | null>(null);
  const [reviewDoc, setReviewDoc] = useState<ProjectDoc | null>(null);
  // Add a person (role/engagement) under a step. undefined stepId = unassigned.
  // Upload a document into a step: holds the target stepId while the file
  // dialog is open (or '' for an unassigned doc).
  const stepDocInputRef = useRef<HTMLInputElement>(null);
  const [docUploadStepId, setDocUploadStepId] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  // Mobile drawer for the project switcher sidebar.
  // Plan tab: when set, the Plan shows only this step (driven by the header
  // step-progress rail). null = show all steps.
  const [planStepFilter, setPlanStepFilter] = useState<string | null>(null);
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
      selections: 'materials',
      shopping: 'rooms',
      renders: 'library',
      documents: 'library',
      decisions: 'library',
    };
    if (tp && (TOP_TABS as readonly string[]).includes(tp)) return tp;
    if (tp && legacyMap[tp]) return legacyMap[tp];
    return 'overview';
  });

  // Clients default to the simplified "Status & Decisions" view; "See full
  // details" drops them into the same tabbed view editors/workers see. A
  // `?tab=` deep-link (e.g. from a notification) opens the full view directly.
  const [clientSimpleView, setClientSimpleView] = useState(
    () => !searchParams.get('tab'),
  );

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
      retriesRef.current = 0;
      setError(false);
      setIsLoading(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      // Workers (trade pros without manage rights) are blocked from the
      // project page - send them to their order in my-work instead.
      if (status === 403) {
        router.replace('/my-work');
        return;
      }
      // Transient failures (no response = network/CORS, or 5xx = backend
      // restarting) self-heal: retry a few times with backoff while staying
      // in the loading state, so a brief outage doesn't surface an error.
      const transient = status == null || status >= 500;
      if (transient && retriesRef.current < 3) {
        retriesRef.current += 1;
        window.setTimeout(() => void load(), retriesRef.current * 1500);
        return;
      }
      setError(true);
      setIsLoading(false);
    }
  }, [projectId, router]);

  const retry = useCallback(() => {
    retriesRef.current = 0;
    setError(false);
    setIsLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    // Wait for the auth context to settle before the first fetch - firing
    // mid-login can send the request before the token is in place, 401, and
    // strand the page on the error state. Keying on `user?.id` (not just
    // `authLoading`) means logging in *after* landing here - e.g. an expired
    // session that 401'd into the error screen - refetches automatically once
    // the token lands, instead of stranding the user on "Try again".
    if (authLoading) return;
    setIsLoading(true);
    setError(false);
    retriesRef.current = 0;
    void load();
  }, [load, authLoading, user?.id]);

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

  const handlePick = async (
    pro: { id: string; name: string },
    schedule?: { scheduledStart?: string; period?: string },
  ) => {
    if (!picker) return;
    if (picker.purpose === 'book') {
      setBooking({ pro, engagementId: picker.eng.id });
      return;
    }
    try {
      await api.post(
        `/projects/${projectId}/engagements/${picker.eng.id}/invite`,
        {
          proId: pro.id,
          scheduledStart: schedule?.scheduledStart,
          period: schedule?.period,
        },
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

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;

  const removeSpace = async () => {
    if (!removeSpaceId) return;
    try {
      await api.delete(`/projects/${projectId}/rooms/${removeSpaceId}`);
      await load();
      setRemoveSpaceId(null);
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  const removeProduct = async () => {
    if (!removeProductId) return;
    try {
      await api.delete(`/projects/${projectId}/products/${removeProductId}`);
      await load();
      setRemoveProductId(null);
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  // Upload a render/photo and attach it to a space (room.photos).
  const triggerRoomPhoto = (rid: string) => {
    setPhotoRoomId(rid);
    roomPhotoInputRef.current?.click();
  };
  const uploadRoomPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const room = (project?.rooms ?? []).find((r) => r.id === photoRoomId);
    if (!file || !room) {
      setPhotoRoomId(null);
      return;
    }
    setRoomPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.patch(`/projects/${projectId}/rooms/${room.id}`, {
        photos: [...(room.photos ?? []), url],
      });
      await load();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setRoomPhotoUploading(false);
      setPhotoRoomId(null);
      if (roomPhotoInputRef.current) roomPhotoInputRef.current.value = '';
    }
  };
  const removeRoomPhoto = async (room: Room, url: string) => {
    try {
      await api.patch(`/projects/${projectId}/rooms/${room.id}`, {
        photos: (room.photos ?? []).filter((p) => p !== url),
      });
      await load();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
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

  // Client grants / revokes project-manage (editor) rights for an assigned pro.
  const toggleManage = async (eng: Engagement) => {
    try {
      await api.patch(`/projects/${projectId}/engagements/${eng.id}`, {
        canManage: !eng.canManage,
      });
      await load();
      toast.success(
        eng.canManage
          ? t('projects.manageRevoked')
          : t('projects.manageGranted'),
      );
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    }
  };

  // Remove leftover duplicate engagements for the same pro (old "add person").
  const [cleaningTeam, setCleaningTeam] = useState(false);
  const cleanupTeam = async () => {
    setCleaningTeam(true);
    try {
      await api.post(`/projects/${projectId}/engagements/dedupe`);
      await load();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setCleaningTeam(false);
    }
  };

  // Move a step up/down and persist the new order.
  const moveStep = async (stepId: string, dir: -1 | 1) => {
    const ordered = (project?.steps ?? [])
      .slice()
      .sort((a, b) => a.order - b.order);
    const i = ordered.findIndex((s) => s.id === stepId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const next = ordered.slice();
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await api.post(`/projects/${projectId}/steps/reorder`, {
        orderedIds: next.map((s) => s.id),
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

  // Only the client owner and client-granted editors (managers) ever load
  // this page - workers are blocked server-side and redirected to my-work.
  // Both client and editor get edit rights; `isClient` gates owner-only
  // controls (granting the manage toggle).
  const isClient = project?.viewerRole === 'client';
  // `isPro` is the legacy read-only flag, kept so existing `!isPro` edit gates
  // still work; it is only true for a (blocked) worker, so on this page it is
  // effectively always false = client + editor can edit.
  const isPro = project?.viewerRole === 'worker';
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
        <div className="min-w-0 animate-pulse">
          <div className="h-[120px] rounded-2xl bg-[var(--hm-bg-tertiary)]" />
          <div className="mt-4 h-10 w-full rounded-xl bg-[var(--hm-bg-tertiary)]" />
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
        <Card variant="elevated" className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-[var(--hm-fg-secondary)]">
            {t('projects.couldntLoad')}
          </p>
          <Button
            variant="outline"
            onClick={retry}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            {t('projects.tryAgain')}
          </Button>
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


  const activity = (project.activity ?? []).slice(0, 8);

  const TAB_ICON = 'h-[17px] w-[17px]';
  const tabs = [
    {
      id: 'overview',
      label: t('projects.tabOverview'),
      icon: <LayoutDashboard className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'plan',
      label: t('projects.tabPlan'),
      icon: <ListChecks className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'rooms',
      label: t('projects.tabRooms'),
      icon: <Boxes className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'materials',
      label: t('projects.selTab'),
      icon: <Palette className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'moodboard',
      label: t('projects.tabMoodboard'),
      icon: <Images className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'shopping',
      label: t('projects.tabShopping'),
      icon: <ShoppingBag className={TAB_ICON} strokeWidth={1.75} />,
    },
    {
      id: 'library',
      label: t('projects.tabDocuments'),
      icon: <FileText className={TAB_ICON} strokeWidth={1.75} />,
    },
  ];

  const sectionTitle = (text: string) => (
    <h2 className="flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
      <span
        aria-hidden
        className="h-4 w-1 rounded-full bg-[var(--hm-brand-500)]"
      />
      {text}
    </h2>
  );

  // Warm, friendly empty state: soft brand icon + headline + guidance + CTA.
  const friendlyEmpty = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    ctaLabel?: string,
    onCta?: () => void,
  ) => (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-tertiary)]/40 px-6 py-9 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-semibold text-[var(--hm-fg-primary)]">
          {title}
        </p>
        <p className="mx-auto mt-1 max-w-[40ch] text-[13px] text-[var(--hm-fg-muted)]">
          {subtitle}
        </p>
      </div>
      {ctaLabel && onCta && !isPro && (
        <Button size="sm" onClick={onCta} leftIcon={<Plus />}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );

  // Client lens: a calm status & decisions view instead of the full
  // project-management tabs. Editors/workers always get the tabbed view below.
  if (isClient && clientSimpleView) {
    return (
      <ProjectClientView
        project={project}
        projectId={projectId}
        onSeeFullDetails={(tab) => {
          if (tab) setActiveTab(tab);
          setClientSimpleView(false);
        }}
      />
    );
  }

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
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          ref={roomPhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadRoomPhoto}
        />

        {/* Project switching lives in the main app sidebar now, so the page
            content takes the full width (two nested divs keep the existing
            closing tags balanced). */}
        <div>
          <div className="min-w-0">

        {/* Designer/editor focus strip: the few things the project lead must
            act on, kept visible while they work in any non-overview tab (the
            overview already carries its own "needs attention" notice, so we
            skip it there to avoid duplicating). Renders nothing when clear. */}
        {project.viewerRole === 'editor' && activeTab !== 'overview' && (
          <ProjectDesignerActions
            engagements={project.engagements}
            selections={project.selections}
            onGoTo={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ---- Hero header ------------------------------------------- */}
        {(() => {
          const heroAvatars = project.engagements
            .map((e) =>
              typeof e.assignedProId === 'object'
                ? (e.assignedProId as { avatar?: string }).avatar
                : undefined,
            )
            .filter((u): u is string => !!u);
          const moreCount = project.engagements.length - heroAvatars.length;
          const statusTone: 'neutral' | 'info' | 'success' =
            project.status === 'completed'
              ? 'success'
              : project.status === 'in_progress' || project.status === 'active'
                ? 'info'
                : 'neutral';
          return (
            <Card variant="elevated" className="animate-card-enter overflow-hidden rounded-2xl">
              <div className="flex items-start gap-4 bg-gradient-to-br from-[var(--hm-brand-500)]/[0.06] to-transparent p-4 sm:items-center sm:gap-5 sm:p-5">
                {/* Cover thumbnail. Owner taps to change it; viewer to open it. */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) coverInputRef.current?.click();
                    else if (project.coverImage)
                      openLightbox(
                        photoUrls,
                        Math.max(
                          0,
                          photoUrls.indexOf(project.coverImage as string),
                        ),
                      );
                  }}
                  disabled={coverUploading || (isPro && !project.coverImage)}
                  aria-label={
                    project.coverImage ? project.title : t('projects.addCover')
                  }
                  className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] shadow-sm ring-1 ring-[var(--hm-border-subtle)] transition-colors hover:text-[var(--hm-brand-500)] disabled:cursor-default sm:h-[72px] sm:w-[72px]"
                >
                  {project.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storage.getOptimizedImageUrl(
                        project.coverImage,
                        'feedCard',
                      )}
                      alt={project.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                  )}
                </button>

                {/* Identity */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone}>
                          {statusTone === 'info' && (
                            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                          )}
                          {t(`status.${project.status}`)}
                        </Pill>
                        {heroAvatars.length > 0 && (
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {heroAvatars.slice(0, 4).map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--hm-bg-elevated)]"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={storage.getOptimizedImageUrl(a, 'avatar')}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </span>
                              ))}
                            </div>
                            {moreCount > 0 && (
                              <span className="ml-1.5 text-[12px] font-medium text-[var(--hm-fg-muted)]">
                                +{moreCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <h1 className="mt-1.5 line-clamp-2 text-[20px] font-bold leading-tight text-[var(--hm-fg-primary)] sm:text-[24px]">
                        {project.title}
                      </h1>
                    </div>

                    {/* Ring + edit - top-right of the identity column */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <ProgressRing value={project.progress} />
                      {!isPro && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditProject(true)}
                          leftIcon={<Pencil />}
                          aria-label={t('common.edit')}
                        >
                          <span className="hidden sm:inline">
                            {t('common.edit')}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Location + meta - full width beneath the title */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--hm-fg-secondary)]">
                    {project.location && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-[var(--hm-brand-500)]" />
                        <span className="min-w-0">{project.location}</span>
                      </span>
                    )}
                    {!!project.landArea && (
                      <span>
                        {project.landArea} {t('projects.sqm')}
                      </span>
                    )}
                    {!!project.floorCount && (
                      <span>
                        {t('projects.floorsCount', { count: project.floorCount })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* ---- Section tabs (always visible - the primary section nav) --- */}
        <div className="mt-6">
          <ProjectTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div key={activeTab} className="mt-6 animate-fade-in">
          {/* ===== OVERVIEW (two-column dashboard) ===== */}
          {activeTab === 'overview' &&
            (() => {
              const remaining = Math.max(0, planned - spent);
              const assignedPros = project.engagements
                .filter((e) => typeof e.assignedProId === 'object')
                .map((e) => ({
                  eng: e,
                  pro: e.assignedProId as { name?: string; avatar?: string },
                }));
              const metaCard =
                'rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 shadow-[0_1px_2px_rgba(17,16,13,0.04)]';
              const eyebrow =
                'text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]';
              // Card header with a soft brand icon tile + label.
              const cardHead = (icon: React.ReactNode, label: string) => (
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                    {icon}
                  </span>
                  <span className={eyebrow}>{label}</span>
                </span>
              );
              // Budget split for the segmented bar (labor vs materials).
              const budgetBase = planned > 0 ? planned : spent || 1;
              const laborPct = Math.min(
                100,
                Math.round((committed / budgetBase) * 100),
              );
              const matPct = Math.min(
                100 - laborPct,
                Math.round((materialsTotal / budgetBase) * 100),
              );
              const detailRow = (label: string, value?: React.ReactNode) =>
                value ? (
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--hm-border-subtle)] py-2 text-[13px] last:border-0">
                    <span className="text-[var(--hm-fg-muted)]">{label}</span>
                    <span className="min-w-0 truncate text-right font-medium text-[var(--hm-fg-primary)]">
                      {value}
                    </span>
                  </div>
                ) : null;

              // Plan-at-a-glance: ordered steps + a rough progress per step.
              const orderedSteps = (project.steps ?? [])
                .slice()
                .sort((a, b) => a.order - b.order);
              const stepProg = (sid: string) => {
                const engs = project.engagements.filter((e) => e.stepId === sid);
                if (!engs.length) return 0;
                const total = engs.reduce(
                  (a, e) =>
                    a +
                    (typeof e.workspaceProgress === 'number'
                      ? e.workspaceProgress
                      : e.status === 'completed'
                        ? 100
                        : e.status === 'in_progress'
                          ? 65
                          : e.status === 'hired'
                            ? 35
                            : e.status === 'invited' || e.status === 'open'
                              ? 10
                              : 0),
                  0,
                );
                return Math.round(total / engs.length);
              };
              // A brand-new project with nothing in it yet gets a guided start.
              const isFresh =
                orderedSteps.length === 0 &&
                (project.scopeItems?.length ?? 0) === 0 &&
                project.engagements.length === 0 &&
                (project.rooms?.length ?? 0) === 0 &&
                photoUrls.length === 0;

              // Needs-attention alerts: actionable items, each a jump to fix it.
              const alerts: {
                key: string;
                icon: React.ReactNode;
                label: string;
                tab: string;
              }[] = [];
              const draftRoles = project.engagements.filter(
                (e) => e.status === 'draft',
              ).length;
              if (draftRoles)
                alerts.push({
                  key: 'roles',
                  icon: <UserPlus className="h-4 w-4" />,
                  label: t('projects.alertDraftRoles', { count: draftRoles }),
                  tab: 'plan',
                });
              const noPrice = (project.scopeItems ?? []).filter(
                (s) => !s.unitPrice || s.unitPrice <= 0,
              ).length;
              if (noPrice)
                alerts.push({
                  key: 'price',
                  icon: <ListChecks className="h-4 w-4" />,
                  label: t('projects.alertNoPrice', { count: noPrice }),
                  tab: 'plan',
                });
              const pendingDocs = (project.documents ?? []).filter(
                (d) => d.approvalStatus === 'pending',
              ).length;
              if (isClient && pendingDocs)
                alerts.push({
                  key: 'docs',
                  icon: <FileText className="h-4 w-4" />,
                  label: t('projects.alertPendingDocs', { count: pendingDocs }),
                  tab: 'library',
                });

              return (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  {/* LEFT: content stream */}
                  <div className="flex min-w-0 flex-col gap-8">
                    {/* Needs attention - actionable alerts */}
                    {alerts.length > 0 && (
                      <section>
                        <div className="mb-3">
                          {sectionTitle(t('projects.needsAttentionTitle'))}
                        </div>
                        <Card variant="outlined">
                          <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                            {alerts.map((a) => (
                              <button
                                key={a.key}
                                type="button"
                                onClick={() => setActiveTab(a.tab)}
                                className="group flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hm-warning-50)] text-[var(--hm-warning-600)]">
                                  {a.icon}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                                  {a.label}
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-colors group-hover:text-[var(--hm-brand-500)]" />
                              </button>
                            ))}
                          </CardBody>
                        </Card>
                      </section>
                    )}

                    {/* Getting started - guided actions for a fresh project */}
                    {isFresh && (
                      <section>
                        <div className="mb-3">
                          {sectionTitle(t('projects.gettingStartedTitle'))}
                        </div>
                        <Card variant="outlined">
                          <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                            {[
                              {
                                icon: <ListChecks className="h-4 w-4" />,
                                label: t('projects.addStep'),
                                hint: t('projects.gsSteps'),
                                onClick: () => {
                                  setActiveTab('plan');
                                  setEditStep({ mode: 'create' });
                                },
                              },
                              {
                                icon: <Wrench className="h-4 w-4" />,
                                label: t('projects.addService'),
                                hint: t('projects.gsServices'),
                                onClick: () => {
                                  setActiveTab('plan');
                                  setServiceModal({});
                                },
                              },
                              {
                                icon: <FileSpreadsheet className="h-4 w-4" />,
                                label: t('projects.importExcel'),
                                hint: t('projects.gsImport'),
                                onClick: () => setShowImport(true),
                              },
                              {
                                icon: <Pencil className="h-4 w-4" />,
                                label: t('projects.editProject'),
                                hint: t('projects.gsDetails'),
                                onClick: () => setShowEditProject(true),
                              },
                            ].map((a, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={a.onClick}
                                className="group flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                                  {a.icon}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                                    {a.label}
                                  </span>
                                  <span className="block truncate text-[12px] text-[var(--hm-fg-muted)]">
                                    {a.hint}
                                  </span>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-colors group-hover:text-[var(--hm-brand-500)]" />
                              </button>
                            ))}
                          </CardBody>
                        </Card>
                      </section>
                    )}

                    {/* About / description */}
                    {project.description && (
                      <section>
                        <div className="mb-3">
                          {sectionTitle(t('common.description'))}
                        </div>
                        <Card variant="outlined">
                          <CardBody>
                            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--hm-fg-secondary)]">
                              {project.description}
                            </p>
                          </CardBody>
                        </Card>
                      </section>
                    )}

                    {/* Plan at a glance */}
                    {orderedSteps.length > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          {sectionTitle(t('projects.tabPlan'))}
                          <button
                            type="button"
                            onClick={() => setActiveTab('plan')}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80"
                          >
                            {t('common.viewAll')}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        <Card variant="outlined">
                          <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                            {orderedSteps.map((s, i) => {
                              const engs = project.engagements.filter(
                                (e) => e.stepId === s.id,
                              );
                              const svcs = (project.scopeItems ?? []).filter(
                                (x) => x.stepId === s.id,
                              );
                              const prog = stepProg(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setPlanStepFilter(s.id);
                                    setActiveTab('plan');
                                  }}
                                  className="flex flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex min-w-0 items-center gap-2 text-[14px] font-medium text-[var(--hm-fg-primary)]">
                                      <span
                                        aria-hidden
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{
                                          backgroundColor:
                                            s.color || 'var(--hm-brand-500)',
                                        }}
                                      />
                                      <span className="truncate">
                                        <span className="mr-1.5 font-mono text-[11px] text-[var(--hm-fg-muted)]">
                                          {String(i + 1).padStart(2, '0')}
                                        </span>
                                        {s.name}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--hm-fg-secondary)]">
                                      {prog}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${prog}%`,
                                        backgroundColor:
                                          s.color || 'var(--hm-brand-500)',
                                      }}
                                    />
                                  </div>
                                  <div className="text-[12px] text-[var(--hm-fg-muted)]">
                                    {`${engs.length} ${t('projects.peopleLabel')} · ${svcs.length} ${t('projects.servicesLabel')}`}
                                  </div>
                                </button>
                              );
                            })}
                          </CardBody>
                        </Card>
                      </section>
                    )}

                    {/* Spaces summary */}
                    {(project.rooms?.length ?? 0) > 0 && (
                      <section>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          {sectionTitle(t('projects.tabRooms'))}
                          <button
                            type="button"
                            onClick={() => setActiveTab('rooms')}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80"
                          >
                            {t('common.viewAll')}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        <Card variant="outlined">
                          <CardBody className="flex flex-col divide-y divide-[var(--hm-border-subtle)] p-0">
                            {(project.rooms ?? []).map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setActiveTab('rooms')}
                                className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
                              >
                                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                                  {r.name}
                                </span>
                                <span className="flex shrink-0 items-center gap-3 text-[12px] text-[var(--hm-fg-muted)]">
                                  {!!r.area && (
                                    <span className="tabular-nums">
                                      {r.area} {t('projects.sqm')}
                                    </span>
                                  )}
                                  {!!r.budget && (
                                    <span className="tabular-nums">
                                      {formatGel(r.budget)}
                                    </span>
                                  )}
                                  {(r.photos?.length ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-1 tabular-nums">
                                      <ImagePlus className="h-3.5 w-3.5" />
                                      {r.photos?.length}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </CardBody>
                        </Card>
                      </section>
                    )}

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
                      {cardHead(
                        <Wallet className="h-3.5 w-3.5" />,
                        t('projects.statBudgetLabel'),
                      )}
                      <div className="mt-2 text-[28px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                        {formatGel(budgetValue)}
                      </div>
                      {(committed > 0 || materialsTotal > 0) && (
                        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                          <div
                            className="h-full bg-[var(--hm-brand-500)]"
                            style={{ width: `${laborPct}%` }}
                          />
                          <div
                            className="h-full bg-[var(--hm-brand-500)]/45"
                            style={{ width: `${matPct}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-3 flex flex-col gap-2 text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[var(--hm-fg-muted)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--hm-brand-500)]" />
                            {t('projects.rollupLabor')}
                          </span>
                          <span className="font-medium tabular-nums text-[var(--hm-fg-primary)]">
                            {formatGel(committed)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[var(--hm-fg-muted)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--hm-brand-500)]/45" />
                            {t('projects.rollupMaterials')}
                          </span>
                          <span className="font-medium tabular-nums text-[var(--hm-fg-primary)]">
                            {formatGel(materialsTotal)}
                          </span>
                        </div>
                        {planned > 0 && (
                          <div className="flex items-center justify-between border-t border-[var(--hm-border-subtle)] pt-2">
                            <span className="inline-flex items-center gap-1.5 text-[var(--hm-fg-muted)]">
                              <span className="h-2 w-2 rounded-full bg-[var(--hm-bg-tertiary)] ring-1 ring-[var(--hm-border-strong)]" />
                              {t('projects.rollupRemaining')}
                            </span>
                            <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                              {formatGel(remaining)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team */}
                    <div className={metaCard}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        {cardHead(
                          <Users className="h-3.5 w-3.5" />,
                          `${t('projects.statTeamLabel')}${
                            project.engagements.length > 0
                              ? ` · ${project.engagements.length}`
                              : ''
                          }`,
                        )}
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
                      {cardHead(
                        <Building2 className="h-3.5 w-3.5" />,
                        t('projects.siteDetails'),
                      )}
                      <div className="mt-3 flex flex-col">
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
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--hm-fg-muted)]">
                            {svc.roomId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoomFilter(svc.roomId || null);
                                  setActiveTab('rooms');
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-[var(--hm-bg-tertiary)] px-2 py-0.5 font-medium text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-brand-500)]"
                              >
                                <MapPin className="h-3 w-3" />
                                {rn}
                              </button>
                            ) : (
                              <span>{t('projects.wholeObject')}</span>
                            )}
                            {svc.note ? <span>· {svc.note}</span> : null}
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
                      href={`/my-jobs/${jobId}/proposals`}
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
                      <Link href={`/my-jobs/${jobId}`} className={rowLink}>
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
                    className="border-b border-[var(--hm-border-subtle)] py-2.5 last:border-0"
                  >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
                      {isClient && proObj && (
                        <button
                          type="button"
                          onClick={() => toggleManage(eng)}
                          title={t('projects.manageHint')}
                          aria-pressed={!!eng.canManage}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                            eng.canManage
                              ? 'bg-[var(--hm-brand-500)] text-white'
                              : 'border border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]'
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {t('projects.roleManager')}
                        </button>
                      )}
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
                  {isClient &&
                    proObj &&
                    ['hired', 'in_progress', 'completed'].includes(
                      eng.status,
                    ) && (
                      <MilestonePaymentsPanel
                        projectId={projectId}
                        engagementId={eng.id}
                        role="client"
                        onChanged={load}
                      />
                    )}
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
                svcs: ScopeItem[],
                ds: ProjectDoc[],
                showDocs: boolean,
              ) => (
                <div className="flex flex-col gap-4">
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

              const stepActions = (s: ProjectStep) => {
                if (isPro) return null;
                const idx = steps.findIndex((x) => x.id === s.id);
                // Reorder only makes sense with >1 step and no active filter.
                const showReorder = !activeStepFilter && steps.length > 1;
                return (
                  <div className="flex items-center gap-1">
                    {showReorder && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveStep(s.id, -1)}
                          disabled={idx <= 0}
                          aria-label={t('common.back')}
                          className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)] disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(s.id, 1)}
                          disabled={idx >= steps.length - 1}
                          aria-label={t('common.back')}
                          className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)] disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </>
                    )}
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
                );
              };

              const docs = project.documents ?? [];
              // People come from services, so the same pro can back several
              // engagements. Show each person once (prefer the engagement that
              // carries manage rights, so the row reflects their access).
              const team = (() => {
                const seen = new Map<string, Engagement>();
                for (const e of project.engagements) {
                  const pro =
                    typeof e.assignedProId === 'object'
                      ? e.assignedProId
                      : null;
                  const proKey = pro ? pro._id || pro.id || '' : '';
                  const key = proKey ? `pro:${proKey}` : `eng:${e.id}`;
                  const existing = seen.get(key);
                  if (!existing || (!existing.canManage && e.canManage)) {
                    seen.set(key, e);
                  }
                }
                return [...seen.values()];
              })();
              const unassignedServices = services.filter(
                (s) => !s.stepId || !stepIds.has(s.stepId),
              );
              const isEmpty = steps.length === 0 && services.length === 0;

              // Header rail can filter the Plan to a single step.
              const activeStepFilter =
                planStepFilter && stepIds.has(planStepFilter)
                  ? planStepFilter
                  : null;
              const visibleSteps = activeStepFilter
                ? steps.filter((s) => s.id === activeStepFilter)
                : steps;
              const filteredStep = activeStepFilter
                ? steps.find((s) => s.id === activeStepFilter)
                : null;

              return (
                <div className="flex flex-col gap-4">
                  {!isPro && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-[var(--hm-fg-muted)]">
                        {steps.length > 0
                          ? t('projects.stepCount', { count: steps.length })
                          : t('projects.tabPlan')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowImport(true)}
                          leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                        >
                          {t('projects.importExcel')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setEditStep({ mode: 'create' })}
                          leftIcon={<Plus />}
                        >
                          {t('projects.addStep')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Project-level team roster - derived from the pros engaged
                      on services (no separate "add person" flow). */}
                  {team.length > 0 && (
                    <TableCard
                      title={t('projects.tabTeam')}
                      count={team.length}
                      action={
                        !isPro &&
                        project.engagements.length > team.length ? (
                          <button
                            type="button"
                            onClick={cleanupTeam}
                            disabled={cleaningTeam}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--hm-brand-500)] transition-opacity hover:opacity-80 disabled:opacity-50"
                          >
                            <Combine className="h-3.5 w-3.5" />
                            {t('projects.cleanupTeam')}
                          </button>
                        ) : undefined
                      }
                    >
                      <div>{team.map(personRow)}</div>
                    </TableCard>
                  )}

                  {/* Active filter banner (from the header step rail) */}
                  {filteredStep && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-brand-500)]/30 bg-[var(--hm-brand-500)]/[0.06] px-4 py-2.5">
                      <span className="inline-flex items-center gap-2 text-[13px] text-[var(--hm-fg-secondary)]">
                        <ListChecks className="h-4 w-4 text-[var(--hm-brand-500)]" />
                        <span className="font-semibold text-[var(--hm-fg-primary)]">
                          {filteredStep.name}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlanStepFilter(null)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80"
                      >
                        {t('common.viewAll')}
                      </button>
                    </div>
                  )}

                  {isEmpty ? (
                    friendlyEmpty(
                      <ListChecks className="h-5 w-5" />,
                      t('projects.tabPlan'),
                      t('projects.noStepsYet'),
                      t('projects.addStep'),
                      () => setEditStep({ mode: 'create' }),
                    )
                  ) : (
                    <>
                      {visibleSteps.map((s) => {
                        const svc = services.filter((x) => x.stepId === s.id);
                        const ds = docs.filter((d) => d.stepId === s.id);
                        const stepTotal = svc.reduce(
                          (a, x) => a + (x.quantity || 0) * (x.unitPrice || 0),
                          0,
                        );
                        return (
                          <TableCard
                            key={s.id}
                            title={s.name}
                            amount={
                              stepTotal > 0 ? formatGel(stepTotal) : undefined
                            }
                            action={stepActions(s)}
                          >
                            {stepBody(s.id, svc, ds, true)}
                          </TableCard>
                        );
                      })}

                      {!activeStepFilter && unassignedServices.length > 0 && (
                        <TableCard
                          title={t('projects.unassignedStep')}
                          amount={(() => {
                            const tot = unassignedServices.reduce(
                              (a, x) =>
                                a + (x.quantity || 0) * (x.unitPrice || 0),
                              0,
                            );
                            return tot > 0 ? formatGel(tot) : undefined;
                          })()}
                        >
                          {stepBody(undefined, unassignedServices, [], false)}
                        </TableCard>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

          {/* ===== SPACES (each space: services + products + photos) ===== */}
          {activeTab === 'rooms' &&
            (() => {
              const rooms = project.rooms ?? [];
              const services = project.scopeItems ?? [];
              const products = project.products ?? [];
              const steps = (project.steps ?? [])
                .slice()
                .sort((a, b) => a.order - b.order);
              const stepName = (id?: string) =>
                id ? steps.find((s) => s.id === id)?.name : undefined;

              const svcPro = (svc: ScopeItem) => {
                const eng = svc.engagementId
                  ? project.engagements.find((e) => e.id === svc.engagementId)
                  : undefined;
                if (!eng) return null;
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
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    {proObj?.name && (
                      <span className="truncate text-[12px] text-[var(--hm-fg-secondary)]">
                        {proObj.name}
                      </span>
                    )}
                    <Pill tone={tone}>{t(badge.labelKey)}</Pill>
                  </span>
                );
              };

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

              const serviceRows = (svcs: ScopeItem[]) => (
                <div>
                  {svcs.map((svc) => {
                    const total = (svc.quantity || 0) * (svc.unitPrice || 0);
                    const sn = stepName(svc.stepId);
                    return (
                      <div
                        key={svc.id}
                        className="flex flex-col gap-1.5 border-b border-[var(--hm-border-subtle)] py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                            {svc.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--hm-fg-muted)]">
                            {sn && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlanStepFilter(svc.stepId || null);
                                  setActiveTab('plan');
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-[var(--hm-bg-tertiary)] px-2 py-0.5 font-medium text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-brand-500)]"
                              >
                                <ListChecks className="h-3 w-3" />
                                {sn}
                              </button>
                            )}
                            {svc.quantity ? (
                              <span className="tabular-nums">
                                {svc.quantity} {svc.unitLabel || ''}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:justify-end">
                          {svcPro(svc)}
                          <span className="shrink-0 text-[14px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                            {total > 0 ? formatGel(total) : '—'}
                          </span>
                          {!isPro && (
                            <span className="flex items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setServiceModal({
                                    stepId: svc.stepId,
                                    item: svc,
                                  })
                                }
                                aria-label={t('common.edit')}
                                className="p-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoveServiceId(svc.id)}
                                aria-label={t('common.delete')}
                                className="p-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );

              const productRows = (prods: ProjectProduct[]) => (
                <div>
                  {prods.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 border-b border-[var(--hm-border-subtle)] py-2.5 last:border-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={storage.getOptimizedImageUrl(p.imageUrl, 'feedCard')}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-1 text-[14px] font-medium text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)]"
                          >
                            <span className="truncate">{p.name}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <div className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                            {p.name}
                          </div>
                        )}
                        <div className="text-[12px] text-[var(--hm-fg-muted)]">
                          {p.qty} × {formatGel(p.unitPrice || 0)}
                          {p.vendor ? ` · ${p.vendor}` : ''}
                        </div>
                      </div>
                      <span className="shrink-0 text-[14px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                        {formatGel((p.unitPrice || 0) * (p.qty || 0))}
                      </span>
                      {!isPro && (
                        <span className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => setProductModal({ item: p })}
                            aria-label={t('common.edit')}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveProductId(p.id)}
                            aria-label={t('common.delete')}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );

              const photoBlock = (room: Room) => (
                <div className="border-t border-[var(--hm-border-subtle)] pt-3 first:border-0 first:pt-0">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
                    {t('projects.visualsTitle')}
                    {(room.photos?.length ?? 0) > 0
                      ? ` · ${room.photos?.length}`
                      : ''}
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {(room.photos ?? []).map((url, i) => (
                      <div
                        key={url}
                        className="group/photo relative aspect-square overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openLightbox(room.photos ?? [], i)
                          }
                          className="absolute inset-0 h-full w-full"
                          aria-label={room.name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={storage.getOptimizedImageUrl(url, 'feedCard')}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover/photo:opacity-90"
                          />
                        </button>
                        {!isPro && (
                          <button
                            type="button"
                            onClick={() => removeRoomPhoto(room, url)}
                            aria-label={t('common.delete')}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover/photo:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!isPro && (
                      <button
                        type="button"
                        onClick={() => triggerRoomPhoto(room.id)}
                        disabled={roomPhotoUploading}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--hm-border-strong)] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] disabled:opacity-60"
                      >
                        <ImagePlus className="h-4 w-4" />
                        <span className="text-[10px] font-medium">
                          {t('projects.addPhoto')}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );

              const spaceActions = (room: Room) =>
                !isPro ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSpaceModal({ space: room })}
                      aria-label={t('common.edit')}
                      className="p-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveSpaceId(room.id)}
                      aria-label={t('common.delete')}
                      className="p-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null;

              const sumServices = (list: ScopeItem[]) =>
                list.reduce(
                  (a, s) => a + (s.quantity || 0) * (s.unitPrice || 0),
                  0,
                );
              const sumProducts = (list: ProjectProduct[]) =>
                list.reduce((a, p) => a + (p.unitPrice || 0) * (p.qty || 0), 0);

              const fileTile = (d: ProjectDoc) => {
                const img = looksLikeImage(d.url, d.fileType);
                const cmt = d.comments?.length ?? 0;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setReviewDoc(d)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] text-left"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storage.getOptimizedImageUrl(d.url, 'feedCard')}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[var(--hm-fg-muted)]">
                        <FileText className="h-6 w-6" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-1.5 pb-1 pt-4">
                      <span className="block truncate text-[10px] font-medium text-white">
                        {d.name}
                      </span>
                    </span>
                    {d.approvalStatus && d.approvalStatus !== 'none' && (
                      <span
                        className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        style={{
                          backgroundColor:
                            d.approvalStatus === 'approved'
                              ? 'var(--hm-success-500)'
                              : d.approvalStatus === 'changes_requested'
                                ? 'var(--hm-warning-500)'
                                : 'var(--hm-info-500)',
                        }}
                      />
                    )}
                    {cmt > 0 && (
                      <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hm-brand-500)] px-1 text-[10px] font-bold text-white">
                        {cmt}
                      </span>
                    )}
                  </button>
                );
              };

              const spaceCard = (room: Room) => {
                const svcs = services.filter((s) => s.roomId === room.id);
                const prods = products.filter((p) => p.roomId === room.id);
                const total = sumServices(svcs) + sumProducts(prods);
                const roomDocs = (project.documents ?? []).filter(
                  (d) => d.roomId === room.id,
                );
                const groupedDocs = (() => {
                  const m = new Map<string, ProjectDoc[]>();
                  roomDocs.forEach((d) => {
                    const g = d.group || t('projects.filesLabel');
                    if (!m.has(g)) m.set(g, []);
                    m.get(g)!.push(d);
                  });
                  return [...m.entries()];
                })();
                return (
                  <TableCard
                    key={room.id}
                    title={room.name}
                    amount={total > 0 ? formatGel(total) : undefined}
                    action={spaceActions(room)}
                  >
                    <div className="-mt-1 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--hm-fg-muted)]">
                      {!!room.area && (
                        <span>
                          {t('projects.floorAreaLabel')}: {room.area}{' '}
                          {t('projects.sqm')}
                        </span>
                      )}
                      {!!room.wallArea && (
                        <span>
                          {t('projects.wallAreaLabel')}: {room.wallArea}{' '}
                          {t('projects.sqm')}
                        </span>
                      )}
                      {!!room.budget && <span>{formatGel(room.budget)}</span>}
                    </div>
                    <div className="flex flex-col gap-4">
                      {photoBlock(room)}
                      <Section
                        label={t('projects.servicesLabel')}
                        count={svcs.length}
                        addLabel={t('projects.addService')}
                        onAdd={() => setServiceModal({ roomId: room.id })}
                        empty={t('projects.noServicesInStep')}
                      >
                        {serviceRows(svcs)}
                      </Section>
                      <Section
                        label={t('projects.productsLabel')}
                        count={prods.length}
                        addLabel={t('projects.addProduct')}
                        onAdd={() => setProductModal({ roomId: room.id })}
                        empty={t('projects.shopEmpty')}
                      >
                        {productRows(prods)}
                      </Section>

                      {/* Custom file groups (renders, drawings…) */}
                      <div className="border-t border-[var(--hm-border-subtle)] pt-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
                            {t('projects.filesLabel')}
                            {roomDocs.length > 0
                              ? ` · ${roomDocs.length}`
                              : ''}
                          </span>
                          {!isPro && (
                            <button
                              type="button"
                              onClick={() => setFilesModal({ roomId: room.id })}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
                            >
                              <Plus className="h-3 w-3" />
                              {t('projects.addFiles')}
                            </button>
                          )}
                        </div>
                        {roomDocs.length === 0 ? (
                          <p className="py-1 text-[13px] text-[var(--hm-fg-muted)]">
                            {t('projects.noDocsInStep')}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {groupedDocs.map(([label, ds]) => (
                              <div key={label}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                                    {label}
                                  </span>
                                  {!isPro && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFilesModal({
                                          roomId: room.id,
                                          group: label,
                                        })
                                      }
                                      aria-label={t('projects.addFiles')}
                                      className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                  {ds.map((d) => fileTile(d))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCard>
                );
              };

              const objectSvcs = services.filter((s) => !s.roomId);
              const objectProds = products.filter((p) => !p.roomId);
              const activeRoomFilter =
                roomFilter && rooms.some((r) => r.id === roomFilter)
                  ? roomFilter
                  : null;
              const visibleRooms = activeRoomFilter
                ? rooms.filter((r) => r.id === activeRoomFilter)
                : rooms;
              const filteredRoom = activeRoomFilter
                ? rooms.find((r) => r.id === activeRoomFilter)
                : null;

              return (
                <div className="flex flex-col gap-4">
                  {!isPro && (
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        onClick={() => setSpaceModal({})}
                        leftIcon={<Plus />}
                      >
                        {t('projects.roomAdd')}
                      </Button>
                    </div>
                  )}

                  {filteredRoom && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-brand-500)]/30 bg-[var(--hm-brand-500)]/[0.06] px-4 py-2.5">
                      <span className="inline-flex items-center gap-2 text-[13px]">
                        <span className="font-semibold text-[var(--hm-fg-primary)]">
                          {filteredRoom.name}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setRoomFilter(null)}
                        className="text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80"
                      >
                        {t('common.viewAll')}
                      </button>
                    </div>
                  )}

                  {rooms.length === 0 ? (
                    friendlyEmpty(
                      <ImagePlus className="h-5 w-5" />,
                      t('projects.tabRooms'),
                      t('projects.roomEmpty'),
                      t('projects.roomAdd'),
                      () => setSpaceModal({}),
                    )
                  ) : (
                    <>
                      {visibleRooms.map(spaceCard)}

                      {!activeRoomFilter &&
                        (objectSvcs.length > 0 || objectProds.length > 0) && (
                          <TableCard
                            title={t('projects.wholeObject')}
                            amount={(() => {
                              const tot =
                                sumServices(objectSvcs) +
                                sumProducts(objectProds);
                              return tot > 0 ? formatGel(tot) : undefined;
                            })()}
                          >
                            <div className="flex flex-col gap-4">
                              <Section
                                label={t('projects.servicesLabel')}
                                count={objectSvcs.length}
                                addLabel={t('projects.addService')}
                                onAdd={() => setServiceModal({})}
                                empty={t('projects.noServicesInStep')}
                              >
                                {serviceRows(objectSvcs)}
                              </Section>
                              <Section
                                label={t('projects.productsLabel')}
                                count={objectProds.length}
                                addLabel={t('projects.addProduct')}
                                onAdd={() => setProductModal({})}
                                empty={t('projects.shopEmpty')}
                              >
                                {productRows(objectProds)}
                              </Section>
                            </div>
                          </TableCard>
                        )}
                    </>
                  )}

                </div>
              );
            })()}

          {/* ===== MATERIALS / SELECTIONS ===== */}
          {activeTab === 'materials' && (
            <ProjectSelections
              projectId={projectId}
              selections={project.selections ?? []}
              rooms={project.rooms ?? []}
              canManage={!isPro}
              canReview={!isPro}
              onChanged={load}
            />
          )}

          {/* ===== MOODBOARD ===== */}
          {activeTab === 'moodboard' && (
            <ProjectMoodboard
              projectId={projectId}
              items={project.moodboardItems ?? []}
              canManage={!isPro}
              onChanged={load}
            />
          )}

          {/* ===== SHOPPING / PURCHASES (all items across spaces + project) ===== */}
          {activeTab === 'shopping' && (
            <ProjectShopping
              projectId={projectId}
              products={project.products ?? []}
              log={project.productLog ?? []}
              rooms={project.rooms ?? []}
              canManage={!isPro}
              canApprove={isClient}
              onChanged={load}
            />
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
            </div>
          )}
        </div>
          </div>
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
          showSchedule={picker.purpose === 'invite'}
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

      {serviceModal && (
        <AddServiceModal
          isOpen={!!serviceModal}
          onClose={() => setServiceModal(null)}
          projectId={projectId}
          stepId={serviceModal.stepId}
          roomId={serviceModal.roomId}
          rooms={project.rooms ?? []}
          steps={project.steps ?? []}
          item={serviceModal.item}
          onSaved={load}
        />
      )}

      {showImport && (
        <ImportEstimateModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          projectId={projectId}
          onImported={load}
        />
      )}

      {spaceModal && (
        <SpaceModal
          isOpen={!!spaceModal}
          onClose={() => setSpaceModal(null)}
          projectId={projectId}
          space={spaceModal.space}
          onSaved={load}
        />
      )}

      {filesModal && (
        <AddFilesModal
          isOpen={!!filesModal}
          onClose={() => setFilesModal(null)}
          projectId={projectId}
          roomId={filesModal.roomId}
          group={filesModal.group}
          onSaved={load}
        />
      )}

      {reviewDoc && (
        <DocumentReviewModal
          isOpen={!!reviewDoc}
          onClose={() => setReviewDoc(null)}
          projectId={projectId}
          // Keep the open doc in sync with fresh data after each action.
          doc={
            (project.documents ?? []).find((d) => d.id === reviewDoc.id) ||
            reviewDoc
          }
          canEdit={!isPro}
          isClient={isClient}
          onChanged={load}
        />
      )}

      {productModal && (
        <AddProductModal
          isOpen={!!productModal}
          onClose={() => setProductModal(null)}
          projectId={projectId}
          rooms={project.rooms ?? []}
          steps={project.steps ?? []}
          categories={Array.from(
            new Set(
              (project.products ?? [])
                .map((p) => (p.category || '').trim())
                .filter(Boolean),
            ),
          ).sort((a, b) => a.localeCompare(b))}
          roomId={productModal.roomId}
          item={productModal.item}
          onSaved={load}
        />
      )}

      {removeSpaceId && (
        <ConfirmModal
          isOpen={!!removeSpaceId}
          onClose={() => setRemoveSpaceId(null)}
          onConfirm={removeSpace}
          variant="danger"
          title={t('common.delete')}
          description={t('projects.removeConfirm')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
        />
      )}

      {removeProductId && (
        <ConfirmModal
          isOpen={!!removeProductId}
          onClose={() => setRemoveProductId(null)}
          onConfirm={removeProduct}
          variant="danger"
          title={t('common.delete')}
          description={t('projects.removeConfirm')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
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
          canDelete={isClient}
          onDeleted={() => router.push('/projects')}
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
