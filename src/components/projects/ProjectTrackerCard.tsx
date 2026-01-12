"use client";

import Avatar from "@/components/common/Avatar";
import MediaLightbox, { MediaItem } from "@/components/common/MediaLightbox";
import ReviewModal from "@/components/jobs/ReviewModal";
import PollsTab from "@/components/polls/PollsTab";
import PortfolioCompletionModal from "@/components/projects/PortfolioCompletionModal";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TERRACOTTA } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type { ProjectStage, ProjectTracking } from "@/types/shared";
import { formatDateMonthDay, formatMessageTime } from "@/utils/dateUtils";
import {
    AlertCircle,
    BadgeCheck,
    BarChart3,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    FolderOpen,
    History,
    Home,
    MessageCircle,
    Package,
    Paperclip,
    PartyPopper,
    Phone,
    Play,
    RotateCcw,
    Send,
    Star,
    Vote
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useLanguage } from "@/contexts/LanguageContext";
// Re-export for components that import from here
export type { ProjectStage };

interface ProjectMessage {
  id?: string;
  senderId: string | { id: string; name: string; avatar?: string };
  senderName?: string;
  senderAvatar?: string;
  senderRole?: "client" | "pro";
  content: string;
  attachments?: string[];
  createdAt: string;
}

// Extended tracking with additional fields used by this component
interface ExtendedProjectTracking extends ProjectTracking {
  clientConfirmedAt?: string;
}

// Minimal job for this component
interface CardJob {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  images: string[];
  media?: { type: string; url: string }[];
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
}

// History event types
type HistoryEventType =
  | "stage_changed"
  | "poll_created"
  | "poll_voted"
  | "poll_closed"
  | "poll_option_selected"
  | "resource_added"
  | "resource_removed"
  | "resource_edited"
  | "resource_item_added"
  | "resource_item_removed"
  | "resource_item_edited"
  | "resource_reaction"
  | "attachment_added"
  | "attachment_removed"
  | "message_sent"
  | "project_created"
  | "project_completed"
  | "price_updated"
  | "deadline_updated";

interface HistoryEvent {
  eventType: HistoryEventType;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: "client" | "pro" | "system";
  metadata?: {
    fromStage?: string;
    toStage?: string;
    pollId?: string;
    pollTitle?: string;
    optionText?: string;
    resourceId?: string;
    resourceName?: string;
    itemId?: string;
    itemName?: string;
    reactionType?: string;
    fileName?: string;
    fileUrl?: string;
    oldValue?: string | number;
    newValue?: string | number;
    description?: string;
  };
  createdAt: string;
}

interface ProjectTrackerCardProps {
  job: CardJob;
  project: ExtendedProjectTracking;
  isClient: boolean;
  locale: string;
  onRefresh?: () => void;
}

const STAGES: {
  key: ProjectStage;
  label: string;
  labelKa: string;
  icon: React.ReactNode;
  progress: number;
}[] = [
  { key: "hired", label: "Hired", labelKa: "დაქირავებული", icon: <Check className="w-3.5 h-3.5" />, progress: 10 },
  { key: "started", label: "Started", labelKa: "დაწყებული", icon: <Play className="w-3.5 h-3.5" />, progress: 25 },
  { key: "in_progress", label: "In Progress", labelKa: "მიმდინარე", icon: <Clock className="w-3.5 h-3.5" />, progress: 50 },
  { key: "review", label: "Review", labelKa: "შემოწმება", icon: <Eye className="w-3.5 h-3.5" />, progress: 75 },
  { key: "completed", label: "Done", labelKa: "დასრულებული", icon: <CheckCircle2 className="w-3.5 h-3.5" />, progress: 100 },
];

type TabKey = "overview" | "chat" | "polls" | "materials" | "history";

function getStageIndex(stage: ProjectStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function getSenderId(senderId: string | { id: string }): string {
  if (typeof senderId === "string") return senderId;
  return senderId.id;
}

// Inline Stage Stepper Component - Clean & Intuitive
function InlineStageStepper({
  currentStage,
  locale,
  isPro,
  isUpdating,
  onStageChange,
  onClientConfirm,
  onClientRequestChanges,
  isClientConfirmed,
  hasReview,
  onLeaveReview,
}: {
  currentStage: ProjectStage;
  locale: string;
  isPro: boolean;
  isUpdating: boolean;
  onStageChange: (stage: ProjectStage) => void;
  onClientConfirm?: () => void;
  onClientRequestChanges?: () => void;
  isClientConfirmed?: boolean;
  hasReview?: boolean;
  onLeaveReview?: () => void;
}) {
  const { t } = useLanguage();
  const currentIndex = getStageIndex(currentStage);
  const progress = STAGES[currentIndex]?.progress || 0;
  const isClient = !isPro;
  const isProjectCompleted = currentStage === "completed";
  const showLeaveReviewButton = isClient && isProjectCompleted && isClientConfirmed && !hasReview;

  return (
    <div className="p-4">
      {/* Progress Bar - Clean and prominent */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {locale === "ka" ? STAGES[currentIndex]?.labelKa : STAGES[currentIndex]?.label}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: TERRACOTTA.primary }}
          >
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: TERRACOTTA.primary,
            }}
          />
        </div>
      </div>

      {/* Client Actions when project is completed but not yet confirmed */}
      {isClient && isProjectCompleted && !isClientConfirmed && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">
            {t('projects.theProfessionalHasMarkedThe')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={onClientConfirm}
              disabled={isUpdating}
              loading={isUpdating}
              leftIcon={!isUpdating ? <BadgeCheck className="w-4 h-4" /> : undefined}
              className="flex-1"
            >
              {t('projects.confirmClose')}
            </Button>
            <Button
              variant="outline"
              onClick={onClientRequestChanges}
              disabled={isUpdating}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              {t('projects.requestChanges')}
            </Button>
          </div>
        </div>
      )}

      {/* Leave Review button when project is confirmed but no review yet */}
      {showLeaveReviewButton && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-3">
            {t('projects.projectIsCompleteLeaveA')}
          </p>
          <Button
            onClick={onLeaveReview}
            leftIcon={<Star className="w-4 h-4" />}
            className="w-full"
          >
            {t('projects.leaveAReview')}
          </Button>
        </div>
      )}

      {/* Stage Pills - Scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STAGES.map((stage, index) => {
          const isStageCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isNext = index === currentIndex + 1;
          const canAdvance = isPro && isNext && !isUpdating;

          return (
            <button
              key={stage.key}
              onClick={() => canAdvance && onStageChange(stage.key)}
              disabled={!canAdvance}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${isStageCompleted
                  ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : isCurrent
                    ? 'text-white shadow-sm'
                    : canAdvance
                      ? 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-2 border-dashed hover:border-solid cursor-pointer'
                      : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500'
                }
              `}
              style={{
                backgroundColor: isCurrent ? TERRACOTTA.primary : undefined,
                borderColor: canAdvance ? TERRACOTTA.light : undefined,
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
                <ChevronRight className="w-3 h-3 ml-0.5" style={{ color: TERRACOTTA.primary }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  disabled,
  disabledTooltip,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? disabledTooltip : undefined}
      className={`
        relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200
        ${disabled
          ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed opacity-50'
          : active
            ? ''
            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }
      `}
      style={{ color: active && !disabled ? TERRACOTTA.primary : undefined }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && !disabled && (
        <Badge variant="danger" size="xs" className="!min-w-[18px] !h-[18px] !px-1">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
      {/* Active indicator */}
      {active && !disabled && (
        <div
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
          style={{ backgroundColor: TERRACOTTA.primary }}
        />
      )}
    </button>
  );
}

// Role Banner Component - Shows clearly who owns the job and who is hired
function RoleBanner({
  isClient,
  isCompleted,
  isConfirmed,
  partnerName,
  completedAt,
  locale,
}: {
  isClient: boolean;
  isCompleted: boolean;
  isConfirmed: boolean;
  partnerName: string;
  completedAt?: string;
  locale: string;
}) {
  const { t } = useLanguage();
  // Completed state
  if (isCompleted && isConfirmed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50">
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
          <PartyPopper className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-700 dark:text-green-300">
            {t('common.completed')}
            {completedAt && (
              <span className="font-normal text-green-600 dark:text-green-400 ml-1">
                · {new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </p>
          <p className="text-[11px] text-green-600 dark:text-green-400 truncate">
            {isClient
              ? (locale === "ka" ? `${partnerName}-მ შეასრულა სამუშაო` : `${partnerName} completed the work`)
              : (locale === "ka" ? `${partnerName}-მა დაადასტურა სამუშაო` : `${partnerName} confirmed your work`)
            }
          </p>
        </div>
      </div>
    );
  }

  // Pending completion (completed but not confirmed by client)
  if (isCompleted && !isConfirmed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/50">
        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t('projects.pendingConfirmation')}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
            {isClient
              ? (t('projects.pleaseReviewAndConfirmThe'))
              : (locale === "ka" ? `${partnerName} ჯერ არ დაადასტურა` : `Waiting for ${partnerName} to confirm`)
            }
          </p>
        </div>
      </div>
    );
  }

  // Active state - show role clearly
  if (isClient) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
          <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t('projects.yourJob')}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 truncate">
            {locale === "ka" ? `თქვენ დაიქირავეთ ${partnerName}` : `You hired ${partnerName}`}
          </p>
        </div>
      </div>
    );
  }

  // Pro view
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/50">
      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center">
        <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          {t('projects.hiredJob')}
        </p>
        <p className="text-[11px] text-purple-600 dark:text-purple-400 truncate">
          {locale === "ka" ? `${partnerName}-მა დაგიქირავათ` : `${partnerName} hired you`}
        </p>
      </div>
    </div>
  );
}

// Completed Summary Component - Shows when project is fully completed
function CompletedSummary({
  project,
  job,
  isClient,
  locale,
  partnerName,
  partnerAvatar,
  hasReview,
  onLeaveReview,
}: {
  project: ExtendedProjectTracking;
  job: CardJob;
  isClient: boolean;
  locale: string;
  partnerName: string;
  partnerAvatar?: string;
  hasReview: boolean;
  onLeaveReview: () => void;
}) {
  const { t } = useLanguage();
  const duration = project.completedAt && project.hiredAt
    ? Math.ceil((new Date(project.completedAt).getTime() - new Date(project.hiredAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Success Message */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            {t('projects.projectSuccessfullyCompleted')}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
            {project.completedAt && new Date(project.completedAt).toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duration */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {t('common.duration')}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {duration 
              ? (locale === "ka" ? `${duration} დღე` : `${duration} days`)
              : "—"
            }
          </span>
        </div>

        {/* Final Price */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-medium">₾</span>
            <span className="text-xs uppercase tracking-wider font-medium">
              {t('common.amount')}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {project.agreedPrice 
              ? `₾${project.agreedPrice.toLocaleString()}`
              : job.budgetAmount
                ? `₾${job.budgetAmount.toLocaleString()}`
                : "—"
            }
          </span>
        </div>
      </div>

      {/* Leave Review CTA (for client who hasn't reviewed yet) */}
      {isClient && !hasReview && (
        <Button
          onClick={onLeaveReview}
          leftIcon={<Star className="w-4 h-4" />}
          className="w-full"
          size="lg"
        >
          {t('projects.leaveAReview')}
        </Button>
      )}

      {/* Already reviewed message */}
      {isClient && hasReview && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('projects.youHaveAlreadyLeftA')}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ProjectTrackerCard({
  job,
  project,
  isClient,
  locale,
  onRefresh,
}: ProjectTrackerCardProps) {
  const { user } = useAuth();

  const { t } = useLanguage();
  const toast = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Chat state
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPollsCount, setUnreadPollsCount] = useState(0);
  const [unreadMaterialsCount, setUnreadMaterialsCount] = useState(0);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesLoadedRef = useRef(false);
  const activeTabRef = useRef<TabKey>(activeTab);

  // Local state for optimistic updates
  const [localStage, setLocalStage] = useState<ProjectStage>(project.currentStage);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Sync localStage when project.currentStage changes (e.g., after refresh)
  useEffect(() => {
    setLocalStage(project.currentStage);
  }, [project.currentStage]);

  // History state
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "client" | "pro">("all");
  const historyLoadedRef = useRef(false);

  // Lightbox state for image preview
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // Portfolio completion modal state (for pro completing job)
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Phone reveal state
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Keep activeTabRef in sync for stable WebSocket handlers
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const currentStageIndex = getStageIndex(localStage);
  const firstImage = job.media?.[0]?.url || job.images?.[0];
  const partnerName = isClient ? project.proId?.name : project.clientId?.name;
  const partnerAvatar = isClient ? project.proId?.avatar : project.clientId?.avatar;
  const partnerTitle = isClient ? project.proId?.title : undefined;
  const partnerPhone = isClient ? project.proId?.phone : undefined;

  // Check if project has been started (not just hired)
  const isProjectStarted = localStage !== "hired";
  const notStartedTooltip = t('projects.projectNotStartedYet');

  // Check if project is fully completed (stage = completed AND client confirmed)
  const isProjectCompleted = localStage === "completed";
  // For legacy jobs: if stage is completed AND completedAt exists but no clientConfirmedAt,
  // treat as confirmed (old jobs completed before the confirmation system was added)
  const isLegacyCompleted = isProjectCompleted && !!project.completedAt && !project.clientConfirmedAt;
  const isProjectConfirmed = !!project.clientConfirmedAt || isLegacyCompleted;
  const isFullyCompleted = isProjectCompleted && isProjectConfirmed;

  // Determine which tabs should be visible
  const showInteractiveTabs = isProjectStarted && !isFullyCompleted;

  // Helper to check if attachment is an image
  const isImageAttachment = useCallback((attachment: string): boolean => {
    return !!(
      attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      attachment.includes("/image/upload/") ||
      (attachment.includes("cloudinary") && !attachment.includes("/raw/"))
    );
  }, []);

  // Collect all image attachments from messages for lightbox
  const allImageAttachments = useMemo((): MediaItem[] => {
    const images: MediaItem[] = [];
    messages.forEach((msg) => {
      msg.attachments?.forEach((attachment) => {
        if (isImageAttachment(attachment)) {
          images.push({
            url: storage.getFileUrl(attachment),
            type: "image",
          });
        }
      });
    });
    return images;
  }, [messages, isImageAttachment]);

  // Open lightbox for a specific image
  const openLightbox = useCallback((imageUrl: string) => {
    const index = allImageAttachments.findIndex((img) => img.url === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  }, [allImageAttachments]);

  // Check if client has already submitted a review for this job
  useEffect(() => {
    if (!isClient || !user) return;

    const checkReview = async () => {
      try {
        const response = await api.get(`/reviews/check/job/${job.id}`);
        if (response.data?.hasReview) {
          setHasSubmittedReview(true);
        }
      } catch {
        // Ignore errors - just means we couldn't check
      }
    };

    checkReview();
  }, [isClient, user, job.id]);

  // Fetch messages when chat tab is active or when project starts
  useEffect(() => {
    if (isProjectStarted && !messagesLoadedRef.current) {
      fetchMessages();
    }
  }, [isProjectStarted]);

  // Also fetch when switching to chat tab if not loaded
  useEffect(() => {
    if (activeTab === 'chat' && !messagesLoadedRef.current && isProjectStarted) {
      fetchMessages();
    }
  }, [activeTab, isProjectStarted]);

  // Clear unread count and mark messages as read when chat tab is opened
  useEffect(() => {
    if (activeTab === 'chat' && unreadCount > 0) {
      setUnreadCount(0);
      // Mark messages as read on backend
      api.post(`/jobs/projects/${job.id}/messages/read`).catch(() => {
        // Silently fail - not critical
      });
    }
  }, [activeTab, unreadCount, job.id]);

  // Clear polls unread count when polls tab is opened
  useEffect(() => {
    if (activeTab === 'polls' && unreadPollsCount > 0) {
      setUnreadPollsCount(0);
      api.post(`/jobs/projects/${job.id}/polls/viewed`).catch(() => {});
    }
  }, [activeTab, unreadPollsCount, job.id]);

  // Clear materials unread count when materials tab is opened
  useEffect(() => {
    if (activeTab === 'materials' && unreadMaterialsCount > 0) {
      setUnreadMaterialsCount(0);
      api.post(`/jobs/projects/${job.id}/materials/viewed`).catch(() => {});
    }
  }, [activeTab, unreadMaterialsCount, job.id]);

  // Fetch unread counts on mount
  useEffect(() => {
    if (isProjectStarted) {
      api.get(`/jobs/projects/${job.id}/unread-counts`)
        .then((response) => {
          setUnreadCount(response.data.chat || 0);
          setUnreadPollsCount(response.data.polls || 0);
          setUnreadMaterialsCount(response.data.materials || 0);
        })
        .catch(() => {});
    }
  }, [isProjectStarted, job.id]);

  // Fetch history when history tab is active
  useEffect(() => {
    if (activeTab === 'history' && !historyLoadedRef.current && isProjectStarted) {
      fetchHistory();
    }
  }, [activeTab, isProjectStarted]);

  // WebSocket connection for chat - Keep connected regardless of active tab (as long as project is started)
  useEffect(() => {
    if (!isProjectStarted || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const backendUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;

    const socket = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ProjectTrackerCard] Connected to WebSocket");
      socket.emit("joinProjectChat", job.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[ProjectTrackerCard] Disconnected:", reason);
    });

    // Handle incoming messages - use inline handler with ref for stable deps
    socket.on("projectMessage", (message: ProjectMessage) => {
      const senderId = getSenderId(message.senderId);
      if (senderId === user.id) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Increment unread count if not on chat tab (use ref for current value)
      if (activeTabRef.current !== 'chat') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Handle typing indicator
    socket.on("projectTyping", ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId !== user.id) {
        setOtherUserTyping(typing);
      }
    });

    // Handle poll updates
    socket.on("projectPollUpdate", (data: { type: string; poll: Record<string, unknown> }) => {
      if (activeTabRef.current !== 'polls') {
        setUnreadPollsCount((prev) => prev + 1);
      }
    });

    // Handle materials updates
    socket.on("projectMaterialsUpdate", (data: { type: string }) => {
      if (activeTabRef.current !== 'materials') {
        setUnreadMaterialsCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.emit("leaveProjectChat", job.id);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isProjectStarted, user?.id, job.id]); // Stable deps only

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, activeTab]);

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/jobs/projects/${job.id}/messages`);
      const fetchedMessages = response.data.messages || [];
      setMessages(fetchedMessages);

      // Use unread count from API response
      if (response.data.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }

      messagesLoadedRef.current = true;
    } catch (error) {
      if (project.comments?.length) {
        const legacyMessages: ProjectMessage[] = project.comments.map((c, idx) => ({
          id: `legacy-${idx}`,
          senderId: c.userId,
          senderName: c.userName,
          senderAvatar: c.userAvatar,
          senderRole: c.userRole,
          content: c.content,
          createdAt: c.createdAt,
        }));
        setMessages(legacyMessages);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get(`/jobs/projects/${job.id}/history`);
      setHistoryEvents(response.data.history || []);
      historyLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("projectTyping", { jobId: job.id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("projectTyping", { jobId: job.id, isTyping: false });
    }, 2000);
  }, [job.id, isTyping]);

  const handleSendMessage = async (attachments?: string[]) => {
    const messageContent = newMessage.trim();
    const hasContent = messageContent.length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if ((!hasContent && !hasAttachments) || isSubmitting || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ProjectMessage = {
      id: tempId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: isClient ? "client" : "pro",
      content: messageContent,
      attachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      setIsSubmitting(true);
      const response = await api.post(`/jobs/projects/${job.id}/messages`, {
        content: messageContent || "",
        attachments: hasAttachments ? attachments : undefined,
      });

      if (response.data?.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? response.data.message : m)));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageContent);
      toast.error(
        t('common.error'),
        t('projects.failedToSendMessage')
      );
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t('projects.fileTooLargeMax50mb')
      );
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await api.post("/upload", formData);
      const fileUrl = uploadResponse.data.url || uploadResponse.data.filename;
      await handleSendMessage([fileUrl]);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message;
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        message || (t('projects.failedToUploadFile'))
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleStageChange = async (newStage: ProjectStage) => {
    // If pro is moving to completed stage, show completion modal to upload portfolio images
    if (newStage === "completed" && !isClient) {
      setShowCompletionModal(true);
      return;
    }

    const previousStage = localStage;

    setLocalStage(newStage);
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: newStage });
      toast.success(
        t('common.success'),
        t('projects.stageUpdated')
      );
    } catch (err) {
      setLocalStage(previousStage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t('projects.failedToUpdateStage')
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Handle portfolio image upload for completion
  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPortfolio(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await api.post("/upload", formData);
        const url = uploadResponse.data.url || uploadResponse.data.filename;
        newImages.push(url);
      }
      setPortfolioImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t('projects.failedToUploadImage')
      );
    } finally {
      setIsUploadingPortfolio(false);
      if (portfolioInputRef.current) {
        portfolioInputRef.current.value = "";
      }
    }
  };

  // Complete job with portfolio images
  const handleCompleteWithPortfolio = async () => {
    const previousStage = localStage;
    setLocalStage("completed");
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, {
        stage: "completed",
        portfolioImages: portfolioImages.length > 0 ? portfolioImages : undefined,
      });
      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        t('projects.projectCompleted')
      );
      setShowCompletionModal(false);
      setPortfolioImages([]);
    } catch (err) {
      setLocalStage(previousStage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t('projects.failedToCompleteProject')
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // State for completion flow (confirmation + review together)
  const [isCompletionFlow, setIsCompletionFlow] = useState(false);

  // Client clicks confirm - opens review modal in completion mode
  const handleClientConfirm = async () => {
    // Open review modal in completion flow mode
    setIsCompletionFlow(true);
    setShowReviewModal(true);
  };

  // Submit review for the pro (and optionally confirm completion)
  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) return;

    setIsSubmittingReview(true);
    try {
      // If in completion flow, confirm completion first
      if (isCompletionFlow) {
        await api.post(`/jobs/projects/${job.id}/confirm-completion`);
      }

      // Then submit review
      await api.post("/reviews", {
        jobId: job.id,
        proId: project.proId.id,
        rating: reviewRating,
        text: reviewText.trim() || undefined,
      });

      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        isCompletionFlow
          ? (t('projects.projectCompletedAndReviewSubmitted'))
          : (t('projects.reviewSubmittedSuccessfully'))
      );
      setShowReviewModal(false);
      setIsCompletionFlow(false);
      setHasSubmittedReview(true);
      onRefresh?.();
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr?.response?.data?.message;
      if (message === "Review already exists for this project") {
        // If review already exists but we were in completion flow, still try to confirm
        if (isCompletionFlow) {
          try {
            await api.post(`/jobs/projects/${job.id}/confirm-completion`);
            toast.success(
              locale === "ka" ? "წარმატება" : "Success",
              locale === "ka" ? "პროექტი დასრულდა" : "Project completed"
            );
            onRefresh?.();
          } catch {
            toast.error(
              locale === "ka" ? "შეცდომა" : "Error",
              t('projects.failedToCloseProject')
            );
          }
        }
        setShowReviewModal(false);
        setIsCompletionFlow(false);
        setHasSubmittedReview(true);
      } else {
        toast.error(
          locale === "ka" ? "შეცდომა" : "Error",
          t('projects.failedToSubmitReview')
        );
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Client requests changes - moves project back to review stage
  const handleClientRequestChanges = async () => {
    const previousStage = localStage;
    setLocalStage("review");
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: "review" });
      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        t('projects.projectMovedBackForReview')
      );
    } catch (err) {
      setLocalStage(previousStage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "სტატუსი ვერ განახლდა" : "Failed to update stage"
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Tab content renderers
  const renderOverviewTab = () => (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Not Started Notice */}
      {!isProjectStarted && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed"
          style={{ borderColor: TERRACOTTA.light, backgroundColor: TERRACOTTA.bg }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: TERRACOTTA.warm }}
          >
            <Play className="w-5 h-5" style={{ color: TERRACOTTA.primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {t('projects.projectNotStartedYet')}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isClient
                ? (t('projects.waitForTheProfessionalTo'))
                : (t('projects.clickStartedButtonAboveTo'))
              }
            </p>
          </div>
        </div>
      )}

      {/* Project Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Started */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {t('projects.started')}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {project.startedAt ? formatDateMonthDay(project.startedAt, locale as 'en' | 'ka' | 'ru') : formatDateMonthDay(project.hiredAt, locale as 'en' | 'ka' | 'ru')}
          </span>
        </div>

        {/* Due Date */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {t('projects.due')}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {project.expectedEndDate
              ? formatDateMonthDay(project.expectedEndDate, locale as 'en' | 'ka' | 'ru')
              : project.estimatedDuration
                ? `${project.estimatedDuration} ${project.estimatedDurationUnit || "days"}`
                : "—"}
          </span>
        </div>
      </div>

      {/* Budget - Clean with terracotta accent */}
      {((project.agreedPrice && project.agreedPrice > 0) || (job.budgetAmount && job.budgetAmount > 0) || (job.budgetMin && job.budgetMin > 0 && job.budgetMax && job.budgetMax > 0)) && (
        <div
          className="rounded-xl p-4 border-2"
          style={{
            borderColor: TERRACOTTA.warm,
            backgroundColor: TERRACOTTA.bg,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {t('projects.agreedBudget')}
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: TERRACOTTA.primary }}
            >
              {project.agreedPrice && project.agreedPrice > 0
                ? `₾${project.agreedPrice.toLocaleString()}`
                : job.budgetAmount && job.budgetAmount > 0
                  ? `₾${job.budgetAmount.toLocaleString()}`
                  : `₾${job.budgetMin?.toLocaleString()}-${job.budgetMax?.toLocaleString()}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="flex flex-col h-[380px] sm:h-[420px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-800/30">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" color={TERRACOTTA.primary} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {t('projects.noMessagesYet')}
            </p>
            <p className="text-xs mt-1">
              {t('projects.startTheConversation')}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const senderId = getSenderId(msg.senderId);
              const isMine = senderId === user?.id;
              const senderName = msg.senderName || (typeof msg.senderId === "object" ? msg.senderId.name : "");
              const senderAvatar = msg.senderAvatar || (typeof msg.senderId === "object" ? msg.senderId.avatar : undefined);

              return (
                <div key={msg.id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
                    {!isMine && (
                      <Avatar src={senderAvatar} name={senderName} size="sm" className="w-7 h-7 flex-shrink-0" />
                    )}
                    <div>
                      {/* Attachments */}
                      {msg.attachments?.map((attachment, aIdx) => {
                        const isImage = isImageAttachment(attachment);
                        const fileUrl = storage.getFileUrl(attachment);

                        return (
                          <div key={aIdx} className="mb-1">
                            {isImage ? (
                              <button
                                onClick={() => openLightbox(fileUrl)}
                                className="block cursor-zoom-in hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={fileUrl}
                                  alt=""
                                  className="max-w-[200px] rounded-xl border border-neutral-200 dark:border-neutral-700"
                                />
                              </button>
                            ) : (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                              >
                                <FileText className="w-4 h-4 text-neutral-500" />
                                <span className="text-xs truncate max-w-[120px]">{attachment.split("/").pop()}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}

                      {/* Message bubble */}
                      {msg.content && (
                        <div
                          className={`
                            px-4 py-2.5 rounded-2xl
                            ${isMine
                              ? "rounded-br-md text-white"
                              : "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-bl-md shadow-sm"
                            }
                          `}
                          style={isMine ? { backgroundColor: TERRACOTTA.primary } : {}}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-neutral-400"}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 px-3 py-2 bg-white dark:bg-neutral-700 rounded-2xl rounded-bl-md shadow-sm">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            style={{ color: isUploading ? undefined : TERRACOTTA.primary }}
          >
            {isUploading ? (
              <LoadingSpinner size="sm" color={TERRACOTTA.primary} />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              emitTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={t('projects.typeAMessage')}
            className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full focus:outline-none focus:ring-2 text-neutral-900 dark:text-white placeholder:text-neutral-400"
            style={{ "--tw-ring-color": TERRACOTTA.primary } as React.CSSProperties}
          />

          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim() || isSubmitting}
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPollsTab = () => (
    <div className="p-4">
      <PollsTab
        jobId={job.id}
        isPro={!isClient}
        isClient={isClient}
        userId={user?.id}
        locale={locale}
        embedded
      />
    </div>
  );

  const renderMaterialsTab = () => (
    <div className="p-4">
      <ProjectWorkspace
        jobId={job.id}
        locale={locale}
        isClient={isClient}
        embedded
      />
    </div>
  );

  // Helper to get event icon and color
  const getEventConfig = (eventType: HistoryEventType) => {
    const configs: Record<HistoryEventType, { icon: React.ReactNode; color: string; bgColor: string; label: string; labelKa: string }> = {
      stage_changed: { icon: <Play className="w-3.5 h-3.5" />, color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)", label: "Stage Changed", labelKa: "სტატუსი შეიცვალა" },
      poll_created: { icon: <Vote className="w-3.5 h-3.5" />, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", label: "Poll Created", labelKa: "გამოკითხვა შეიქმნა" },
      poll_voted: { icon: <Vote className="w-3.5 h-3.5" />, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", label: "Voted", labelKa: "ხმა მისცა" },
      poll_closed: { icon: <Vote className="w-3.5 h-3.5" />, color: "#6B7280", bgColor: "rgba(107, 114, 128, 0.1)", label: "Poll Closed", labelKa: "გამოკითხვა დაიხურა" },
      poll_option_selected: { icon: <Check className="w-3.5 h-3.5" />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", label: "Option Selected", labelKa: "ვარიანტი აირჩიეს" },
      resource_added: { icon: <Package className="w-3.5 h-3.5" />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", label: "Resource Added", labelKa: "რესურსი დაემატა" },
      resource_removed: { icon: <Package className="w-3.5 h-3.5" />, color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", label: "Resource Removed", labelKa: "რესურსი წაიშალა" },
      resource_edited: { icon: <Package className="w-3.5 h-3.5" />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", label: "Resource Edited", labelKa: "რესურსი რედაქტირდა" },
      resource_item_added: { icon: <Package className="w-3.5 h-3.5" />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", label: "Item Added", labelKa: "ელემენტი დაემატა" },
      resource_item_removed: { icon: <Package className="w-3.5 h-3.5" />, color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", label: "Item Removed", labelKa: "ელემენტი წაიშალა" },
      resource_item_edited: { icon: <Package className="w-3.5 h-3.5" />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", label: "Item Edited", labelKa: "ელემენტი რედაქტირდა" },
      resource_reaction: { icon: <Star className="w-3.5 h-3.5" />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", label: "Reaction", labelKa: "რეაქცია" },
      attachment_added: { icon: <FileText className="w-3.5 h-3.5" />, color: "#06B6D4", bgColor: "rgba(6, 182, 212, 0.1)", label: "File Uploaded", labelKa: "ფაილი აიტვირთა" },
      attachment_removed: { icon: <FileText className="w-3.5 h-3.5" />, color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", label: "File Removed", labelKa: "ფაილი წაიშალა" },
      message_sent: { icon: <MessageCircle className="w-3.5 h-3.5" />, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", label: "Message Sent", labelKa: "შეტყობინება გაიგზავნა" },
      project_created: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", label: "Project Created", labelKa: "პროექტი შეიქმნა" },
      project_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", label: "Project Completed", labelKa: "პროექტი დასრულდა" },
      price_updated: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", label: "Price Updated", labelKa: "ფასი განახლდა" },
      deadline_updated: { icon: <Calendar className="w-3.5 h-3.5" />, color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", label: "Deadline Updated", labelKa: "ვადა განახლდა" },
    };
    return configs[eventType] || { icon: <History className="w-3.5 h-3.5" />, color: "#6B7280", bgColor: "rgba(107, 114, 128, 0.1)", label: eventType, labelKa: eventType };
  };

  // Generate event description
  const getEventDescription = (event: HistoryEvent): string => {
    const meta = event.metadata;
    switch (event.eventType) {
      case "stage_changed":
        const fromLabel = STAGES.find(s => s.key === meta?.fromStage);
        const toLabel = STAGES.find(s => s.key === meta?.toStage);
        return locale === "ka"
          ? `${fromLabel?.labelKa || meta?.fromStage || "—"} → ${toLabel?.labelKa || meta?.toStage}`
          : `${fromLabel?.label || meta?.fromStage || "—"} → ${toLabel?.label || meta?.toStage}`;
      case "poll_created":
        return `"${meta?.pollTitle}"`;
      case "poll_voted":
      case "poll_option_selected":
        return `"${meta?.pollTitle}" - ${meta?.optionText}`;
      case "resource_added":
      case "resource_removed":
      case "resource_edited":
        return meta?.resourceName || "";
      case "resource_item_added":
      case "resource_item_removed":
      case "resource_item_edited":
        return `${meta?.itemName} (${meta?.resourceName})`;
      case "resource_reaction":
        return `${meta?.reactionType} - ${meta?.itemName}`;
      case "attachment_added":
      case "attachment_removed":
        return meta?.fileName || "";
      default:
        return meta?.description || "";
    }
  };

  // Format history time
  const formatHistoryTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60) return locale === "ka" ? `${diffMins} წთ წინ` : `${diffMins}m ago`;
    if (diffHours < 24) return locale === "ka" ? `${diffHours} სთ წინ` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === "ka" ? `${diffDays} დღე წინ` : `${diffDays}d ago`;
    return date.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", { month: "short", day: "numeric" });
  };

  const filteredHistory = historyFilter === "all"
    ? historyEvents
    : historyEvents.filter(e => e.userRole === historyFilter);

  const renderHistoryTab = () => (
    <div className="flex flex-col h-[380px] sm:h-[420px]">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
        {[
          { key: "all", label: "All", labelKa: "ყველა" },
          { key: "client", label: "Client", labelKa: "კლიენტი" },
          { key: "pro", label: "Pro", labelKa: "სპეციალისტი" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setHistoryFilter(f.key as typeof historyFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              historyFilter === f.key
                ? "text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
            style={historyFilter === f.key ? { backgroundColor: TERRACOTTA.primary } : {}}
          >
            {locale === "ka" ? f.labelKa : f.label}
          </button>
        ))}
      </div>

      {/* History Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" color={TERRACOTTA.primary} />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <History className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {t('projects.noHistoryYet')}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

            {/* Events */}
            <div className="space-y-4">
              {filteredHistory.map((event, idx) => {
                const config = getEventConfig(event.eventType);
                const description = getEventDescription(event);

                return (
                  <div key={idx} className="relative flex items-start gap-3 pl-1">
                    {/* Icon */}
                    <div
                      className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                      style={{ backgroundColor: config.bgColor, color: config.color }}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {event.userName}
                        </span>
                        <Badge variant={event.userRole === "client" ? "info" : "success"} size="xs">
                          {event.userRole === "client"
                            ? (t('common.client'))
                            : (t('projects.pro'))}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {locale === "ka" ? config.labelKa : config.label}
                        {description && (
                          <span className="text-neutral-500"> · {description}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        {formatHistoryTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Header with Hero */}
      <div className="relative">
        {/* Background Image */}
        <div className="h-20 sm:h-24 relative overflow-hidden">
          {firstImage ? (
            <Image src={storage.getFileUrl(firstImage)} alt="Project" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary} 0%, ${TERRACOTTA.light} 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        </div>

        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              #{job.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white line-clamp-1">{job.title}</h3>
        </div>
      </div>

      {/* Role Banner - Shows clearly who owns the job */}
      <RoleBanner
        isClient={isClient}
        isCompleted={isProjectCompleted}
        isConfirmed={isProjectConfirmed}
        partnerName={partnerName || ""}
        completedAt={project.completedAt}
        locale={locale}
      />

      {/* Inline Stage Stepper - Only show when not fully completed */}
      {!isFullyCompleted && (
        <div className="border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <InlineStageStepper
            currentStage={localStage}
            locale={locale}
            isPro={!isClient}
            isUpdating={isUpdatingStage}
            onStageChange={handleStageChange}
            onClientConfirm={handleClientConfirm}
            onClientRequestChanges={handleClientRequestChanges}
            isClientConfirmed={!!project.clientConfirmedAt}
            hasReview={hasSubmittedReview}
            onLeaveReview={() => setShowReviewModal(true)}
          />
        </div>
      )}

      {/* Tab Navigation - Simplified when completed */}
      {isFullyCompleted ? (
        // Completed: Only show Overview and History tabs
        <div className="flex items-center justify-center gap-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<CheckCircle2 className="w-4 h-4" />}
            label={t('projects.summary')}
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<History className="w-4 h-4" />}
            label={t('projects.history')}
          />
        </div>
      ) : (
        // Active: Show all tabs
        <div className="flex items-center justify-around border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<Eye className="w-4 h-4" />}
            label={t('projects.overview')}
          />
          <TabButton
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
            icon={<MessageCircle className="w-4 h-4" />}
            label={t('projects.chat')}
            badge={unreadCount}
            disabled={!isProjectStarted}
            disabledTooltip={notStartedTooltip}
          />
          <TabButton
            active={activeTab === "polls"}
            onClick={() => setActiveTab("polls")}
            icon={<BarChart3 className="w-4 h-4" />}
            label={t('projects.polls')}
            badge={unreadPollsCount}
            disabled={!isProjectStarted}
            disabledTooltip={notStartedTooltip}
          />
          <TabButton
            active={activeTab === "materials"}
            onClick={() => setActiveTab("materials")}
            icon={<FolderOpen className="w-4 h-4" />}
            label={t('projects.materials')}
            badge={unreadMaterialsCount}
            disabled={!isProjectStarted}
            disabledTooltip={notStartedTooltip}
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<History className="w-4 h-4" />}
            label={locale === "ka" ? "ისტორია" : "History"}
            disabled={!isProjectStarted}
            disabledTooltip={notStartedTooltip}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[180px]">
        {/* When fully completed, show CompletedSummary instead of regular overview */}
        {activeTab === "overview" && isFullyCompleted && (
          <CompletedSummary
            project={project}
            job={job}
            isClient={isClient}
            locale={locale}
            partnerName={partnerName || ""}
            partnerAvatar={partnerAvatar}
            hasReview={hasSubmittedReview}
            onLeaveReview={() => setShowReviewModal(true)}
          />
        )}
        {activeTab === "overview" && !isFullyCompleted && renderOverviewTab()}
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "polls" && renderPollsTab()}
        {activeTab === "materials" && renderMaterialsTab()}
        {activeTab === "history" && renderHistoryTab()}
      </div>

      {/* Bottom Action Bar - Partner Info + Actions */}
      <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Partner Info */}
          <Link
            href={isClient ? `/professionals/${project.proId?.id}` : `/users/${project.clientId?.id}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Avatar
                src={partnerAvatar}
                name={partnerName}
                size="md"
                className="w-10 h-10 ring-2 ring-neutral-100 dark:ring-neutral-700"
              />
              {/* Completed checkmark badge on avatar */}
              {isFullyCompleted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {partnerName}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {isClient
                  ? (partnerTitle || (t('common.professional')))
                  : (t('common.client'))
                }
              </p>
            </div>
          </Link>

          {/* Quick Actions - Simplified when completed */}
          <div className="flex items-center gap-2">
            {/* Show phone button only when project is active */}
            {!isFullyCompleted && isClient && partnerPhone && (
              phoneRevealed ? (
                <a
                  href={`tel:${partnerPhone}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{partnerPhone}</span>
                </a>
              ) : (
                <button
                  onClick={() => setPhoneRevealed(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  style={{ color: TERRACOTTA.primary }}
                >
                  <Phone className="w-4 h-4" />
                </button>
              )
            )}
            <Link
              href={`/jobs/${job.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 ${
                isFullyCompleted 
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300" 
                  : "text-white"
              }`}
              style={!isFullyCompleted ? { backgroundColor: TERRACOTTA.primary } : {}}
            >
              {isFullyCompleted 
                ? (t('common.view'))
                : (t('common.details'))
              }
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <MediaLightbox
        items={allImageAttachments}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        showThumbnails={allImageAttachments.length > 1}
        showCounter={allImageAttachments.length > 1}
        showInfo={false}
        getImageUrl={(url) => url}
        locale={locale as "en" | "ka" | "ru"}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setIsCompletionFlow(false);
          onRefresh?.();
        }}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
        locale={locale}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        text={reviewText}
        onTextChange={setReviewText}
        pro={{
          avatar: partnerAvatar,
          userId: {
            name: partnerName || "",
            avatar: partnerAvatar,
          },
          title: partnerTitle,
        }}
        isCompletionFlow={isCompletionFlow}
      />

      {/* Portfolio Completion Modal (Pro completing job) */}
      <PortfolioCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          setPortfolioImages([]);
        }}
        onComplete={handleCompleteWithPortfolio}
        isLoading={isUpdatingStage}
        locale={locale}
        portfolioImages={portfolioImages}
        onImagesChange={setPortfolioImages}
        isUploading={isUploadingPortfolio}
        onUpload={handlePortfolioUpload}
      />
    </div>
  );
}
