'use client';

import Avatar from '@/components/common/Avatar';
import { features } from '@/config/features';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { formatDateShort, formatTimeAgoCompact } from '@/utils/dateUtils';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  DoorOpen,
  FileText,
  MapPin,
  Palette,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

// Minimal subset of the dashboard payload the client view reads. The page
// passes its full `project` object, which is a superset of this.
interface ClientProject {
  title: string;
  location?: string;
  address?: string;
  status: string;
  progress: number;
  currentPhase?: string;
  photos?: string[];
  coverImage?: string;
  budgetMin?: number;
  budgetMax?: number;
  budget?: { planned: number; committed: number };
  cadastralId?: string;
  landArea?: number;
  floorCount?: number;
  propertyType?: string;
  phases?: { key: string; progress: number; roleCount: number }[];
  // The project's real, user-defined plan steps (ProjectStep). These - not the
  // generic design/permits/construction/finishing enum - are what this project
  // is actually broken into.
  steps?: { id: string; name: string; order?: number; color?: string }[];
  milestones?: {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
    sortOrder?: number;
  }[];
  rooms?: { id: string; name: string; photos?: string[] }[];
  engagements?: {
    id: string;
    roleLabel: string;
    assignedProId?: { name?: string; avatar?: string } | string;
    designApproval?: { status?: string };
  }[];
  selections?: {
    id: string;
    title: string;
    options?: { id: string }[];
    chosenOptionId?: string;
  }[];
  documents?: {
    id: string;
    name?: string;
    category?: string;
    approvalStatus?: string;
    url?: string;
    thumbnailUrl?: string;
  }[];
}

// The project activity feed (`GET /projects/:id/activity`) - same shape the
// full History tab reads. Cleaner + i18n-mapped, unlike the dashboard's raw
// tracking-event array.
interface ActivityEntry {
  _id: string;
  actorId?: { _id?: string; name?: string; avatar?: string } | null;
  type: string;
  targetLabel?: string;
  createdAt: string;
}

type L = { en: string; ka: string; ru: string };

// Human verb per activity type (mirror of ProjectHistory). Falls back to the
// target label / raw type if unmapped, so new backend types still render.
const ACTION: Record<string, L> = {
  'project.created': { en: 'created the project', ka: 'შექმნა პროექტი', ru: 'создал проект' },
  'project.updated': { en: 'updated the project', ka: 'დაარედაქტირა პროექტი', ru: 'изменил проект' },
  'project.status_changed': { en: 'changed the status', ka: 'შეცვალა სტატუსი', ru: 'изменил статус' },
  'room.added': { en: 'added a space', ka: 'დაამატა სივრცე', ru: 'добавил помещение' },
  'room.updated': { en: 'edited a space', ka: 'შეასწორა სივრცე', ru: 'изменил помещение' },
  'room.removed': { en: 'removed a space', ka: 'წაშალა სივრცე', ru: 'удалил помещение' },
  'product.added': { en: 'added a product', ka: 'დაამატა პროდუქტი', ru: 'добавил товар' },
  'product.updated': { en: 'edited a product', ka: 'შეასწორა პროდუქტი', ru: 'изменил товар' },
  'product.status_changed': { en: 'changed a product status', ka: 'შეცვალა პროდუქტის სტატუსი', ru: 'изменил статус товара' },
  'product.reviewed': { en: 'reviewed a product', ka: 'შეაფასა პროდუქტი', ru: 'проверил товар' },
  'product.removed': { en: 'removed a product', ka: 'წაშალა პროდუქტი', ru: 'удалил товар' },
  'step.added': { en: 'added a step', ka: 'დაამატა ეტაპი', ru: 'добавил этап' },
  'step.removed': { en: 'removed a step', ka: 'წაშალა ეტაპი', ru: 'удалил этап' },
};

interface MilestonePayment {
  id?: string;
  _id?: string;
  engagementId: string;
  label: string;
  amountMinor: number;
  roleLabel?: string;
  status: string;
}

// A pending thing the client must do. `primary` is the one-tap action;
// `secondary` (optional) jumps into the full view to add context.
interface NeedItem {
  id: string;
  icon: 'money' | 'design' | 'doc' | 'selection';
  label: string;
  sub?: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}

const money = (minor: number) =>
  `${Math.round(minor / 100).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;
const moneyMajor = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

interface Props {
  project: ClientProject;
  projectId: string;
  onSeeFullDetails: (tab?: string) => void;
  onChanged?: () => void | Promise<void>;
}

/**
 * The client (homeowner) lens on a project - now the primary surface. Instead
 * of hiding everything behind "See full details", it answers is-it-on-track,
 * what-do-I-need-to-do, what's-it-costing AND surfaces the read-only detail a
 * client actually returns for: upcoming dates, budget/payments, spaces, files,
 * site info, and a team activity feed. The full project-management tabs stay
 * available as an "advanced" escape hatch. Rendered only when viewerRole ===
 * 'client'.
 */
export default function ProjectClientView({
  project,
  projectId,
  onSeeFullDetails,
  onChanged,
}: Props) {
  const { t, pick, locale } = useLanguage();
  const toast = useToast();

  const [mps, setMps] = useState<MilestonePayment[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ActivityEntry[]>(`/projects/${projectId}/activity`)
      .then((r) => {
        if (!cancelled) setActivityEntries(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => {
        if (!cancelled) setActivityEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refetchMps = useCallback(() => {
    // Payments gated off until the payment provider is live - skip escrow so no
    // money actions (fund milestone, approve schedule) surface on prod.
    if (!features.payments) {
      setMps([]);
      return;
    }
    api
      .get<MilestonePayment[]>(`/milestone-payments/project/${projectId}`)
      .then((r) => setMps(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMps([]));
  }, [projectId]);
  useEffect(() => {
    refetchMps();
  }, [refetchMps]);

  const runMoney = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      toast.success(t('common.success'), t('projects.savedChanges'));
      refetchMps();
    } catch {
      toast.error(t('common.error'), t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const approvePlan = (engagementId: string) =>
    runMoney(() =>
      api.post('/milestone-payments/approve', { projectId, engagementId }),
    );

  const fund = async (id: string) => {
    setBusy(true);
    try {
      const r = await api.post<{ redirectUrl?: string }>(
        `/milestone-payments/${id}/fund`,
      );
      const url = r.data?.redirectUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      refetchMps();
    } catch {
      toast.error(t('common.error'), t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const confirmWork = (id: string) =>
    runMoney(() => api.post(`/milestone-payments/${id}/confirm`));

  // Design + document approvals mutate the project doc, so refresh it (not mps)
  // after a one-tap approve so the "needs you" list clears.
  const approveDesign = async (engagementId: string) => {
    setBusy(true);
    try {
      await api.patch(
        `/projects/${projectId}/engagements/${engagementId}/design-review`,
        { status: 'approved' },
      );
      toast.success(t('common.success'), t('projects.savedChanges'));
      await onChanged?.();
    } catch {
      toast.error(t('common.error'), t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const approveDoc = async (docId: string) => {
    setBusy(true);
    try {
      await api.patch(`/projects/${projectId}/documents/${docId}/approval`, {
        status: 'approved',
      });
      toast.success(t('common.success'), t('projects.savedChanges'));
      await onChanged?.();
    } catch {
      toast.error(t('common.error'), t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const progress = Math.max(0, Math.min(100, Math.round(project.progress || 0)));
  const activeMilestone = (project.milestones || []).find(
    (m) => m.status === 'active',
  );
  // What's happening now = the active milestone's title. We deliberately do NOT
  // fall back to the generic design/permits/... enum - it isn't this project's
  // real plan, so showing it read as a fake step. No milestone -> "getting
  // started", which is honest for a project that hasn't kicked off.
  const focusText = activeMilestone?.title;

  const statusTone: 'neutral' | 'live' | 'success' =
    project.status === 'completed'
      ? 'success'
      : project.status === 'in_progress' || project.status === 'active'
        ? 'live'
        : 'neutral';
  const statusLabel =
    project.status === 'completed'
      ? t('projects.statusCompleted')
      : project.status === 'in_progress' || project.status === 'active'
        ? t('projects.statusInProgress')
        : project.status === 'cancelled'
          ? t('projects.statusCancelled')
          : t('projects.statusDraft');

  // ---- "Needs you" - every pending client decision in one place ----
  const needs: NeedItem[] = [];

  // Money first - highest-stakes, most likely to stall a project if missed.
  const proposedEngagements = new Map<string, string>();
  mps.forEach((m) => {
    if (m.status === 'proposed') {
      proposedEngagements.set(m.engagementId, m.roleLabel || '');
    }
  });
  proposedEngagements.forEach((roleLabel, engagementId) => {
    needs.push({
      id: `mp-approve-${engagementId}`,
      icon: 'money',
      label: t('projects.client.needApprovePlan', {
        role: roleLabel || t('projects.client.aPro'),
      }),
      sub: t('projects.client.requestedBy', {
        role: roleLabel || t('projects.client.aPro'),
      }),
      primary: {
        label: t('projects.client.approvePlanShort'),
        onClick: () => !busy && approvePlan(engagementId),
      },
    });
  });
  mps.forEach((m) => {
    const id = m.id || m._id || '';
    if (m.status === 'approved') {
      needs.push({
        id: `mp-fund-${id}`,
        icon: 'money',
        label: m.label,
        sub: money(m.amountMinor),
        primary: {
          label: t('projects.client.fundNow'),
          onClick: () => !busy && fund(id),
        },
      });
    } else if (m.status === 'submitted') {
      needs.push({
        id: `mp-confirm-${id}`,
        icon: 'money',
        label: m.label,
        sub: t('projects.client.workSubmitted'),
        primary: {
          label: t('projects.client.confirmDone'),
          onClick: () => !busy && confirmWork(id),
        },
      });
    }
  });

  // Design approvals - one-tap approve, or jump to the team tab to add a note.
  (project.engagements || []).forEach((e) => {
    if (e.designApproval?.status === 'pending') {
      needs.push({
        id: `eng-${e.id}`,
        icon: 'design',
        label: t('projects.client.needApproveDesign', { role: e.roleLabel }),
        sub: t('projects.client.tapToReview'),
        primary: {
          label: t('projects.client.approve'),
          onClick: () => !busy && approveDesign(e.id),
        },
        secondary: {
          label: t('projects.client.review'),
          onClick: () => onSeeFullDetails('team'),
        },
      });
    }
  });

  // Document approvals - one-tap approve, or jump to the library to review.
  (project.documents || []).forEach((d) => {
    if (d.approvalStatus === 'pending') {
      needs.push({
        id: `doc-${d.id}`,
        icon: 'doc',
        label: t('projects.client.needApprove', {
          item: d.name || t('projects.client.aDocument'),
        }),
        sub: t('projects.client.tapToReview'),
        primary: {
          label: t('projects.client.approve'),
          onClick: () => !busy && approveDoc(d.id),
        },
        secondary: {
          label: t('projects.client.review'),
          onClick: () => onSeeFullDetails('library'),
        },
      });
    }
  });

  // Material selections live in the full view (the option picker is there).
  (project.selections || []).forEach((s) => {
    if ((s.options?.length ?? 0) > 0 && !s.chosenOptionId) {
      needs.push({
        id: `sel-${s.id}`,
        icon: 'selection',
        label: t('projects.client.needChoose', { item: s.title }),
        sub: t('projects.client.tapToReview'),
        primary: {
          label: t('projects.client.choose'),
          onClick: () => onSeeFullDetails('materials'),
        },
      });
    }
  });

  // First run: the project hasn't really launched - no team and no plan yet.
  // The "all set" card would misread here ("all set" implies work is happening),
  // so a fresh client gets pointed at the first moves instead of a green check.
  // The steps below are filtered to what's still missing, so the block reads as
  // a shrinking checklist and disappears once the basics are in place.
  const startSteps = [
    {
      id: 'team',
      label: t('projects.client.stepBuildTeam'),
      sub: t('projects.client.stepBuildTeamSub'),
      tab: 'team',
      done: (project.engagements || []).length > 0,
    },
    {
      id: 'spaces',
      label: t('projects.client.stepAddSpaces'),
      sub: t('projects.client.stepAddSpacesSub'),
      tab: 'rooms',
      done: (project.rooms || []).length > 0,
    },
    {
      id: 'files',
      label: t('projects.client.stepShareFiles'),
      sub: t('projects.client.stepShareFilesSub'),
      tab: 'library',
      done: (project.documents || []).length > 0,
    },
  ].filter((s) => !s.done);

  const isFirstRun =
    needs.length === 0 &&
    (project.engagements || []).length === 0 &&
    (project.milestones || []).length === 0 &&
    startSteps.length > 0;

  // Gallery photos. The cover already leads the hero as its own band, so keep
  // it out of this strip - otherwise the same shot appears twice on one screen.
  const photos = (project.photos || [])
    .filter(Boolean)
    .filter((url) => url !== project.coverImage)
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 5);
  const team = (project.engagements || [])
    .map((e) =>
      typeof e.assignedProId === 'object' ? e.assignedProId : undefined,
    )
    .filter((p): p is { name?: string; avatar?: string } => !!p);

  const agreed =
    project.budget?.planned || project.budgetMax || project.budgetMin || 0;
  const committed = project.budget?.committed || 0;

  // Paid-so-far / remaining from the milestone schedule - the homeowner's real
  // "what have I paid" question, in actual money-moved terms.
  const PAID_STATUSES = ['funded', 'submitted', 'confirmed', 'released'];
  const SCHEDULED_STATUSES = ['proposed', 'approved', ...PAID_STATUSES];
  const scheduledMinor = mps
    .filter((m) => SCHEDULED_STATUSES.includes(m.status))
    .reduce((s, m) => s + (m.amountMinor || 0), 0);
  const paidMinor = mps
    .filter((m) => PAID_STATUSES.includes(m.status))
    .reduce((s, m) => s + (m.amountMinor || 0), 0);
  const paidPct =
    scheduledMinor > 0 ? Math.round((paidMinor / scheduledMinor) * 100) : 0;

  // Upcoming dates - future/active milestones with a due date, soonest first.
  const upcoming = (project.milestones || [])
    .filter((m) => m.status !== 'completed' && m.status !== 'cancelled')
    .slice()
    .sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (da !== db) return da - db;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 4);

  const rooms = (project.rooms || []).slice(0, 6);
  const docs = (project.documents || []).slice(0, 5);
  const activity = activityEntries.slice(0, 5);

  const site: { label: string; value: string }[] = [];
  const addr = project.address || project.location;
  if (addr) site.push({ label: t('projects.client.address'), value: addr });
  if (project.propertyType)
    site.push({
      label: t('projects.client.propertyType'),
      value: project.propertyType,
    });
  if (project.landArea)
    site.push({
      label: t('projects.client.area'),
      value: t('projects.client.sqm', { n: project.landArea }),
    });
  if (project.floorCount)
    site.push({
      label: t('projects.client.floors'),
      value: String(project.floorCount),
    });
  if (project.cadastralId)
    site.push({
      label: t('projects.client.cadastral'),
      value: project.cadastralId,
    });

  const docStatusLabel = (s?: string) =>
    s === 'approved'
      ? t('projects.client.approved')
      : s === 'changes_requested'
        ? t('projects.client.changesRequested')
        : s === 'pending'
          ? t('projects.client.pendingReview')
          : '';

  // Section eyebrow with optional count + optional "manage" chip (the canonical
  // page-action affordance - hairline-bordered mono chip, per design system v5).
  const SectionHead = ({
    label,
    count,
    action,
  }: {
    label: string;
    count?: number;
    action?: { label: string; tab?: string };
  }) => (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-fg-muted)]">
        {label}
        {typeof count === 'number' && count > 0 && (
          <span className="tabular-nums text-[var(--hm-fg-muted)]/70">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </p>
      {action && (
        <button
          type="button"
          onClick={() => onSeeFullDetails(action.tab)}
          className="-my-1.5 shrink-0 rounded-md border border-[var(--hm-border-subtle)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  const needIcon = (icon: NeedItem['icon']) => {
    const cls = 'h-4 w-4 shrink-0';
    const style = { color: 'var(--hm-fg-secondary)' };
    if (icon === 'money') return <Wallet className={cls} style={style} />;
    if (icon === 'design') return <Palette className={cls} style={style} />;
    if (icon === 'doc') return <FileText className={cls} style={style} />;
    return <ClipboardCheck className={cls} style={style} />;
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 pb-24 pt-5 sm:px-6">
      {/* ---- Status hero: cover + progress rail + current focus. The one
          elevated "act-now" surface; the read-only stream below sits flat on
          the page ground so the eye can tell "act" from "read". ---- */}
      <section
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'var(--hm-bg-elevated)',
          border: '1px solid var(--hm-border-subtle)',
        }}
      >
        {/* Cover photo owns the top when there is one (photos carry the page) -
            title + status sit below it, editorial P1 style. */}
        {project.coverImage && (
          <div
            className="relative aspect-[16/6] w-full"
            style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
          >
            <Image
              src={storage.getOptimizedImageUrl(project.coverImage, 'feedCard')}
              alt=""
              fill
              sizes="(min-width: 900px) 860px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color:
                statusTone === 'success'
                  ? 'var(--hm-success-500)'
                  : statusTone === 'live'
                    ? 'var(--hm-brand-500)'
                    : 'var(--hm-fg-muted)',
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  statusTone === 'success'
                    ? 'var(--hm-success-500)'
                    : statusTone === 'live'
                      ? 'var(--hm-brand-500)'
                      : 'var(--hm-n-300)',
              }}
            />
            {statusLabel}
          </span>
          <h1
            className="mt-1 truncate text-[19px] font-bold tracking-[-0.01em] sm:text-[22px]"
            style={{ color: 'var(--hm-fg-primary)' }}
          >
            {project.title}
          </h1>
          <p
            className="mt-0.5 text-[13px]"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            {focusText
              ? t('projects.client.currently', { focus: focusText })
              : t('projects.client.gettingStarted')}
          </p>
          {project.location && (
            <p
              className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
              style={{ color: 'var(--hm-fg-muted)' }}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {project.location}
            </p>
          )}

          {/* Progress as a phase-tick rail (P5), not a dashboard donut. */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-fg-muted)]">
                {t('projects.client.progress')}
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--hm-fg-secondary)]">
                {progress}%
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--hm-brand-500)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* The project's real plan steps (user-defined). Renders nothing when
              no steps exist yet - we never fabricate generic phases. */}
          {(() => {
            const steps = [...(project.steps || [])].sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0),
            );
            if (steps.length === 0) return null;
            return (
              <div className="scrollbar-hide -mx-1 mt-4 flex items-center gap-x-4 gap-y-2 overflow-x-auto px-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[var(--hm-fg-muted)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: s.color || 'var(--hm-n-300)' }}
                    />
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--hm-fg-secondary)' }}
                    >
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ---- First run: guided setup ---- */}
      {isFirstRun ? (
        <section className="mt-6">
          <SectionHead label={t('projects.client.getStarted')} />
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--hm-bg-elevated)',
              border: '1px solid var(--hm-border-subtle)',
            }}
          >
            <p
              className="px-5 pt-4 text-[14px] italic"
              style={{ color: 'var(--hm-fg-secondary)' }}
            >
              {t('projects.client.getStartedIntro')}
            </p>
            <div className="mt-2 px-2 pb-2">
              {startSteps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSeeFullDetails(s.tab)}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                >
                  <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-[var(--hm-fg-muted)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-medium"
                      style={{ color: 'var(--hm-fg-primary)' }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      {s.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
      /* ---- Needs you ---- */
      <section className="mt-6">
        <SectionHead label={t('projects.client.needsYou')} count={needs.length} />
        {needs.length === 0 ? (
          <p
            className="flex items-center gap-2 text-[13px] font-medium"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            <CheckCircle2
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--hm-success-500)' }}
            />
            {t('projects.client.allSet')}
          </p>
        ) : (
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--hm-bg-elevated)',
              border: '1px solid var(--hm-border-subtle)',
            }}
          >
            {needs.map((a, i) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3.5"
                style={{
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                {needIcon(a.icon)}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-medium"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {a.label}
                  </p>
                  {a.sub && (
                    <p
                      className="mt-0.5 truncate text-[11px]"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    >
                      {a.sub}
                    </p>
                  )}
                </div>
                </div>
                <div className="flex w-full shrink-0 items-center gap-2 pl-7 sm:w-auto sm:pl-0">
                  {a.secondary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={busy}
                      onClick={a.secondary.onClick}
                    >
                      {a.secondary.label}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={busy}
                    onClick={a.primary.onClick}
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                  >
                    {a.primary.label}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {/* Divider: everything below is the read-only reference stream (things to
          know), split from the act-now zone above (things to do). Generous gap
          marks it as a major transition (editorial P9). */}
      <div
        className="mt-14 mb-3 h-px sm:mt-16"
        style={{ backgroundColor: 'var(--hm-border-subtle)' }}
      />

      {/* ---- Upcoming dates ---- */}
      {upcoming.length > 0 && (
        <section className="mt-8">
          <SectionHead
            label={t('projects.client.upcoming')}
            count={upcoming.length}
            action={{ label: t('projects.client.viewAll'), tab: 'timeline' }}
          />
          <div className="flex flex-col">
            {upcoming.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSeeFullDetails('timeline')}
                className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                style={{
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                }}
              >
                <div className="w-[92px] shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--hm-fg-muted)]">
                    {m.dueDate
                      ? formatDateShort(m.dueDate, locale)
                      : t('projects.client.noDate')}
                  </span>
                </div>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      m.status === 'active'
                        ? 'var(--hm-brand-500)'
                        : 'var(--hm-n-300)',
                  }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-[13px] font-medium"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  {m.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- Budget & payments ---- */}
      <section className="mt-8">
        <SectionHead
          label={t('projects.client.budgetPayments')}
          action={
            features.payments
              ? { label: t('projects.client.manage'), tab: 'timeline' }
              : undefined
          }
        />
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 sm:gap-x-10">
            <div>
              <p className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
                {t('projects.client.planned')}
              </p>
              {agreed > 0 ? (
                <p
                  className="mt-1 text-[26px] font-bold tabular-nums tracking-[-0.02em]"
                  style={{ color: 'var(--hm-brand-500)' }}
                >
                  {moneyMajor(agreed)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onSeeFullDetails()}
                  className="mt-1 text-[15px] font-medium underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--hm-brand-500)]"
                  style={{ color: 'var(--hm-fg-muted)' }}
                >
                  {t('projects.client.setBudget')}
                </button>
              )}
            </div>
            {scheduledMinor > 0 ? (
              <>
                <div>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    {t('projects.client.paidLabel')}
                  </p>
                  <p
                    className="mt-1 text-[18px] font-bold tabular-nums"
                    style={{ color: 'var(--hm-success-500)' }}
                  >
                    {money(paidMinor)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    {t('projects.client.remaining')}
                  </p>
                  <p
                    className="mt-1 text-[18px] font-bold tabular-nums"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {money(Math.max(0, scheduledMinor - paidMinor))}
                  </p>
                </div>
              </>
            ) : committed > 0 ? (
              <div>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--hm-fg-muted)' }}
                >
                  {t('projects.client.committedLabel')}
                </p>
                <p
                  className="mt-1 text-[18px] font-bold tabular-nums"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  {moneyMajor(committed)}
                </p>
              </div>
            ) : null}
          </div>
          {scheduledMinor > 0 && (
            <div className="mt-4">
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${paidPct}%`,
                    backgroundColor: 'var(--hm-success-500)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <p
                className="mt-1.5 text-[11px]"
                style={{ color: 'var(--hm-fg-muted)' }}
              >
                {t('projects.client.paidOf', {
                  paid: money(paidMinor),
                  total: money(scheduledMinor),
                })}
              </p>
            </div>
          )}
      </section>

      {/* ---- Latest photos ---- */}
      {photos.length > 0 && (
        <section className="mt-8">
          <SectionHead label={t('projects.client.latestPhotos')} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                aria-label={t('projects.client.latestPhotos')}
                onClick={() => onSeeFullDetails('overview')}
                className="relative aspect-square overflow-hidden rounded-xl"
                style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
              >
                <Image
                  src={storage.getOptimizedImageUrl(url, 'feedCard')}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 160px, 33vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- Spaces ---- */}
      {rooms.length > 0 && (
        <section className="mt-8">
          <SectionHead
            label={t('projects.client.spaces')}
            count={(project.rooms || []).length}
            action={{ label: t('projects.client.viewAll'), tab: 'rooms' }}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rooms.map((r) => {
              const cover = (r.photos || []).filter(Boolean)[0];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSeeFullDetails('rooms')}
                  className="group text-left"
                >
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-xl"
                    style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
                  >
                    {cover ? (
                      <Image
                        src={storage.getOptimizedImageUrl(cover, 'feedCard')}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 280px, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[var(--hm-fg-muted)]">
                        <DoorOpen className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <p
                    className="truncate pt-1.5 text-[12px] font-medium"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {r.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Files ---- */}
      {docs.length > 0 && (
        <section className="mt-8">
          <SectionHead
            label={t('projects.client.files')}
            count={(project.documents || []).length}
            action={{ label: t('projects.client.viewAll'), tab: 'library' }}
          />
          <div className="flex flex-col">
            {docs.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSeeFullDetails('library')}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                style={{
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                }}
              >
                <FileText className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)]" />
                <span
                  className="min-w-0 flex-1 truncate text-[13px]"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  {d.name || t('projects.client.aDocument')}
                </span>
                {docStatusLabel(d.approvalStatus) && (
                  <span
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em]"
                    style={{
                      color:
                        d.approvalStatus === 'approved'
                          ? 'var(--hm-success-500)'
                          : d.approvalStatus === 'pending'
                            ? 'var(--hm-brand-500)'
                            : 'var(--hm-fg-muted)',
                    }}
                  >
                    {docStatusLabel(d.approvalStatus)}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- Team ---- */}
      <section className="mt-8">
        <SectionHead
          label={t('projects.client.yourTeam')}
          count={team.length || undefined}
          action={{ label: t('projects.client.viewAll'), tab: 'team' }}
        />
        {team.length === 0 ? (
          <p
            className="text-[13px]"
            style={{ color: 'var(--hm-fg-secondary)' }}
          >
            {t('projects.client.noTeamYet')}
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {team.slice(0, 6).map((p, i) => (
                <Avatar
                  key={i}
                  src={p.avatar}
                  name={p.name || ''}
                  size="sm"
                  className="h-8 w-8 ring-2 ring-[var(--hm-bg-page)]"
                />
              ))}
            </div>
            <span
              className="text-[12px]"
              style={{ color: 'var(--hm-fg-secondary)' }}
            >
              {t('projects.client.peopleCount', { count: team.length })}
            </span>
          </div>
        )}
      </section>

      {/* ---- Site details ---- */}
      {site.length > 0 && (
        <section className="mt-8">
          <SectionHead label={t('projects.client.siteDetails')} />
          <div className="flex flex-col">
            {site.map((row, i) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2.5"
                style={{
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                }}
              >
                <span
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em]"
                  style={{ color: 'var(--hm-fg-muted)' }}
                >
                  {row.label}
                </span>
                <span
                  className="min-w-0 text-right text-[13px]"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Recent activity ---- */}
      {activity.length > 0 && (
        <section className="mt-8">
          <SectionHead label={t('projects.client.recentActivity')} />
          <div className="flex flex-col">
            {activity.map((ev, i) => {
              const verb = ACTION[ev.type]
                ? pick(ACTION[ev.type])
                : ev.targetLabel || ev.type;
              return (
                <div
                  key={ev._id}
                  className="flex items-baseline gap-3 py-2.5"
                  style={{
                    borderTop:
                      i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                  }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--hm-n-300)' }}
                  />
                  <p
                    className="min-w-0 flex-1 text-[13px] leading-[1.5]"
                    style={{ color: 'var(--hm-fg-secondary)' }}
                  >
                    {ev.actorId?.name && (
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--hm-fg-primary)' }}
                      >
                        {ev.actorId.name}{' '}
                      </span>
                    )}
                    {verb}
                  </p>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--hm-fg-muted)]">
                    {formatTimeAgoCompact(ev.createdAt, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Escape hatch to the full project tools. A low-key bordered-mono
          chip (the page's advanced-action affordance), left-aligned - not a CTA
          competing with the "Needs you" actions above. ---- */}
      <div
        className="mt-12 border-t pt-5"
        style={{ borderColor: 'var(--hm-border-subtle)' }}
      >
        <button
          type="button"
          onClick={() => onSeeFullDetails()}
          className="group inline-flex items-center gap-2 rounded-md border border-[var(--hm-border-subtle)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
        >
          {t('projects.client.openFullTools')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
