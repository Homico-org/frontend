"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR as ACCENT } from "@/constants/theme";
import type { ProjectStage } from "@/types/shared";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Play,
  RotateCcw,
  Star,
} from "lucide-react";
import React from "react";

import { useLanguage } from "@/contexts/LanguageContext";
const STAGES: {
  key: ProjectStage;
  label: string;
  labelKa: string;
  icon: React.ReactNode;
  progress: number;
}[] = [
  { key: "hired", label: "Hired", labelKa: "დაქირავებული", icon: <Check className="w-3 h-3" />, progress: 10 },
  { key: "started", label: "Started", labelKa: "დაწყებული", icon: <Play className="w-3 h-3" />, progress: 25 },
  { key: "in_progress", label: "In Progress", labelKa: "მიმდინარე", icon: <Clock className="w-3 h-3" />, progress: 50 },
  { key: "review", label: "Review", labelKa: "შემოწმება", icon: <Eye className="w-3 h-3" />, progress: 75 },
  { key: "completed", label: "Done", labelKa: "დასრულებული", icon: <CheckCircle2 className="w-3 h-3" />, progress: 100 },
];

function getStageIndex(stage: ProjectStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  locale: string;
  isPro: boolean;
  isClient: boolean;
  isUpdating: boolean;
  isClientConfirmed: boolean;
  hasSubmittedReview?: boolean;
  onStageChange: (stage: ProjectStage) => void;
  onClientConfirm?: () => void;
  onClientRequestChanges?: () => void;
  onLeaveReview?: () => void;
  compact?: boolean;
}

export default function ProjectStatusBar({
  currentStage,
  locale,
  isPro,
  isClient,
  isUpdating,
  isClientConfirmed,
  hasSubmittedReview = false,
  onStageChange,
  onClientConfirm,
  onClientRequestChanges,
  onLeaveReview,
  compact = false,
}: ProjectStatusBarProps) {
  const { t } = useLanguage();
  const currentIndex = getStageIndex(currentStage);
  const progress = STAGES[currentIndex]?.progress || 0;
  const isProjectCompleted = currentStage === "completed";
  const isFullyCompleted = isProjectCompleted && isClientConfirmed;

  // Compact completed state for hero
  if (isFullyCompleted) {
    return (
      <div className={`flex items-center gap-3 ${compact ? 'p-3' : 'p-4'} rounded-xl bg-green-50 border border-green-200`}>
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-green-100 flex items-center justify-center flex-shrink-0`}>
          <CheckCircle2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-green-800`}>
            {t('job.projectCompleted')}
          </p>
          {!compact && (
            <p className="text-xs text-green-600 mt-0.5">
              {t('job.thankYouForYourCollaboration')}
            </p>
          )}
        </div>
        {/* Review button for client who hasn't submitted review yet */}
        {isClient && !hasSubmittedReview && onLeaveReview && (
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={onLeaveReview}
            leftIcon={<Star className="w-3.5 h-3.5" />}
            className="flex-shrink-0"
          >
            {t('job.review')}
          </Button>
        )}
        {isClient && hasSubmittedReview && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-100 flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
            {t('job.reviewed')}
          </div>
        )}
      </div>
    );
  }

  // Get next stage for pro to advance to
  const nextStageIndex = currentIndex + 1;
  const nextStage = STAGES[nextStageIndex];
  const canAdvanceToNext = isPro && nextStage && !isUpdating && !isProjectCompleted;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-[var(--hm-fg-secondary)]`}>
              {locale === "ka" ? STAGES[currentIndex]?.labelKa : STAGES[currentIndex]?.label}
            </span>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: ACCENT }}>
              {progress}%
            </span>
          </div>
          <div className={`${compact ? 'h-1.5' : 'h-2'} bg-[var(--hm-bg-tertiary)] rounded-full overflow-hidden`}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: ACCENT,
              }}
            />
          </div>
        </div>
        {/* Next Stage Button in Compact Mode (for Pro) */}
        {compact && canAdvanceToNext && (
          <Button
            size="sm"
            onClick={() => onStageChange(nextStage.key)}
            disabled={isUpdating}
            loading={isUpdating}
            leftIcon={!isUpdating ? <ChevronRight className="w-3.5 h-3.5" /> : undefined}
            className="flex-shrink-0"
          >
            {locale === "ka" ? nextStage.labelKa : nextStage.label}
          </Button>
        )}
      </div>

      {/* Client Confirmation Prompt */}
      {isClient && isProjectCompleted && !isClientConfirmed && (
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${compact ? 'p-2' : 'p-3'} rounded-xl bg-[var(--hm-warning-50)]/20 border border-amber-200`}>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-[var(--hm-warning-500)] flex-1`}>
            {t('job.pleaseReviewAndConfirm')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={onClientConfirm}
              disabled={isUpdating}
              loading={isUpdating}
              leftIcon={!isUpdating ? <BadgeCheck className="w-3.5 h-3.5" /> : undefined}
            >
              {t('common.confirm')}
            </Button>
            {!compact && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClientRequestChanges}
                disabled={isUpdating}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {t('job.changes')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stage Pills - Horizontal scrollable */}
      {!compact && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STAGES.map((stage, index) => {
            const isStageCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isNext = index === currentIndex + 1;
            const canAdvance = isPro && isNext && !isUpdating && !isProjectCompleted;

            return (
              <button
                key={stage.key}
                onClick={() => canAdvance && onStageChange(stage.key)}
                disabled={!canAdvance}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${isStageCompleted
                    ? "bg-green-50 text-green-600"
                    : isCurrent
                      ? "text-white shadow-sm"
                      : canAdvance
                        ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] border-2 border-dashed hover:border-solid cursor-pointer"
                        : "bg-[var(--hm-bg-tertiary)]/50 text-[var(--hm-fg-muted)]"
                  }
                `}
                style={{
                  backgroundColor: isCurrent ? ACCENT : undefined,
                  borderColor: canAdvance ? `${ACCENT}60` : undefined,
                }}
              >
                {isUpdating && isCurrent ? (
                  <LoadingSpinner size="xs" color="white" />
                ) : isStageCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  stage.icon
                )}
                <span>{locale === "ka" ? stage.labelKa : stage.label}</span>
                {canAdvance && (
                  <ChevronRight className="w-3 h-3 ml-0.5" style={{ color: ACCENT }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Role Badge - only show when not compact */}
      {!compact && (
        <div className="flex items-center gap-2">
          {isClient && (
            <Badge variant="info" size="sm">
              {t('job.yourJob')}
            </Badge>
          )}
          {isPro && (
            <Badge variant="success" size="sm">
              {t('job.youreHired')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
