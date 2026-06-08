'use client';

import Avatar from '@/components/common/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';

// Minimal subset of the dashboard payload the client view reads. The page
// passes its full `project` object, which is a superset of this.
interface ClientProject {
  title: string;
  location?: string;
  status: string;
  progress: number;
  currentPhase?: string;
  photos?: string[];
  coverImage?: string;
  budgetMin?: number;
  budgetMax?: number;
  budget?: { planned: number; committed: number };
  phases?: { key: string; progress: number; roleCount: number }[];
  milestones?: { id: string; title: string; status: string }[];
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
  documents?: { id: string; name?: string; approvalStatus?: string }[];
}

const PHASES: { key: string; labelKey: string }[] = [
  { key: 'design', labelKey: 'projects.phaseDesign' },
  { key: 'permits', labelKey: 'projects.phasePermits' },
  { key: 'construction', labelKey: 'projects.phaseConstruction' },
  { key: 'finishing', labelKey: 'projects.phaseFinishing' },
];

const money = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

interface Props {
  project: ClientProject;
  onSeeFullDetails: (tab?: string) => void;
}

/**
 * The client (homeowner) lens on a project: a calm "status & decisions" view
 * instead of the full project-management tabs. Answers the only three things a
 * client actually wants - is it on track, do I need to do anything, what's it
 * costing - and hides the engagement/step machinery behind "See full details".
 * Rendered only when viewerRole === 'client'.
 */
export default function ProjectClientView({ project, onSeeFullDetails }: Props) {
  const { t } = useLanguage();

  const progress = Math.max(0, Math.min(100, Math.round(project.progress || 0)));
  const activeMilestone = (project.milestones || []).find(
    (m) => m.status === 'active',
  );
  const currentPhaseLabel = (() => {
    const ph = PHASES.find((p) => p.key === project.currentPhase);
    return ph ? t(ph.labelKey) : '';
  })();
  const focusText = activeMilestone?.title || currentPhaseLabel;

  // ---- "Needs you" - every pending client decision in one place ----
  const actions: { id: string; label: string; tab: string }[] = [];
  (project.selections || []).forEach((s) => {
    if ((s.options?.length ?? 0) > 0 && !s.chosenOptionId) {
      actions.push({
        id: `sel-${s.id}`,
        label: t('projects.client.needChoose', { item: s.title }),
        tab: 'materials',
      });
    }
  });
  (project.documents || []).forEach((d) => {
    if (d.approvalStatus === 'pending') {
      actions.push({
        id: `doc-${d.id}`,
        label: t('projects.client.needApprove', {
          item: d.name || t('projects.client.aDocument'),
        }),
        tab: 'library',
      });
    }
  });
  (project.engagements || []).forEach((e) => {
    if (e.designApproval?.status === 'pending') {
      actions.push({
        id: `eng-${e.id}`,
        label: t('projects.client.needApproveDesign', { role: e.roleLabel }),
        tab: 'team',
      });
    }
  });

  const photos = (project.photos || []).filter(Boolean).slice(0, 5);
  const team = (project.engagements || [])
    .map((e) =>
      typeof e.assignedProId === 'object' ? e.assignedProId : undefined,
    )
    .filter((p): p is { name?: string; avatar?: string } => !!p);

  const agreed = project.budget?.planned || project.budgetMax || project.budgetMin || 0;
  const committed = project.budget?.committed || 0;

  const ring = 2 * Math.PI * 34;

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-20 pt-5 sm:px-6">
      {/* ---- Status hero: progress ring + current focus ---- */}
      <section
        className="rounded-2xl p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--hm-bg-elevated)',
          border: '1px solid var(--hm-border-subtle)',
        }}
      >
        <div className="flex items-center gap-5">
          <div className="relative h-[84px] w-[84px] shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--hm-bg-tertiary)"
                strokeWidth="7"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--hm-brand-500)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[20px] font-bold tabular-nums"
                style={{ color: 'var(--hm-fg-primary)' }}
              >
                {progress}%
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[19px] font-bold tracking-[-0.01em] sm:text-[22px]"
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
                className="mt-0.5 truncate text-[12px]"
                style={{ color: 'var(--hm-fg-muted)' }}
              >
                {project.location}
              </p>
            )}
          </div>
        </div>

        {/* Plain-language phase stepper */}
        <div className="mt-5 grid grid-cols-4 gap-1.5">
          {PHASES.map((ph) => {
            const data = (project.phases || []).find((p) => p.key === ph.key);
            const pct = Math.max(0, Math.min(100, Math.round(data?.progress || 0)));
            const isCurrent = project.currentPhase === ph.key;
            return (
              <div key={ph.key}>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        pct >= 100
                          ? 'var(--hm-success-500)'
                          : 'var(--hm-brand-500)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p
                  className="mt-1.5 truncate text-[11px]"
                  style={{
                    color: isCurrent
                      ? 'var(--hm-brand-500)'
                      : 'var(--hm-fg-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {t(ph.labelKey)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Needs you ---- */}
      <section className="mt-4">
        <p
          className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--hm-fg-muted)' }}
        >
          {t('projects.client.needsYou')}
        </p>
        {actions.length === 0 ? (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-4"
            style={{
              backgroundColor: 'var(--hm-success-50, rgba(34,197,94,0.06))',
              border: '1px solid var(--hm-border-subtle)',
            }}
          >
            <CheckCircle2
              className="h-5 w-5 shrink-0"
              style={{ color: 'var(--hm-success-500)' }}
            />
            <p
              className="text-[13px] font-medium"
              style={{ color: 'var(--hm-fg-primary)' }}
            >
              {t('projects.client.allSet')}
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--hm-bg-elevated)',
              border: `1px solid color-mix(in srgb, var(--hm-brand-500) 30%, transparent)`,
            }}
          >
            {actions.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSeeFullDetails(a.tab)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                style={{
                  borderTop:
                    i === 0 ? 'none' : '1px solid var(--hm-border-subtle)',
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--hm-brand-500) 12%, transparent)',
                  }}
                >
                  <ClipboardCheck
                    className="h-4 w-4"
                    style={{ color: 'var(--hm-brand-500)' }}
                  />
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[13px] font-medium"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  {a.label}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--hm-fg-muted)' }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---- Latest photos ---- */}
      {photos.length > 0 && (
        <section className="mt-5">
          <p
            className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--hm-fg-muted)' }}
          >
            {t('projects.client.latestPhotos')}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
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

      {/* ---- Money + team ---- */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: 'var(--hm-bg-elevated)',
            border: '1px solid var(--hm-border-subtle)',
          }}
        >
          <p
            className="text-[11px]"
            style={{ color: 'var(--hm-fg-muted)' }}
          >
            {t('projects.client.budget')}
          </p>
          <p
            className="mt-1 text-[20px] font-bold tabular-nums"
            style={{ color: 'var(--hm-fg-primary)' }}
          >
            {agreed > 0 ? money(agreed) : t('projects.client.notSet')}
          </p>
          {committed > 0 && (
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: 'var(--hm-fg-muted)' }}
            >
              {t('projects.client.committed', { amount: money(committed) })}
            </p>
          )}
        </div>

        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: 'var(--hm-bg-elevated)',
            border: '1px solid var(--hm-border-subtle)',
          }}
        >
          <p
            className="text-[11px]"
            style={{ color: 'var(--hm-fg-muted)' }}
          >
            {t('projects.client.yourTeam')}
          </p>
          {team.length === 0 ? (
            <p
              className="mt-2 text-[13px]"
              style={{ color: 'var(--hm-fg-secondary)' }}
            >
              {t('projects.client.noTeamYet')}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {team.slice(0, 5).map((p, i) => (
                  <Avatar
                    key={i}
                    src={p.avatar}
                    name={p.name || ''}
                    size="sm"
                    className="h-8 w-8 ring-2 ring-[var(--hm-bg-elevated)]"
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
        </div>
      </section>

      {/* ---- Escape hatch to the full project ---- */}
      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSeeFullDetails()}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {t('projects.client.seeFullDetails')}
        </Button>
      </div>
    </div>
  );
}
