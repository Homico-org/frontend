"use client";

import {
  useCategories,
  type CatalogServiceItem,
  type CatalogUnitOption,
} from "@/contexts/CategoriesContext";
import Avatar from "@/components/common/Avatar";
import BackButton from "@/components/common/BackButton";
import ConfettiBurst from "@/components/common/ConfettiBurst";
import ResponseTimeChip from "@/components/professionals/ResponseTimeChip";
import { isRecentlyActive } from "@/utils/onlinePresence";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import DatePicker from "@/components/common/DatePicker";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MediaLightbox from "@/components/common/MediaLightbox";
import Select from "@/components/common/Select";
import ClientCard from "@/components/jobs/ClientCard";
import InviteProsModal from "@/components/jobs/InviteProsModal";
import JobCommentsSection from "@/components/jobs/JobCommentsSection";
import MyProposalCard from "@/components/jobs/MyProposalCard";
import ProjectSidebar, {
  ProjectSidebarMobile,
  ProjectSidebarTab,
} from "@/components/jobs/ProjectSidebar";
import ProjectStatusBar from "@/components/jobs/ProjectStatusBar";
import ProposalFormModal from "@/components/jobs/ProposalFormModal";
import RequirementBadge from "@/components/jobs/RequirementBadge";
import ReviewModal from "@/components/jobs/ReviewModal";
import SpecCard from "@/components/jobs/SpecCard";
import PollsTab from "@/components/polls/PollsTab";
import PortfolioCompletionModal from "@/components/projects/PortfolioCompletionModal";
import ProjectChat from "@/components/projects/ProjectChat";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/Checkbox";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { ACCENT_COLOR as ACCENT, ACCENT_LIGHT } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useHaptic } from "@/hooks/useHaptic";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type {
  Job,
  JobClient,
  MediaItem,
  ProjectStage,
  Proposal,
} from "@/types/shared";
import { formatBudget as formatBudgetUtil } from "@/utils/currencyUtils";
import { formatDateMonthDay, formatTimeAgoCompact } from "@/utils/dateUtils";
import {
  AlertCircle,
  Armchair,
  BadgeCheck,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  DoorOpen,
  Edit3,
  ExternalLink,
  Eye,
  Facebook,
  FileText,
  Hammer,
  History,
  Home,
  Instagram,
  Layers,
  Map,
  MapPin,
  Maximize2,
  MessageCircle,
  Mountain,
  Package,
  Phone,
  Play,
  RotateCcw,
  Ruler,
  Send,
  Share2,
  Box,
  Star,
  Trash2,
  UserPlus,
  Users,
  Vote,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { useCountUp } from "@/hooks/useCountUp";
import { currencySymbol } from "@/utils/currency";
// Stages table is shared with components/jobs/ProjectStatusBar.tsx so a
// rename or progress-percentage tweak only needs one edit. This file
// doesn't render stage icons (the timeline uses numerals + a Check), so
// the imported data has no icon JSX - just label/labelKa/progress.
import {
  PROJECT_STAGES as STAGES,
  getProjectStageIndex as getStageIndex,
} from "@/constants/projectStages";

// Extended Job type for this page with additional client fields
interface PageJob extends Omit<Job, "clientId"> {
  clientId: JobClient & { email?: string; phone?: string };
  updatedAt?: string;
}

// Services view-model types. `mode` controls which price expression
// renders on the row and which roll-up bucket the line contributes to:
//   fixed      -> `lineFixed` is the qty × unitPrice total
//   range      -> `[lineMin, lineMax]` from catalog price metadata
//   negotiable -> no price; shown as a pill, counted in footer
type ServiceLine = {
  key: string;
  name: string;
  unitLabel: string;
  qty: number;
  mode: "fixed" | "range" | "negotiable";
  lineFixed?: number;
  lineMin?: number;
  lineMax?: number;
};
type ServiceGroup = {
  key: string;
  name: string;
  items: ServiceLine[];
};
type ServicesView = {
  groups: ServiceGroup[];
  fixedTotal: number;
  rangeMin: number;
  rangeMax: number;
  negotiableCount: number;
  rangeCount: number;
  fixedCount: number;
};

// i18n translation keys for property types, conditions, and work types
const propertyTypeKeys: Record<string, string> = {
  apartment: "jobDetail.propertyType.apartment",
  house: "jobDetail.propertyType.house",
  office: "jobDetail.propertyType.office",
  building: "jobDetail.propertyType.building",
  other: "jobDetail.propertyType.other",
};

const conditionKeys: Record<string, string> = {
  shell: "jobDetail.condition.shell",
  "black-frame": "jobDetail.condition.blackFrame",
  "needs-renovation": "jobDetail.condition.needsRenovation",
  "partial-renovation": "jobDetail.condition.partialRenovation",
  good: "jobDetail.condition.good",
};

const workTypeKeys: Record<string, string> = {
  Demolition: "jobDetail.workType.demolition",
  "Wall Construction": "jobDetail.workType.wallConstruction",
  Electrical: "jobDetail.workType.electrical",
  Plumbing: "jobDetail.workType.plumbing",
  Flooring: "jobDetail.workType.flooring",
  Painting: "jobDetail.workType.painting",
  Tiling: "jobDetail.workType.tiling",
  Ceiling: "jobDetail.workType.ceiling",
  "Windows & Doors": "jobDetail.workType.windowsDoors",
  HVAC: "jobDetail.workType.hvac",
};

// Category illustrations for jobs without images
const getCategoryIllustration = (
  category?: string,
  subcategory?: string,
): React.ReactNode => {
  const key = subcategory || category || "other";

  const illustrations: Record<string, React.ReactNode> = {
    // Renovation categories
    renovation: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="renovGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#renovGrad)" width="200" height="200" />
        <g fill="none" stroke={ACCENT} strokeWidth="1.5" opacity="0.6">
          <rect x="40" y="60" width="120" height="100" rx="4" />
          <line x1="40" y1="90" x2="160" y2="90" />
          <rect x="55" y="105" width="30" height="40" rx="2" />
          <rect x="115" y="105" width="30" height="40" rx="2" />
          <circle cx="100" cy="45" r="15" />
          <path d="M85 45 L100 30 L115 45" />
        </g>
        <g fill={ACCENT} opacity="0.4">
          <circle cx="170" cy="40" r="3" />
          <circle cx="30" cy="150" r="4" />
          <circle cx="175" cy="170" r="2" />
        </g>
      </svg>
    ),
    plumbing: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="plumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#plumbGrad)" width="200" height="200" />
        <g fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6">
          <path d="M60 50 L60 100 L100 100 L100 150" />
          <path d="M140 50 L140 80 L100 80 L100 100" />
          <circle cx="100" cy="100" r="10" />
          <rect x="85" y="150" width="30" height="20" rx="3" />
          <ellipse cx="60" cy="45" rx="10" ry="5" />
          <ellipse cx="140" cy="45" rx="10" ry="5" />
        </g>
        <g fill="#3B82F6" opacity="0.3">
          <circle cx="70" cy="130" r="4" />
          <circle cx="130" cy="120" r="3" />
          <circle cx="90" cy="60" r="2" />
        </g>
      </svg>
    ),
    electrical: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="elecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#elecGrad)" width="200" height="200" />
        <g fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.7">
          <path d="M100 30 L85 80 L105 80 L90 130 L120 70 L100 70 L115 30 Z" />
          <circle cx="100" cy="160" r="20" />
          <line x1="100" y1="140" x2="100" y2="130" />
        </g>
        <g fill="#F59E0B" opacity="0.3">
          <circle cx="50" cy="60" r="5" />
          <circle cx="150" cy="50" r="4" />
          <circle cx="160" cy="140" r="3" />
          <circle cx="40" cy="150" r="4" />
        </g>
      </svg>
    ),
    painting: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="paintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#paintGrad)" width="200" height="200" />
        <g fill="none" stroke="#EC4899" strokeWidth="2" opacity="0.6">
          <rect x="50" y="40" width="60" height="80" rx="5" />
          <rect x="60" y="120" width="40" height="50" rx="2" />
          <path
            d="M90 60 Q120 80 90 100"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
        <g fill="#8B5CF6" opacity="0.4">
          <circle cx="150" cy="60" r="15" />
          <circle cx="160" cy="140" r="10" />
          <circle cx="40" cy="160" r="8" />
        </g>
      </svg>
    ),
    flooring: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D2691E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#floorGrad)" width="200" height="200" />
        <g fill="none" stroke="#8B4513" strokeWidth="1.5" opacity="0.5">
          <path d="M20 100 L100 60 L180 100 L100 140 Z" />
          <path d="M20 100 L20 140 L100 180 L100 140" />
          <path d="M180 100 L180 140 L100 180 L100 140" />
          <line x1="60" y1="80" x2="60" y2="160" />
          <line x1="140" y1="80" x2="140" y2="160" />
        </g>
        <g fill="#D2691E" opacity="0.3">
          <rect x="40" y="30" width="30" height="15" rx="2" />
          <rect x="130" y="25" width="25" height="12" rx="2" />
        </g>
      </svg>
    ),
    tiling: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#tileGrad)" width="200" height="200" />
        <g fill="none" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={30 + col * 38}
                y={30 + row * 38}
                width="35"
                height="35"
                rx="2"
              />
            )),
          )}
        </g>
        <g fill="#06B6D4" opacity="0.2">
          <rect x="30" y="30" width="35" height="35" rx="2" />
          <rect x="106" y="68" width="35" height="35" rx="2" />
          <rect x="68" y="144" width="35" height="35" rx="2" />
        </g>
      </svg>
    ),
    hvac: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="hvacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#hvacGrad)" width="200" height="200" />
        <g fill="none" stroke="#10B981" strokeWidth="2" opacity="0.6">
          <rect x="40" y="60" width="120" height="60" rx="8" />
          <line x1="60" y1="80" x2="140" y2="80" />
          <line x1="60" y1="95" x2="140" y2="95" />
          <line x1="60" y1="110" x2="140" y2="110" />
          <path d="M80 140 Q100 160 120 140" strokeLinecap="round" />
          <path d="M70 150 Q100 175 130 150" strokeLinecap="round" />
        </g>
        <g fill="#3B82F6" opacity="0.3">
          <circle cx="50" cy="45" r="5" />
          <circle cx="150" cy="40" r="4" />
          <circle cx="170" cy="160" r="6" />
        </g>
      </svg>
    ),
    // Design categories
    design: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="designGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#designGrad)" width="200" height="200" />
        <g fill="none" stroke="#8B5CF6" strokeWidth="2" opacity="0.6">
          <rect x="40" y="50" width="80" height="100" rx="3" />
          <rect x="50" y="65" width="60" height="40" rx="2" />
          <rect x="50" y="115" width="25" height="25" rx="2" />
          <circle cx="140" cy="80" r="25" />
          <path d="M125 95 L140 80 L155 95" />
          <path d="M130 140 L150 120 L170 140 L150 160 Z" />
        </g>
      </svg>
    ),
    interior: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="intGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#intGrad)" width="200" height="200" />
        <g fill="none" stroke={ACCENT} strokeWidth="1.5" opacity="0.6">
          <rect x="30" y="100" width="60" height="60" rx="3" />
          <rect x="35" y="105" width="50" height="30" rx="2" />
          <rect x="110" y="80" width="60" height="80" rx="3" />
          <ellipse cx="140" cy="70" rx="20" ry="8" />
          <line x1="140" y1="78" x2="140" y2="100" />
          <rect x="50" y="40" width="40" height="30" rx="2" />
        </g>
        <g fill="#8B5CF6" opacity="0.3">
          <circle cx="170" cy="40" r="8" />
          <circle cx="30" cy="50" r="5" />
        </g>
      </svg>
    ),
    "interior-design": (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="intDesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#intDesGrad)" width="200" height="200" />
        <g fill="none" stroke={ACCENT} strokeWidth="1.5" opacity="0.6">
          <rect x="30" y="100" width="60" height="60" rx="3" />
          <rect x="35" y="105" width="50" height="30" rx="2" />
          <rect x="110" y="80" width="60" height="80" rx="3" />
          <ellipse cx="140" cy="70" rx="20" ry="8" />
          <line x1="140" y1="78" x2="140" y2="100" />
          <rect x="50" y="40" width="40" height="30" rx="2" />
        </g>
        <g fill="#8B5CF6" opacity="0.3">
          <circle cx="170" cy="40" r="8" />
          <circle cx="30" cy="50" r="5" />
        </g>
      </svg>
    ),
    // Architecture categories
    architecture: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#archGrad)" width="200" height="200" />
        <g fill="none" stroke="#1E40AF" strokeWidth="1.5" opacity="0.6">
          <path d="M100 30 L40 70 L40 160 L160 160 L160 70 Z" />
          <rect x="60" y="90" width="30" height="40" rx="2" />
          <rect x="110" y="90" width="30" height="40" rx="2" />
          <rect x="80" y="130" width="40" height="30" rx="2" />
          <line x1="100" y1="130" x2="100" y2="160" />
          <circle cx="100" cy="55" r="10" />
        </g>
        <g fill="#1E40AF" opacity="0.2">
          <polygon points="100,20 30,65 30,60 100,15 170,60 170,65" />
        </g>
      </svg>
    ),
    residential: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="resGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#resGrad)" width="200" height="200" />
        <g fill="none" stroke="#059669" strokeWidth="1.5" opacity="0.6">
          <path d="M100 40 L40 80 L40 160 L160 160 L160 80 Z" />
          <rect x="80" y="110" width="40" height="50" rx="2" />
          <rect x="55" y="90" width="25" height="25" rx="2" />
          <rect x="120" y="90" width="25" height="25" rx="2" />
          <path d="M30 160 L30 170 L170 170 L170 160" />
        </g>
        <g fill="#059669" opacity="0.2">
          <ellipse cx="50" cy="155" rx="15" ry="8" />
          <ellipse cx="150" cy="155" rx="15" ry="8" />
        </g>
      </svg>
    ),
    commercial: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="commGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#commGrad)" width="200" height="200" />
        <g fill="none" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.6">
          <rect x="50" y="40" width="100" height="120" rx="3" />
          {[0, 1, 2, 3, 4].map((row) => (
            <g key={row}>
              <rect x="60" y={50 + row * 22} width="15" height="15" rx="1" />
              <rect x="85" y={50 + row * 22} width="15" height="15" rx="1" />
              <rect x="110" y={50 + row * 22} width="15" height="15" rx="1" />
              <rect x="135" y={50 + row * 22} width="15" height="15" rx="1" />
            </g>
          ))}
        </g>
      </svg>
    ),
    landscape: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#15803D" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#landGrad)" width="200" height="200" />
        <g fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.6">
          <ellipse cx="60" cy="120" rx="30" ry="20" />
          <line x1="60" y1="100" x2="60" y2="60" />
          <ellipse cx="60" cy="55" rx="25" ry="20" />
          <ellipse cx="140" cy="130" rx="25" ry="15" />
          <line x1="140" y1="115" x2="140" y2="80" />
          <ellipse cx="140" cy="75" rx="20" ry="15" />
          <path d="M20 160 Q60 140 100 160 Q140 180 180 160" />
        </g>
        <g fill="#15803D" opacity="0.2">
          <circle cx="60" cy="55" r="20" />
          <circle cx="140" cy="75" r="15" />
        </g>
      </svg>
    ),
    // Services categories
    services: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="servGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#servGrad)" width="200" height="200" />
        <g fill="none" stroke="#6366F1" strokeWidth="2" opacity="0.6">
          <circle cx="100" cy="100" r="50" />
          <path d="M100 50 L100 100 L130 120" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill="#6366F1" opacity="0.3" />
        </g>
        <g fill="#6366F1" opacity="0.3">
          <circle cx="50" cy="50" r="6" />
          <circle cx="150" cy="60" r="5" />
          <circle cx="160" cy="150" r="7" />
          <circle cx="40" cy="140" r="4" />
        </g>
      </svg>
    ),
    cleaning: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="cleanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#cleanGrad)" width="200" height="200" />
        <g fill="none" stroke="#06B6D4" strokeWidth="2" opacity="0.6">
          <ellipse cx="100" cy="140" rx="40" ry="20" />
          <path d="M70 140 L70 60 Q70 50 80 50 L120 50 Q130 50 130 60 L130 140" />
          <ellipse cx="100" cy="50" rx="30" ry="10" />
          <path d="M60 100 Q40 80 60 60" strokeLinecap="round" />
          <path d="M140 100 Q160 80 140 60" strokeLinecap="round" />
        </g>
        <g fill="#06B6D4" opacity="0.3">
          <circle cx="45" cy="70" r="5" />
          <circle cx="155" cy="75" r="4" />
          <circle cx="100" cy="30" r="3" />
        </g>
      </svg>
    ),
    moving: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="moveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#moveGrad)" width="200" height="200" />
        <g fill="none" stroke="#F97316" strokeWidth="2" opacity="0.6">
          <rect x="40" y="80" width="120" height="60" rx="5" />
          <rect x="30" y="90" width="20" height="40" rx="3" />
          <circle cx="70" cy="155" r="15" />
          <circle cx="130" cy="155" r="15" />
          <rect x="60" y="50" width="40" height="30" rx="2" />
          <rect x="110" y="55" width="30" height="25" rx="2" />
        </g>
      </svg>
    ),
    gardening: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="gardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#gardGrad)" width="200" height="200" />
        <g fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.6">
          <path d="M100 160 L100 100" />
          <ellipse cx="100" cy="80" rx="30" ry="25" />
          <path d="M80 90 Q100 60 120 90" />
          <ellipse cx="60" cy="110" rx="20" ry="15" />
          <ellipse cx="140" cy="105" rx="18" ry="12" />
          <path d="M60 160 Q80 150 100 160 Q120 170 140 160" />
        </g>
        <g fill="#22C55E" opacity="0.2">
          <ellipse cx="100" cy="75" rx="20" ry="15" />
        </g>
      </svg>
    ),
    // Craftsmen categories
    craftsmen: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="craftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78716C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#78716C" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#craftGrad)" width="200" height="200" />
        <g fill="none" stroke="#78716C" strokeWidth="2" opacity="0.6">
          <path d="M70 50 L70 100 L50 100 L50 160 L90 160 L90 100 L70 100" />
          <rect x="110" y="80" width="50" height="30" rx="3" />
          <rect x="120" y="110" width="10" height="50" rx="2" />
          <rect x="140" y="110" width="10" height="50" rx="2" />
          <circle cx="135" cy="65" r="15" />
        </g>
      </svg>
    ),
    handyman: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="handyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#handyGrad)" width="200" height="200" />
        <g fill="none" stroke="#EAB308" strokeWidth="2" opacity="0.6">
          <rect x="80" y="40" width="40" height="120" rx="5" />
          <rect x="90" y="50" width="20" height="30" rx="2" />
          <line x1="100" y1="90" x2="100" y2="150" strokeWidth="4" />
          <path d="M60 100 L80 100" />
          <path d="M120 100 L140 100" />
          <circle cx="50" cy="100" r="10" />
          <circle cx="150" cy="100" r="10" />
        </g>
      </svg>
    ),
    carpentry: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="carpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#92400E" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#carpGrad)" width="200" height="200" />
        <g fill="none" stroke="#92400E" strokeWidth="2" opacity="0.6">
          <rect x="40" y="100" width="120" height="20" rx="2" />
          <rect x="55" y="120" width="15" height="40" rx="1" />
          <rect x="130" y="120" width="15" height="40" rx="1" />
          <path d="M100 40 L80 100 M100 40 L120 100" />
          <rect x="90" y="30" width="20" height="15" rx="2" />
        </g>
        <g fill="#92400E" opacity="0.2">
          <rect x="40" y="100" width="120" height="20" rx="2" />
        </g>
      </svg>
    ),
    // Default/Other
    other: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="otherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect fill="url(#otherGrad)" width="200" height="200" />
        <g fill="none" stroke={ACCENT} strokeWidth="2" opacity="0.6">
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="25" />
          <circle cx="100" cy="100" r="10" />
          <line x1="100" y1="55" x2="100" y2="40" />
          <line x1="100" y1="145" x2="100" y2="160" />
          <line x1="55" y1="100" x2="40" y2="100" />
          <line x1="145" y1="100" x2="160" y2="100" />
        </g>
      </svg>
    ),
  };

  // Try to find exact match first, then category match, then fallback
  return (
    illustrations[key] ||
    illustrations[category || "other"] ||
    illustrations.other
  );
};

export default function JobDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthValidated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const cl = useCountryLink();

  const { t, pick } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { categories: catalogCats } = useCategories();

  const getLabel = useCallback((key: string): string => {
    for (const cat of catalogCats) {
      if (cat.key === key) return pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories) {
        if (sub.key === key) return pick({ en: sub.name, ka: sub.nameKa });
        for (const svc of (sub.services || [])) {
          if (svc.key === key) return pick({ en: svc.name, ka: svc.nameKa });
        }
      }
    }
    return getCategoryLabel(key);
  }, [catalogCats, pick, getCategoryLabel]);
  const { trackEvent } = useAnalytics();
  const toast = useToast();
  const haptic = useHaptic();

  const [job, setJob] = useState<PageJob | null>(null);
  // One-shot flag for the hire celebration. Toggles true on the
  // accept success path; ConfettiBurst auto-cleans after its
  // animation runs. Reset to false after the burst window so a
  // subsequent re-hire (e.g. testing) can trigger again.
  const [hireCelebration, setHireCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [isCheckingProposal, setIsCheckingProposal] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: "",
    proposedPrice: "",
    estimatedDuration: "",
    estimatedDurationUnit: "days",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null,
  );
  const [selectedRefImageIndex, setSelectedRefImageIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteProsModal, setShowInviteProsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [isPollsExpanded, setIsPollsExpanded] = useState(true);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Sidebar navigation state for hired projects
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<ProjectSidebarTab>("details");

  // Unread counts for sidebar badges
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadPollsCount, setUnreadPollsCount] = useState(0);
  const [unreadResourcesCount, setUnreadResourcesCount] = useState(0);

  // History state
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

  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "client" | "pro">(
    "all",
  );
  const historyLoadedRef = useRef(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isCompletionFlow, setIsCompletionFlow] = useState(false);

  // Inline editing state
  const [showDescriptionEdit, setShowDescriptionEdit] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Property details inline edit
  const [showPropertyEdit, setShowPropertyEdit] = useState(false);
  const [editPropertyData, setEditPropertyData] = useState({
    propertyType: "",
    propertyTypeOther: "",
    currentCondition: "",
    areaSize: "",
    landArea: "",
    roomCount: "",
    floorCount: "",
    pointsCount: "",
    cadastralId: "",
    deadline: "",
  });
  const [isSavingProperty, setIsSavingProperty] = useState(false);

  // Work types inline edit
  const [showWorkTypesEdit, setShowWorkTypesEdit] = useState(false);
  const [editWorkTypes, setEditWorkTypes] = useState<string[]>([]);
  const [isSavingWorkTypes, setIsSavingWorkTypes] = useState(false);

  // Requirements inline edit
  const [showRequirementsEdit, setShowRequirementsEdit] = useState(false);
  const [editRequirements, setEditRequirements] = useState({
    furnitureIncluded: false,
    visualizationNeeded: false,
    materialsProvided: false,
    occupiedDuringWork: false,
  });
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);

  // Title inline edit
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Proposals/applicants for job owner
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  const isOwner = user && job?.clientId && user.id === job.clientId.id;
  const isPro = user?.role === "pro" || user?.role === "admin";
  const isVerified = !!user?.isPhoneVerified;

  // Store pro info from project tracking as fallback when job.hiredPro is missing.
  // Declared here (above getHiredProUserId) because that function reads it -
  // having the useState below the function caused a temporal-dead-zone
  // ReferenceError when the function ran during the same render that
  // declared the state. The other socket/tracking state stays grouped
  // further down where it's consumed.
  const [projectProId, setProjectProId] = useState<string | null>(null);

  // Check if current user is the hired pro for this job
  // hiredPro structure can vary:
  // - hiredPro.id is the pro's user ID at top level
  // - hiredPro.userId can be a string ID or a populated object { id, name, avatar }
  // - After _id->id transform, it might be in different places
  const getHiredProUserId = (): string | null => {
    if (job?.hiredPro) {
      const hiredPro = job.hiredPro as {
        userId?: string | { id?: string; _id?: string };
        id?: string;
        _id?: string;
      };

      // Try top-level id first
      if (hiredPro.id) return hiredPro.id;
      if (hiredPro._id) return hiredPro._id;

      // Fallback to userId
      if (hiredPro.userId) {
        if (typeof hiredPro.userId === "string") return hiredPro.userId;
        if (typeof hiredPro.userId === "object") {
          const idFromPopulated =
            hiredPro.userId.id || hiredPro.userId._id;
          if (idFromPopulated) return idFromPopulated;
        }
      }
    }

    // Last resort: fall through to the proId we stashed from the
    // project-tracking record. Without this, a pro whose `job.hiredPro`
    // payload arrives without id/_id fields (e.g. a lean populated
    // path) would be treated as a non-hired visitor and locked out of
    // their own workspace even though the project tracking knows full
    // well that they are the hired pro.
    return projectProId || null;
  };
  const hiredProUserId = getHiredProUserId();
  // User is the hired pro if:
  // 1. They're a pro and hiredPro.id matches their id, OR
  // 2. They're a pro and their proposal was accepted
  const isHiredPro =
    isPro &&
    ((job?.hiredPro && user?.id === hiredProUserId) ||
      myProposal?.status === "accepted");

  // Socket and project tracking state (moved outside conditional to follow hooks rules)
  const socketRef = useRef<Socket | null>(null);
  const [projectStage, setProjectStage] = useState<ProjectStage>("hired");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isClientConfirmed, setIsClientConfirmed] = useState(false);
  // Portfolio completion modal state. When the pro tries to advance to
  // COMPLETED, we open this modal to collect the after-photos that will
  // be promoted into their public portfolio. Previously the modal
  // component existed but was never wired in, so portfolios stayed empty
  // even though the backend supported it end-to-end.
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  // Refresh ticks bumped by WebSocket events for the two child tabs that
  // own their own data fetch. Children watch these as a useEffect dep to
  // re-pull from the server when the other participant mutates state.
  const [pollsRefreshTick, setPollsRefreshTick] = useState(0);
  const [materialsRefreshTick, setMaterialsRefreshTick] = useState(0);

  const allMedia: MediaItem[] = job
    ? [
        ...(job.media || []),
        ...(job.images || [])
          .filter((img) => !job.media?.some((m) => m.url === img))
          .map((url) => ({ type: "image" as const, url })),
      ]
    : [];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // WebSocket connection for real-time updates (for hired pro or client)
  useEffect(() => {
    if (!job?.id || !user) return;

    // Only connect if user is the owner (client) or the hired pro
    const shouldConnect = isOwner || isHiredPro;
    if (!shouldConnect) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    socketRef.current = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      // Join the project room for this job
      socketRef.current?.emit("joinProjectChat", job.id);
    });

    // Listen for project stage updates
    socketRef.current.on(
      "projectStageUpdate",
      (data: { jobId: string; stage: string; progress: number }) => {
        if (data.jobId === job.id) {
          setProjectStage(data.stage as ProjectStage);
        }
      },
    );

    // Bump a refresh tick so PollsTab / ProjectWorkspace refetch when the
    // other side creates/votes/closes/deletes a poll or edits the
    // materials board. Previously these listeners were no-ops and the
    // children stayed on their initial fetch until the user clicked
    // away and back; both sides would see stale state during a live
    // back-and-forth.
    socketRef.current.on("projectPollUpdate", () => {
      setPollsRefreshTick((tick) => tick + 1);
    });

    socketRef.current.on("projectMaterialsUpdate", () => {
      setMaterialsRefreshTick((tick) => tick + 1);
    });

    return () => {
      socketRef.current?.emit("leaveProjectChat", job.id);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [job?.id, user, isOwner, isHiredPro]);

  // Check if owner has already submitted a review for this job
  useEffect(() => {
    if (!isOwner || !user || !job?.id || job?.status !== "completed") return;

    const controller = new AbortController();
    const checkReview = async () => {
      try {
        const response = await api.get(`/reviews/check/job/${job.id}`, {
          signal: controller.signal,
        });
        if (response.data?.hasReview) {
          setHasSubmittedReview(true);
        }
      } catch {
        // Ignore errors (including CanceledError from Strict Mode remount)
      }
    };

    checkReview();
    return () => controller.abort();
  }, [isOwner, user, job?.id, job?.status]);

  // Fetch history when expanded and not loaded yet. Shared abort ref so
  // a Strict Mode double-mount or a rapid tab switch cancels the prior
  // in-flight request instead of letting two concurrent /history calls
  // race for the same setHistoryEvents.
  const fetchHistoryAbortRef = useRef<AbortController | null>(null);
  const fetchHistory = useCallback(async () => {
    if (!job?.id) return;
    fetchHistoryAbortRef.current?.abort();
    const controller = new AbortController();
    fetchHistoryAbortRef.current = controller;
    try {
      setIsLoadingHistory(true);
      const response = await api.get(`/jobs/projects/${job.id}/history`, {
        signal: controller.signal,
      });
      setHistoryEvents(response.data.history || []);
      historyLoadedRef.current = true;
    } catch (error) {
      if ((error as { name?: string })?.name === "CanceledError") return;
      if ((error as { code?: string })?.code === "ERR_CANCELED") return;
      console.error("Failed to fetch history:", error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingHistory(false);
      }
    }
  }, [job?.id]);

  useEffect(() => {
    const jobIsHired =
      job?.status === "in_progress" ||
      job?.status === "completed" ||
      !!job?.hiredPro;
    const shouldLoadHistory =
      (isHistoryExpanded || activeSidebarTab === "history") &&
      !historyLoadedRef.current &&
      jobIsHired;
    if (shouldLoadHistory) {
      fetchHistory();
    }
  }, [
    isHistoryExpanded,
    activeSidebarTab,
    job?.status,
    job?.hiredPro,
    job?.id,
    fetchHistory,
  ]);

  // Fetch proposals for job owner
  useEffect(() => {
    if (!job || !isOwner) return;
    const controller = new AbortController();
    setProposalsLoading(true);
    api.get(`/jobs/${job.id}/proposals`, { signal: controller.signal })
      .then(res => setProposals(res.data?.data || res.data || []))
      .catch((err) => {
        const name = (err as { name?: string })?.name;
        const code = (err as { code?: string })?.code;
        if (name === "CanceledError" || code === "ERR_CANCELED") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setProposalsLoading(false);
      });
    // `job` excluded - we only need to re-fetch when the id or
    // ownership flag changes, not on every job-object mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => controller.abort();
  }, [job?.id, isOwner]);

  // Helper to get event icon and color
  const getEventConfig = (eventType: HistoryEventType) => {
    const configs: Record<
      HistoryEventType,
      {
        icon: React.ReactNode;
        color: string;
        bgColor: string;
        label: string;
        labelKa: string;
      }
    > = {
      stage_changed: {
        icon: <Play className="w-3.5 h-3.5" />,
        color: "#3B82F6",
        bgColor: "rgba(59, 130, 246, 0.1)",
        label: "Stage Changed",
        labelKa: "სტატუსი შეიცვალა",
      },
      poll_created: {
        icon: <Vote className="w-3.5 h-3.5" />,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.1)",
        label: "Poll Created",
        labelKa: "გამოკითხვა შეიქმნა",
      },
      poll_voted: {
        icon: <Vote className="w-3.5 h-3.5" />,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.1)",
        label: "Voted",
        labelKa: "ხმა მისცა",
      },
      poll_closed: {
        icon: <Vote className="w-3.5 h-3.5" />,
        color: "#6B7280",
        bgColor: "rgba(107, 114, 128, 0.1)",
        label: "Poll Closed",
        labelKa: "გამოკითხვა დაიხურა",
      },
      poll_option_selected: {
        icon: <Check className="w-3.5 h-3.5" />,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Option Selected",
        labelKa: "ვარიანტი აირჩიეს",
      },
      resource_added: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Resource Added",
        labelKa: "რესურსი დაემატა",
      },
      resource_removed: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        label: "Resource Removed",
        labelKa: "რესურსი წაიშალა",
      },
      resource_edited: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Resource Edited",
        labelKa: "რესურსი რედაქტირდა",
      },
      resource_item_added: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Item Added",
        labelKa: "ელემენტი დაემატა",
      },
      resource_item_removed: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        label: "Item Removed",
        labelKa: "ელემენტი წაიშალა",
      },
      resource_item_edited: {
        icon: <Package className="w-3.5 h-3.5" />,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Item Edited",
        labelKa: "ელემენტი რედაქტირდა",
      },
      resource_reaction: {
        icon: <Star className="w-3.5 h-3.5" />,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Reaction",
        labelKa: "რეაქცია",
      },
      attachment_added: {
        icon: <FileText className="w-3.5 h-3.5" />,
        color: "#06B6D4",
        bgColor: "rgba(6, 182, 212, 0.1)",
        label: "File Uploaded",
        labelKa: "ფაილი აიტვირთა",
      },
      attachment_removed: {
        icon: <FileText className="w-3.5 h-3.5" />,
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        label: "File Removed",
        labelKa: "ფაილი წაიშალა",
      },
      message_sent: {
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.1)",
        label: "Message Sent",
        labelKa: "შეტყობინება გაიგზავნა",
      },
      project_created: {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Project Created",
        labelKa: "პროექტი შეიქმნა",
      },
      project_completed: {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Project Completed",
        labelKa: "პროექტი დასრულდა",
      },
      price_updated: {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Price Updated",
        labelKa: "ფასი განახლდა",
      },
      deadline_updated: {
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Deadline Updated",
        labelKa: "ვადა განახლდა",
      },
    };
    return (
      configs[eventType] || {
        icon: <History className="w-3.5 h-3.5" />,
        color: "#6B7280",
        bgColor: "rgba(107, 114, 128, 0.1)",
        label: eventType,
        labelKa: eventType,
      }
    );
  };

  // Generate event description
  const getEventDescription = (event: HistoryEvent): string => {
    const meta = event.metadata;
    switch (event.eventType) {
      case "stage_changed":
        const fromLabel = STAGES.find((s) => s.key === meta?.fromStage);
        const toLabel = STAGES.find((s) => s.key === meta?.toStage);
        return `${{ ka: fromLabel?.labelKa, en: fromLabel?.label, ru: fromLabel?.label }[locale] ?? meta?.fromStage ?? "-"} → ${{ ka: toLabel?.labelKa, en: toLabel?.label, ru: toLabel?.label }[locale] ?? meta?.toStage ?? "-"}`;
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
      case "project_completed":
        return t("projects.clientConfirmedCompletion");
      default:
        return meta?.description || "";
    }
  };

  // Format history time
  const formatHistoryTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) return formatTimeAgoCompact(dateStr, locale);
    // Older entries show date AND time-of-day. Previously they showed
    // only "15 Mar" with no time, so a pro debugging "what time did the
    // client confirm 3 days ago?" had no way to tell. 24h HH:MM matches
    // the formatting we use elsewhere in the workspace.
    const time = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${formatDateMonthDay(dateStr, locale)}, ${time}`;
  };

  // Filter the history timeline. System events (auto-completions, auto-
  // cancellations, etc.) ALWAYS render regardless of the filter - they
  // form the backbone of the timeline and hiding them would leave the
  // client/pro filter showing isolated user actions with no context.
  // Previously system rows disappeared when filtering by either role.
  const filteredHistory =
    historyFilter === "all"
      ? historyEvents
      : historyEvents.filter(
          (e) => e.userRole === historyFilter || e.userRole === "system",
        );

  // Submit review handler (and optionally confirm completion)
  const handleSubmitReview = async () => {
    if (!job || reviewRating < 1 || reviewRating > 5) {
      return;
    }

    // Single source of truth for the hired pro's user id: the same
    // `getHiredProUserId()` helper used by `isHiredPro` derivation
    // above (with `projectProId` as the final fallback baked in).
    // Previously this block had its own forked unwrap that drifted from
    // the helper - a refactor changing one would diverge the other
    // silently.
    const proId = getHiredProUserId();

    // Validate proId
    if (!proId) {
      console.error("[handleSubmitReview] No proId found!", job.hiredPro);
      setError(t("jobDetail.professionalIdNotFound"));
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsSubmittingReview(true);
    // Track whether confirm has already succeeded so a downstream
    // review-failure surface the right message ("project IS confirmed but
    // we couldn't save your review, try the review again from your
    // dashboard"). Previously a review failure after confirm just
    // showed "Failed to submit review" with no hint that the project
    // was actually completed and the pro had been notified.
    let confirmSucceeded = false;
    try {
      // If in completion flow, confirm completion first
      if (isCompletionFlow) {
        await api.post(`/jobs/projects/${job.id}/confirm-completion`);
        setIsClientConfirmed(true);
        confirmSucceeded = true;
      }

      const reviewData = {
        jobId: job.id,
        proId: proId,
        rating: reviewRating,
        text: reviewText.trim() || undefined,
      };

      // Then submit review
      await api.post("/reviews", reviewData);

      setShowReviewModal(false);
      setIsCompletionFlow(false);
      setHasSubmittedReview(true);
      setSuccess(
        isCompletionFlow
          ? t("jobDetail.projectCompletedAndReviewSubmitted")
          : t("jobDetail.reviewSubmittedSuccessfully"),
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr?.response?.data?.message;
      if (message === "Review already exists for this project") {
        // If review already exists but we were in completion flow, still try to confirm
        if (isCompletionFlow && !confirmSucceeded) {
          try {
            await api.post(`/jobs/projects/${job.id}/confirm-completion`);
            setIsClientConfirmed(true);
            setSuccess(t("jobDetail.projectCompleted"));
            setTimeout(() => setSuccess(""), 3000);
          } catch {
            setError(t("jobDetail.failedToCloseProject"));
            setTimeout(() => setError(""), 3000);
          }
        }
        setHasSubmittedReview(true);
        setShowReviewModal(false);
        setIsCompletionFlow(false);
      } else if (confirmSucceeded) {
        // Confirm landed, review didn't. Close the modal so the user
        // doesn't keep retrying the whole flow (and getting "already
        // confirmed" 400s on the confirm half), and tell them the
        // project is done but the review didn't save. They can retry
        // the review independently from the completed-job view.
        setShowReviewModal(false);
        setIsCompletionFlow(false);
        setSuccess(t("jobDetail.projectCompleted"));
        setTimeout(() => setSuccess(""), 3000);
        toast.error(
          t("common.error"),
          t("jobDetail.failedToSubmitReview"),
        );
      } else {
        setError(t("jobDetail.failedToSubmitReview"));
        setTimeout(() => setError(""), 3000);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    // AbortController cancels the first request when React Strict Mode
    // unmounts-then-remounts in dev. Without it, the Network tab shows
    // two `GET /jobs/:id` requests on every page load (one cancelled,
    // one live) which is what users see and call a duplicate.
    const controller = new AbortController();
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${params.id}`, {
          signal: controller.signal,
        });
        const data = response.data;
        setJob(data);
        trackEvent(AnalyticsEvent.JOB_VIEW, {
          jobId: data.id,
          jobTitle: data.title,
          jobCategory: data.category,
        });
      } catch (err) {
        // Aborts come through as CanceledError - ignore, they're expected.
        if ((err as { name?: string })?.name === "CanceledError") return;
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Failed to fetch job:", err);
        router.push(cl("/jobs"));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    if (params.id) {
      fetchJob();
    }

    return () => controller.abort();
  }, [params.id, router, trackEvent, cl]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMyProposal = async () => {
      if (
        !user ||
        (user.role !== "pro" && user.role !== "admin") ||
        !params.id
      ) {
        setIsCheckingProposal(false);
        return;
      }

      try {
        const response = await api.get(`/jobs/${params.id}/my-proposal`, {
          signal: controller.signal,
        });
        setMyProposal(response.data);
      } catch (err) {
        if ((err as { name?: string })?.name === "CanceledError") return;
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        // 404 is expected if no proposal exists
        console.error("Failed to fetch my proposal:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingProposal(false);
        }
      }
    };

    if (user?.role === "pro" || user?.role === "admin") {
      fetchMyProposal();
    } else {
      setIsCheckingProposal(false);
    }

    return () => controller.abort();
  }, [user, params.id]);

  // Refetch job when proposal is accepted (to get updated status and hiredPro)
  useEffect(() => {
    const controller = new AbortController();
    const refetchJob = async () => {
      if (!params.id) return;
      try {
        const response = await api.get(`/jobs/${params.id}`, {
          signal: controller.signal,
        });
        setJob(response.data);
      } catch (err) {
        if ((err as { name?: string })?.name === "CanceledError") return;
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Failed to refetch job:", err);
      }
    };

    // If proposal is accepted but job doesn't have hiredPro or is not in_progress, refetch
    if (
      myProposal?.status === "accepted" &&
      (!job?.hiredPro || job?.status === "open")
    ) {
      refetchJob();
    }

    return () => controller.abort();
  }, [myProposal?.status, job?.hiredPro, job?.status, params.id]);

  // One-shot celebration toast for the hired pro. Fires when the proposal
  // is accepted - either via an in-session pending→accepted transition,
  // or when the pro lands on the page after being hired in another
  // session. sessionStorage dedupes across renders / refreshes so the
  // toast surfaces once per job per browser session. The status banner
  // continues to provide persistent feedback after the toast dismisses.
  useEffect(() => {
    if (myProposal?.status !== "accepted") return;
    if (!user?.id || !job?.id) return;
    if (user.role !== "pro" && user.role !== "admin") return;
    if (typeof window === "undefined") return;

    const sessionKey = `homi:hired-toast:${job.id}:${user.id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    toast.success(
      t("jobDetail.celebration.hiredTitle"),
      t("jobDetail.celebration.hiredBody"),
    );
  }, [myProposal?.status, user?.id, user?.role, job?.id, t, toast]);

  // Auto-rotate images
  useEffect(() => {
    if (allMedia.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allMedia.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allMedia.length]);

  // Update document title when job is loaded
  useEffect(() => {
    if (job) {
      document.title = `${job.title} | Homi`;
    }
  }, [job]);

  // Fetch project tracking data for hired jobs (in_progress or completed)
  useEffect(() => {
    const controller = new AbortController();
    const fetchProjectTracking = async () => {
      if (!job?.id) return;
      // Only fetch for in_progress or completed jobs
      if (job.status !== "in_progress" && job.status !== "completed") return;
      if (!isOwner && !isHiredPro) return;

      try {
        const response = await api.get(`/jobs/projects/${job.id}`, {
          signal: controller.signal,
        });
        if (response.data?.project) {
          const project = response.data.project;
          setProjectStage(project.currentStage || "hired");
          // For legacy jobs: if completed with completedAt but no clientConfirmedAt, treat as confirmed
          const isLegacyCompleted =
            project.currentStage === "completed" &&
            !!project.completedAt &&
            !project.clientConfirmedAt;
          setIsClientConfirmed(
            !!project.clientConfirmedAt || isLegacyCompleted,
          );

          // Store pro ID from project tracking as fallback
          if (project.proId) {
            const proIdValue =
              typeof project.proId === "object"
                ? project.proId._id || project.proId.id
                : project.proId;
            setProjectProId(proIdValue);
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "CanceledError") return;
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        // 404 is benign (legacy job hired before project tracking shipped);
        // anything else is a real failure that leaves the workspace blank,
        // so surface it instead of letting the user stare at empty tabs.
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status && status !== 404) {
          toast.error(t("common.error"));
        }
        console.error("Failed to fetch project tracking:", err);
      }
    };

    fetchProjectTracking();
    // toast and t are stable selectors; including them would re-fire the
    // fetch on every locale change which is undesirable here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => controller.abort();
  }, [job?.id, job?.status, isOwner, isHiredPro]);

  // Fetch unread counts for sidebar badges
  useEffect(() => {
    const controller = new AbortController();
    const fetchUnreadCounts = async () => {
      if (!job?.id) return;
      if (job.status !== "in_progress" && job.status !== "completed") return;
      if (!isOwner && !isHiredPro) return;

      try {
        const response = await api.get(
          `/jobs/projects/${job.id}/unread-counts`,
          { signal: controller.signal },
        );
        setUnreadChatCount(response.data.chat || 0);
        setUnreadPollsCount(response.data.polls || 0);
        setUnreadResourcesCount(response.data.materials || 0);
      } catch (err) {
        // Silently fail (and ignore CanceledError from Strict Mode remount)
      }
    };

    fetchUnreadCounts();
    return () => controller.abort();
  }, [job?.id, job?.status, isOwner, isHiredPro]);

  // Clear unread counts when switching tabs. Parent owns the API calls
  // for all three (chat / polls / resources) so the sidebar badge state
  // stays in sync with the server. Previously chat was double-fired
  // (parent + child both posted /messages/read) which was racy and
  // wrote to the DB twice per chat open.
  useEffect(() => {
    if (!job?.id) return;

    if (activeSidebarTab === "chat" && unreadChatCount > 0) {
      api.post(`/jobs/projects/${job.id}/messages/read`).catch(() => {});
      setUnreadChatCount(0);
    }
    if (activeSidebarTab === "polls" && unreadPollsCount > 0) {
      api.post(`/jobs/projects/${job.id}/polls/viewed`).catch(() => {});
      setUnreadPollsCount(0);
    }
    if (activeSidebarTab === "resources" && unreadResourcesCount > 0) {
      api.post(`/jobs/projects/${job.id}/materials/viewed`).catch(() => {});
      setUnreadResourcesCount(0);
    }
  }, [
    activeSidebarTab,
    job?.id,
    unreadChatCount,
    unreadPollsCount,
    unreadResourcesCount,
  ]);

  // Handle stage change (for pro)
  //
  // Sets state ONLY after the server confirms. Previously this set
  // `projectStage` optimistically, then rolled back on error - but
  // between the optimistic write and the server response, a WebSocket
  // event from another tab could land with the latest server state.
  // The rollback then clobbered that WS value with the pre-optimistic
  // stage, undoing valid concurrent updates. The button stays disabled
  // while in flight (via `isUpdatingStage`) so the user sees the
  // pending action.
  const handleStageChange = async (newStage: ProjectStage) => {
    if (!job?.id || !isHiredPro) return;

    // When advancing to COMPLETED, route through the portfolio modal
    // first so the pro can attach the after-photos. The actual stage
    // change happens inside the modal's `onComplete` callback.
    if (newStage === "completed") {
      setPortfolioImages([]);
      setShowPortfolioModal(true);
      return;
    }

    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: newStage });
      setProjectStage(newStage);
      toast.success(t("common.success"), t("jobDetail.stageUpdated"));
    } catch (err) {
      toast.error(t("common.error"), t("jobDetail.failedToUpdateStage"));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Upload a portfolio image from the completion modal. Returns the
  // uploaded URL and appends it to the modal's image list.
  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingPortfolio(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/upload", formData);
          return (res.data.url || res.data.path) as string;
        }),
      );
      setPortfolioImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(t("common.error"), t("common.uploadFailed"));
    } finally {
      setIsUploadingPortfolio(false);
      // Allow re-selecting the same files later.
      e.target.value = "";
    }
  };

  // Confirm the COMPLETED transition with the collected portfolio images.
  // Backend's updateStage moves portfolioImages into the project tracking
  // record; confirmCompletion later promotes them into the pro's public
  // portfolio.
  const handleCompleteWithPortfolio = async () => {
    if (!job?.id || !isHiredPro) return;
    const previousStage = projectStage;
    setIsUpdatingStage(true);
    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, {
        stage: "completed",
        portfolioImages,
      });
      setProjectStage("completed");
      setShowPortfolioModal(false);
      setPortfolioImages([]);
      toast.success(t("common.success"), t("jobDetail.stageUpdated"));
    } catch (err) {
      setProjectStage(previousStage);
      toast.error(t("common.error"), t("jobDetail.failedToUpdateStage"));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Handle client confirmation - opens review modal first
  const handleClientConfirm = async () => {
    if (!job?.id || !isOwner) return;
    // Open review modal in completion flow mode
    setIsCompletionFlow(true);
    setShowReviewModal(true);
  };

  // Handle client request changes (COMPLETED → REVIEW). Server-ack-only,
  // same reasoning as `handleStageChange` above.
  const handleClientRequestChanges = async () => {
    if (!job?.id || !isOwner) return;

    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: "review" });
      setProjectStage("review");
      toast.success(t("common.success"), t("jobDetail.requestSent"));
    } catch (err) {
      toast.error(t("common.error"), t("jobDetail.failedToSendRequest"));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post(`/jobs/${params.id}/proposals`, {
        ...proposalData,
        proposedPrice: proposalData.proposedPrice
          ? parseFloat(proposalData.proposedPrice)
          : undefined,
        estimatedDuration: proposalData.estimatedDuration
          ? parseInt(proposalData.estimatedDuration)
          : undefined,
      });

      setSuccess(t("jobDetail.proposalSubmittedSuccessfully"));
      setShowProposalForm(false);
      setMyProposal(response.data);
      trackEvent(AnalyticsEvent.PROPOSAL_SUBMIT, {
        jobId: params.id as string,
        proposalAmount: proposalData.proposedPrice
          ? parseFloat(proposalData.proposedPrice)
          : undefined,
      });
      // Refresh job data
      const jobResponse = await api.get(`/jobs/${params.id}`);
      setJob(jobResponse.data);
    } catch (err) {
      // Proposal submission errors are a hot path - NestJS sends
      // validation failures as `message: string[]` (e.g. "price too
      // low", "estimatedDays required"). Helper handles array vs
      // string vs missing; falls through to a friendly default.
      console.error('[JobDetailClient] Proposal submit failed', err);
      setError(extractApiErrorMessage(err, "Failed to submit proposal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/jobs/${params.id}`);
      trackEvent(AnalyticsEvent.JOB_DELETE, {
        jobId: params.id as string,
        jobTitle: job?.title,
      });
      router.push("/my-jobs");
    } catch (err) {
      console.error("Failed to delete job:", err);
      setDeleteError(extractApiErrorMessage(err, t("jobDetail.failedToDelete")));
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline edit handlers
  const handleSaveDescription = async () => {
    if (!job?.id) return;
    setIsSavingDescription(true);
    try {
      const res = await api.put(`/jobs/${job.id}`, {
        description: editDescription,
      });
      // Always prefer the server-returned job (it may normalize/derive fields)
      if (res?.data) {
        setJob(res.data);
      } else {
        setJob((prev) =>
          prev ? { ...prev, description: editDescription } : prev,
        );
      }
      setShowDescriptionEdit(false);
      toast.success(t("jobDetail.saved"));
    } catch (err) {
      console.error("Failed to save description:", err);
      toast.error(t("jobDetail.failedToSave"));
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!job?.id || !editTitle.trim()) return;
    setIsSavingTitle(true);
    try {
      const res = await api.put(`/jobs/${job.id}`, { title: editTitle });
      if (res?.data) {
        setJob(res.data);
      } else {
        setJob((prev) => (prev ? { ...prev, title: editTitle } : prev));
      }
      setShowTitleEdit(false);
      toast.success(t("common.saved"));
    } catch (err) {
      console.error("Failed to save title:", err);
      toast.error(t("jobDetail.failedToSave"));
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleSavePropertyDetails = async () => {
    if (!job?.id) return;
    setIsSavingProperty(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (editPropertyData.propertyType)
        updateData.propertyType = editPropertyData.propertyType;
      if (editPropertyData.propertyTypeOther)
        updateData.propertyTypeOther = editPropertyData.propertyTypeOther;
      if (editPropertyData.currentCondition)
        updateData.currentCondition = editPropertyData.currentCondition;
      if (editPropertyData.areaSize)
        updateData.areaSize = Number(editPropertyData.areaSize);
      if (editPropertyData.landArea)
        updateData.landArea = Number(editPropertyData.landArea);
      if (editPropertyData.roomCount)
        updateData.roomCount = Number(editPropertyData.roomCount);
      if (editPropertyData.floorCount)
        updateData.floorCount = Number(editPropertyData.floorCount);
      if (editPropertyData.pointsCount)
        updateData.pointsCount = Number(editPropertyData.pointsCount);
      // Allow clearing cadastralId: empty string => send null => backend will $unset it
      updateData.cadastralId = editPropertyData.cadastralId?.trim()
        ? editPropertyData.cadastralId.trim()
        : null;
      if (editPropertyData.deadline)
        updateData.deadline = editPropertyData.deadline;

      const res = await api.put(`/jobs/${job.id}`, updateData);
      if (res?.data) {
        setJob(res.data);
      } else {
        setJob((prev) =>
          prev
            ? ({
                ...prev,
                ...updateData,
              } as PageJob)
            : prev,
        );
      }
      setShowPropertyEdit(false);
      toast.success(t("common.saved"));
    } catch (err) {
      console.error("Failed to save property details:", err);
      toast.error(t("jobDetail.failedToSave"));
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleSaveWorkTypes = async () => {
    if (!job?.id) return;
    setIsSavingWorkTypes(true);
    try {
      const res = await api.put(`/jobs/${job.id}`, {
        workTypes: editWorkTypes,
      });
      if (res?.data) {
        setJob(res.data);
      } else {
        setJob((prev) => (prev ? { ...prev, workTypes: editWorkTypes } : prev));
      }
      setShowWorkTypesEdit(false);
      toast.success(t("common.saved"));
    } catch (err) {
      console.error("Failed to save work types:", err);
      toast.error(t("jobDetail.failedToSave"));
    } finally {
      setIsSavingWorkTypes(false);
    }
  };

  const handleSaveRequirements = async () => {
    if (!job?.id) return;
    setIsSavingRequirements(true);
    try {
      const res = await api.put(`/jobs/${job.id}`, editRequirements);
      if (res?.data) {
        setJob(res.data);
      } else {
        setJob((prev) => (prev ? { ...prev, ...editRequirements } : prev));
      }
      setShowRequirementsEdit(false);
      toast.success(t("common.saved"));
    } catch (err) {
      console.error("Failed to save requirements:", err);
      toast.error(t("jobDetail.failedToSave"));
    } finally {
      setIsSavingRequirements(false);
    }
  };

  // Helper to open property edit modal with current values
  const openPropertyEditModal = () => {
    if (!job) return;
    setEditPropertyData({
      propertyType: job.propertyType || "",
      propertyTypeOther: job.propertyTypeOther || "",
      currentCondition: job.currentCondition || "",
      areaSize: job.areaSize?.toString() || "",
      landArea: job.landArea?.toString() || "",
      roomCount: job.roomCount?.toString() || "",
      floorCount: job.floorCount?.toString() || "",
      pointsCount: job.pointsCount?.toString() || "",
      cadastralId: job.cadastralId || "",
      deadline: job.deadline
        ? new Date(job.deadline).toISOString().split("T")[0]
        : "",
    });
    setShowPropertyEdit(true);
  };

  // Helper to open work types edit modal
  const openWorkTypesEditModal = () => {
    if (!job) return;
    setEditWorkTypes(job.workTypes || []);
    setShowWorkTypesEdit(true);
  };

  // Helper to open requirements edit modal
  const openRequirementsEditModal = () => {
    if (!job) return;
    setEditRequirements({
      furnitureIncluded: job.furnitureIncluded || false,
      visualizationNeeded: job.visualizationNeeded || false,
      materialsProvided: job.materialsProvided || false,
      occupiedDuringWork: job.occupiedDuringWork || false,
    });
    setShowRequirementsEdit(true);
  };

  // All available work types for selection
  const allWorkTypes = Object.keys(workTypeKeys);

  const formatBudget = (job: Job) => {
    // Handle negotiable type explicitly
    if (job.budgetType === "negotiable") {
      return t("common.negotiable");
    }
    return formatBudgetUtil(job, t);
  };

  const getTimeAgo = (dateString: string) =>
    formatTimeAgoCompact(dateString, locale as "en" | "ka" | "ru");

  const getPropertyTypeLabel = (type: string) => {
    const key = propertyTypeKeys[type];
    return key ? t(key) : type;
  };

  const getConditionLabel = (condition: string) => {
    const key = conditionKeys[condition];
    return key ? t(key) : condition;
  };

  const getWorkTypeLabel = (type: string) => {
    const key = workTypeKeys[type];
    return key ? t(key) : type;
  };

  // Animated stat counters - the view / proposal numbers ramp from 0
  // to their target on first reveal, so the hero feels alive on load
  // without competing with other motion. The hook is a no-op for
  // reduced-motion users.
  //
  // These hooks MUST sit above the `if (isLoading) return ...` and
  // `if (!job) return null` early-returns below; otherwise React sees
  // a different hook count between the loading and loaded renders and
  // throws "Rendered more hooks than during the previous render".
  const viewCount = useCountUp(job?.viewCount || 0);
  const proposalCountAnim = useCountUp(job?.proposalCount || 0);

  // Services view-model: groups the job's services by their catalog
  // subcategory and resolves a per-line pricing mode (fixed, range, or
  // negotiable) from the catalog metadata. Computed once per job/
  // catalog change so the render path stays straightforward.
  //
  // Pricing mode resolution per line:
  //   - svc.unitPrice > 0           -> "fixed"  (qty × unitPrice)
  //   - else unitOption has min/max -> "range"  (qty × min  ..  qty × max)
  //   - else catalog priceRange     -> "range"  (priceRange.min .. .max)
  //   - else                        -> "negotiable"
  const servicesView = useMemo<ServicesView>(() => {
    const services = job?.services ?? [];
    if (services.length === 0) {
      return {
        groups: [],
        fixedTotal: 0,
        rangeMin: 0,
        rangeMax: 0,
        negotiableCount: 0,
        rangeCount: 0,
        fixedCount: 0,
      };
    }

    // `globalThis.Map` rather than bare `Map` because the lucide Map
    // icon import (line ~75) shadows the global Map constructor in
    // this file's value namespace.
    const groupsMap = new globalThis.Map<string, ServiceGroup>();
    let fixedTotal = 0;
    let rangeMin = 0;
    let rangeMax = 0;
    let negotiableCount = 0;
    let rangeCount = 0;
    let fixedCount = 0;

    services.forEach((svc, idx) => {
      // Locate the catalog node for this service to read its
      // subcategory + pricing range. The catalog is small enough
      // (handful of categories) that a nested loop is cheap.
      let groupKey = "_other";
      let groupName = t("common.other");
      let catalogSvc: CatalogServiceItem | null = null;
      let unitLabel = "";

      for (const cat of catalogCats) {
        for (const sub of cat.subcategories) {
          for (const s of sub.services || []) {
            if (s.key === svc.key) {
              groupKey = sub.key;
              groupName = pick({ en: sub.name, ka: sub.nameKa });
              catalogSvc = s;
              const uo = svc.unitKey
                ? s.unitOptions?.find((u: CatalogUnitOption) => u.key === svc.unitKey)
                : s.unitOptions?.[0];
              if (uo) {
                unitLabel = pick({ en: uo.label.en, ka: uo.label.ka });
              } else {
                unitLabel = pick({ en: s.unitName, ka: s.unitNameKa });
              }
              break;
            }
          }
          if (catalogSvc) break;
        }
        if (catalogSvc) break;
      }
      if (!unitLabel) unitLabel = svc.unit || "";

      const qty = svc.quantity || 1;
      const name = getLabel(svc.key);

      // Pricing resolution
      let line: ServiceLine;
      if (svc.unitPrice && svc.unitPrice > 0) {
        const total = svc.unitPrice * qty;
        line = {
          key: `${svc.key}-${idx}`,
          name,
          unitLabel,
          qty,
          mode: "fixed",
          lineFixed: total,
        };
        fixedTotal += total;
        fixedCount += 1;
      } else {
        // Try unit-option range, then catalog priceRange
        const uo = svc.unitKey
          ? catalogSvc?.unitOptions?.find(
              (u: CatalogUnitOption) => u.key === svc.unitKey,
            )
          : catalogSvc?.unitOptions?.[0];
        const uoMin = uo?.defaultPrice ?? 0;
        const uoMax = uo?.maxPrice ?? 0;
        const pr = catalogSvc?.priceRange;

        if (uoMin > 0 && uoMax > uoMin) {
          const lo = uoMin * qty;
          const hi = uoMax * qty;
          line = {
            key: `${svc.key}-${idx}`,
            name,
            unitLabel,
            qty,
            mode: "range",
            lineMin: lo,
            lineMax: hi,
          };
          rangeMin += lo;
          rangeMax += hi;
          rangeCount += 1;
        } else if (pr && pr.min > 0 && pr.max > pr.min) {
          line = {
            key: `${svc.key}-${idx}`,
            name,
            unitLabel,
            qty,
            mode: "range",
            lineMin: pr.min,
            lineMax: pr.max,
          };
          rangeMin += pr.min;
          rangeMax += pr.max;
          rangeCount += 1;
        } else {
          line = {
            key: `${svc.key}-${idx}`,
            name,
            unitLabel,
            qty,
            mode: "negotiable",
          };
          negotiableCount += 1;
        }
      }

      const existing = groupsMap.get(groupKey);
      if (existing) {
        existing.items.push(line);
      } else {
        groupsMap.set(groupKey, { key: groupKey, name: groupName, items: [line] });
      }
    });

    return {
      groups: Array.from(groupsMap.values()),
      fixedTotal,
      rangeMin,
      rangeMax,
      negotiableCount,
      rangeCount,
      fixedCount,
    };
  }, [job?.services, catalogCats, pick, t, getLabel]);

  // Sticky compact status bar state - fades in once the hero scrolls
  // past the global header. The IntersectionObserver watches the hero
  // block (declared in JSX below with ref={heroRef}); when none of it
  // intersects the viewport, the bar slides down under the header.
  // rootMargin "-56px..." matches the Header's h-14 height so the
  // transition fires at the right moment instead of when the hero is
  // already a strip behind the chrome.
  const heroRef = useRef<HTMLElement | null>(null);
  const [heroOutOfView, setHeroOutOfView] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroOutOfView(!entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [job?.id]);

  // Loading state with elegant skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
        <HeaderSpacer />
        <div className="animate-pulse">
          <div className="h-[60vh] bg-[var(--hm-bg-tertiary)]" />
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="h-8 w-48 bg-[var(--hm-bg-tertiary)] rounded-full mb-4" />
            <div className="h-12 w-3/4 bg-[var(--hm-bg-tertiary)] rounded-lg mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-[var(--hm-bg-tertiary)] rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const budgetDisplay = formatBudget(job);
  const isOpen = job.status === "open";
  // Job is considered "hired" if status is in_progress/completed OR if hiredPro exists OR if user's proposal was accepted
  const isHired =
    job.status === "in_progress" ||
    job.status === "completed" ||
    !!job.hiredPro ||
    myProposal?.status === "accepted";
  const isCompleted = job.status === "completed" || projectStage === "completed";

  // Resolve hired-pro display name for the banner. Mirrors the lookup
  // used by the hired-professional sidebar card. Returns null when the
  // job is hired but `hiredPro` isn't populated yet (e.g. between the
  // proposal-accept response and the job refetch) so we render the
  // fallback "Your pro is on the job" copy instead of an empty name.
  const hiredProName: string | null = (() => {
    const hp = job.hiredPro as {
      name?: string;
      userId?: { name?: string };
    } | undefined;
    return hp?.name || hp?.userId?.name || null;
  })();

  // Scroll target + tab-switch handler for the status banner CTAs.
  // Clients open the project workspace (chat tab). The hired pro
  // jumps to the workspace too where the full ProjectStatusBar with
  // stage controls lives in the desktop sidebar / mobile tab strip.
  const openWorkspace = () => {
    if (isOwner || isHiredPro) setActiveSidebarTab("chat");
    document
      .getElementById("project-workspace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Localized stage label for the banner. Reads from `jobDetail.stages.*`
  // (ka/en/ru all populated) rather than the inline STAGES table at the
  // top of this file, which only has ka+en and would fall back to
  // English for ru users on a high-visibility surface.
  const stageLabel = t(`jobDetail.stages.${projectStage}`);

  // Smooth-scroll handler for the meta-row "{N} proposals" anchor link.
  // The browser default for in-page hash links is an instant jump, which
  // feels jarring next to the rest of the page's fade-in motion. Using
  // scrollIntoView + behavior:'smooth' keeps the transition cohesive and
  // also lets us prevent the URL from gaining a #hash that lingers in
  // history.
  const scrollToApplicants = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document
      .getElementById("applicants-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Share-job handler used by the "Waiting for proposals" empty state
  // and (eventually) the share section in the sidebar. Mirrors the
  // existing inline share behavior at the bottom of the file but
  // guards against an undefined description (the inline copy called
  // `.slice` directly which crashed on jobs without descriptions).
  const handleShareJob = async () => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: (job.description || "").slice(0, 100),
          url,
        });
      } catch {
        // user cancelled / unsupported scheme - silent fallthrough
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // clipboard blocked - no-op rather than crash
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      {/* One-shot hire-success confetti. Tied to a flag set by the
          accept handler; auto-clears after ~2s. Respects
          prefers-reduced-motion via the burst component itself. */}
      <ConfettiBurst active={hireCelebration} />
      <Header />
      <HeaderSpacer />

      {/* Sticky compact status bar - pinned under the global header
          (top-14 matches HeaderSpacer's h-14 = 56px), slides in from
          above when the user scrolls past the hero. Glass surface
          keeps underlying content legible through the bar. Pointer-
          events-none while hidden prevents the (invisible) hit area
          from eating clicks on the hero. */}
      <div
        className={`fixed top-14 left-0 right-0 z-30 bg-[var(--hm-bg-elevated)]/85 backdrop-blur-md border-b border-[var(--hm-border-subtle)] shadow-[0_4px_16px_-8px_rgba(20,18,14,0.12)] transition-all duration-300 ease-out ${
          heroOutOfView
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 flex items-center gap-3">
          <h2 className="font-display text-sm font-semibold text-[var(--hm-fg-primary)] truncate flex-1 min-w-0">
            {job.title}
          </h2>
          {isHired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/[12%] text-[var(--hm-brand-500)] text-xs font-semibold shrink-0">
              <Check className="w-3 h-3" />
              {stageLabel}
            </span>
          ) : (
            <span className="hidden sm:inline text-sm font-bold text-[var(--hm-brand-500)] shrink-0">
              {budgetDisplay}
            </span>
          )}
          {isHired && (isOwner || isHiredPro) && (
            <Button
              variant="default"
              size="sm"
              onClick={openWorkspace}
              className="shrink-0"
            >
              {isOwner
                ? t("jobDetail.banner.clientHiredCta")
                : t("jobDetail.banner.proHiredCta")}
            </Button>
          )}
        </div>
      </div>

      {/* Status banner - surfaces the hired state above the hero so the
          hand-off from "marketplace listing" to "active project" is
          loud, not buried in the compact status bar inside the hero.
          Three viewer states, mutually exclusive:
            - Client (isOwner): green-tinted, names the hired pro, CTA
              opens the project workspace.
            - Hired pro (isHiredPro): brand-tinted, confirms hire, CTA
              jumps to the workspace where stage controls live.
            - Anyone else viewing the deep link: muted "filled" pill. */}
      {isHired && isOwner && (
        <section className="bg-[var(--hm-success-50)] border-b border-[var(--hm-success-100)]">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--hm-success-100)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[var(--hm-success-500)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] truncate">
                  {hiredProName
                    ? t("jobDetail.banner.clientHiredTitle", { name: hiredProName })
                    : t("jobDetail.banner.clientHiredFallbackTitle")}
                </p>
                <p className="font-body text-xs sm:text-sm text-[var(--hm-fg-secondary)] truncate">
                  {t("jobDetail.banner.currentStage", { stage: stageLabel })}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={openWorkspace}
                className="shrink-0"
              >
                {t("jobDetail.banner.clientHiredCta")}
              </Button>
            </div>
          </div>
        </section>
      )}
      {isHired && isHiredPro && !isOwner && (
        <section className="border-b bg-[var(--hm-brand-500)]/[6%] border-[var(--hm-brand-500)]/[20%]">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--hm-brand-500)]/[12%]">
                <BadgeCheck className="w-5 h-5 text-[var(--hm-brand-500)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] truncate">
                  {t("jobDetail.banner.proHiredTitle")}
                </p>
                <p className="font-body text-xs sm:text-sm text-[var(--hm-fg-secondary)] truncate">
                  {t("jobDetail.banner.currentStage", { stage: stageLabel })}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={openWorkspace}
                className="shrink-0"
              >
                {t("jobDetail.banner.proHiredCta")}
              </Button>
            </div>
          </div>
        </section>
      )}
      {isHired && !isOwner && !isHiredPro && (
        <section className="bg-[var(--hm-bg-tertiary)] border-b border-[var(--hm-border-subtle)]">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5">
            <div className="flex items-center gap-2 text-[var(--hm-fg-secondary)]">
              <Check className="w-4 h-4 shrink-0" />
              <p className="font-body text-xs sm:text-sm">
                {t("jobDetail.banner.viewerFilledTitle")}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Header / Hero */}
      <section
        ref={heroRef}
        className="relative bg-[var(--hm-bg-elevated)] border-b border-[var(--hm-border)]"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          {/* Back button + Edit/Delete buttons row (only when job is not hired) */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            {/* Minimal variant: this page already has a strong visual
                hero with title + price + status badges right below, so
                the boxed-icon back button competes for attention. The
                text-link variant matches the visual weight of other
                detail pages without losing the affordance. */}
            <BackButton href={cl("/jobs")} variant="minimal" />
            {isOwner && !isHired && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteProsModal(true)}
                  title={t("job.invitePros")}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  className="text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 hover:text-[var(--hm-brand-500)]"
                >
                  <span className="hidden sm:inline">{t("job.invite")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  title={t("common.delete")}
                  aria-label={t("common.delete")}
                  className="text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Conditional Layout: With images = 2 columns, Without images = single column compact */}
          {allMedia.length > 0 ? (
            /* WITH IMAGES: Side-by-side layout */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3 lg:gap-5 pb-1 sm:pb-0">
              {/* Left: Image Gallery */}
              <div className="space-y-1.5 relative">
                {/* Edit Media Button for Owner */}
                {isOwner && !isHired && (
                  <Link
                    href={`/post-job?edit=${job.id}`}
                    className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-lg border border-[var(--hm-border)] flex items-center justify-center text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:border-[var(--hm-brand-500)] transition-all"
                    title={t("jobDetail.editMedia")}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                )}
                {/* Main Image - capped height on desktop to keep everything in viewport */}
                <Button
                  variant="ghost"
                  onClick={() => setSelectedMediaIndex(activeImageIndex)}
                  className="relative w-full h-auto p-0 aspect-[16/9] lg:aspect-auto lg:h-[min(220px,28vh)] rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] group hover:bg-transparent"
                  aria-label={job.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storage.getFileUrl(allMedia[activeImageIndex]?.url)}
                    alt={job.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  {allMedia.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                      {activeImageIndex + 1} / {allMedia.length}
                    </div>
                  )}
                </Button>

                {/* Thumbnail strip. snap-x + snap-mandatory keep each
                    thumb at the left edge as the user swipes, giving the
                    strip a deliberate "shelf" feel instead of an arbitrary
                    overflow scroll. */}
                {allMedia.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide snap-x snap-mandatory scroll-px-1.5">
                    {allMedia.map((media, idx) => {
                      const isActive = idx === activeImageIndex;
                      return (
                        <Button
                          key={idx}
                          variant="ghost"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative flex-shrink-0 w-12 h-9 md:w-14 md:h-10 p-0 rounded-lg overflow-hidden snap-start transition-all hover:bg-transparent ${
                            isActive
                              ? "ring-2 ring-offset-1 ring-offset-white scale-[1.04]"
                              : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                          }`}
                          // The previous active-state was a `borderColor: ACCENT`
                          // inline style on top of `ring-2`, but Tailwind's
                          // `ring-*` reads the `--tw-ring-color` CSS var, not
                          // borderColor - so the active ring was rendering in
                          // the default ring color, making the selection
                          // barely distinguishable. Setting the CSS var
                          // directly fixes the visual + the indicator becomes
                          // a real, branded affordance.
                          style={
                            isActive
                              ? ({
                                  ["--tw-ring-color" as string]: ACCENT,
                                } as React.CSSProperties)
                              : undefined
                          }
                          // aria-current is the canonical pattern for "this
                          // one is selected in a set" so VoiceOver / JAWS
                          // announce the selection state automatically, on
                          // top of the localized "Image N of M" label.
                          aria-current={isActive ? "true" : undefined}
                          aria-label={t("jobDetail.thumbnailLabel", {
                            current: idx + 1,
                            total: allMedia.length,
                          })}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={storage.getFileUrl(media.url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {media.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Job Info */}
              <div className="flex flex-col justify-center">
                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {isOpen && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--hm-success-100)]/30 text-[var(--hm-success-500)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-success-500)] animate-pulse" />
                      <span className="text-xs font-semibold">
                        {t("common.active")}
                      </span>
                    </span>
                  )}
                  {isHired && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--hm-brand-500)]/[12%] text-[var(--hm-brand-500)]">
                      <Check className="w-3 h-3" />
                      <span className="text-xs font-semibold">
                        {t("common.hired")}
                      </span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--hm-brand-500)]/[6%] text-[var(--hm-brand-500)]">
                    {getLabel(job.category)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-base sm:text-lg font-bold text-[var(--hm-fg-primary)] mb-1 leading-tight">
                  {job.title}
                </h1>

                {/* Quick stats */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--hm-fg-secondary)] mb-1.5 sm:mb-2">
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    {getTimeAgo(job.createdAt)}
                  </span>
                </div>

                {/* Full address */}
                {job.location && (
                  <div className="flex items-start gap-1.5 text-sm text-[var(--hm-fg-secondary)] mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{job.location}</span>
                  </div>
                )}

                {/* Budget + Stats row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm mb-1.5 sm:mb-2">
                  {!(job.services && job.services.length > 0) && (
                    <>
                      {/* inline color: ACCENT was overriding text-[var(--hm-fg-primary)] -
                          dropping the dead utility avoids the override chain. */}
                      <span className="font-bold text-sm sm:text-base text-[var(--hm-brand-500)]">
                        {budgetDisplay}
                      </span>
                      <span className="w-px h-4 bg-[var(--hm-bg-tertiary)]" />
                    </>
                  )}
                  <div className="flex items-center gap-1.5 text-[var(--hm-fg-muted)]">
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {viewCount} {t("jobDetail.views")}
                    </span>
                  </div>
                  {!isHired && (
                    /* Owners with proposals get an anchor link that
                       scrolls to the applicants section so they can
                       skip the spec scroll and act on the list. Non-
                       owners and owners with 0 proposals see plain text. */
                    isOwner && (job.proposalCount || 0) > 0 ? (
                      <a
                        href="#applicants-section"
                        onClick={scrollToApplicants}
                        className="flex items-center gap-1.5 sm:gap-2 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="underline-offset-2 hover:underline">
                          {proposalCountAnim} {t("jobDetail.proposals")}
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--hm-fg-secondary)]">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>
                          {proposalCountAnim} {t("jobDetail.proposals")}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Compact Status Bar in Hero (for hired projects) */}
                {isHired && (isOwner || isHiredPro) && (
                  <ProjectStatusBar
                    currentStage={projectStage}
                    locale={locale}
                    isPro={!!isHiredPro}
                    isClient={!!isOwner}
                    isUpdating={isUpdatingStage}
                    isClientConfirmed={isClientConfirmed}
                    hasSubmittedReview={hasSubmittedReview}
                    onStageChange={handleStageChange}
                    onClientConfirm={handleClientConfirm}
                    onClientRequestChanges={handleClientRequestChanges}
                    onLeaveReview={() => setShowReviewModal(true)}
                    compact={true}
                  />
                )}
              </div>
            </div>
          ) : (
            /* NO IMAGES: Compact single-column layout */
            <div className="space-y-4">
              {/* Top row: Status badges + Category */}
              <div className="flex flex-wrap items-center gap-2">
                {isOpen && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--hm-success-100)]/30 text-[var(--hm-success-500)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-success-500)] animate-pulse" />
                    <span className="text-xs font-semibold">
                      {t("common.active")}
                    </span>
                  </span>
                )}
                {isHired && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--hm-brand-500)]/[12%] text-[var(--hm-brand-500)]">
                    <Check className="w-3 h-3" />
                    <span className="text-xs font-semibold">
                      {t("common.hired")}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--hm-brand-500)]/[6%] text-[var(--hm-brand-500)]">
                  {getCategoryLabel(job.category)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg md:text-xl font-bold text-[var(--hm-fg-primary)] leading-tight">
                {job.title}
              </h1>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--hm-fg-secondary)]">
                {job.location && (
                  // `min-w-0` lets the truncated span shrink within the
                  // flex parent on narrow viewports; `flex-shrink` on
                  // the icon keeps it pinned. Widened from max-w-[200px]
                  // (which clipped "20 Nikolioz Kipshidze St, T...")
                  // to a more generous title-line fraction. The full
                  // address still lives in the "Full address" block
                  // below for users who need to copy it.
                  <span className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate" title={job.location}>
                      {job.location}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(job.createdAt)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>
                    {viewCount} {t("jobDetail.views")}
                  </span>
                </div>
                {!isHired && (
                  /* See sibling block above (with-images hero) for the
                     same anchor-link pattern. Kept inline rather than
                     extracted to a component because the surrounding
                     wrapper className differs between the two layouts. */
                  isOwner && (job.proposalCount || 0) > 0 ? (
                    <a
                      href="#applicants-section"
                      onClick={scrollToApplicants}
                      className="flex items-center gap-1.5 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span className="underline-offset-2 hover:underline">
                        {proposalCountAnim} {t("jobDetail.proposals")}
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>
                        {proposalCountAnim} {t("jobDetail.proposals")}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Budget + Quick Specs - compact inline row */}
              <div className="flex flex-wrap items-center gap-3 text-sm pt-1">
                {!(job.services && job.services.length > 0) && (
                  <span className="font-bold text-base text-[var(--hm-brand-500)]">
                    {budgetDisplay}
                  </span>
                )}
                {(job.propertyType || job.areaSize != null || job.roomCount != null || job.deadline) && (
                  <>
                    <span className="w-px h-4 bg-[var(--hm-bg-tertiary)]" />
                    <div className="flex flex-wrap items-center gap-2 text-[var(--hm-fg-secondary)]">
                      {job.propertyType && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          {getPropertyTypeLabel(job.propertyType)}
                        </span>
                      )}
                      {job.areaSize != null && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5" />
                          {job.areaSize} მ²
                        </span>
                      )}
                      {job.roomCount != null && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="w-3.5 h-3.5" />
                          {job.roomCount} {t("jobDetail.rooms")}
                        </span>
                      )}
                      {job.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {(() => {
                            const date = new Date(job.deadline);
                            return formatDateMonthDay(date.toISOString(), locale);
                          })()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Compact Status Bar in Hero (for hired projects) */}
              {isHired && (isOwner || isHiredPro) && (
                <div className="pt-2">
                  <ProjectStatusBar
                    currentStage={projectStage}
                    locale={locale}
                    isPro={!!isHiredPro}
                    isClient={!!isOwner}
                    isUpdating={isUpdatingStage}
                    isClientConfirmed={isClientConfirmed}
                    hasSubmittedReview={hasSubmittedReview}
                    onStageChange={handleStageChange}
                    onClientConfirm={handleClientConfirm}
                    onClientRequestChanges={handleClientRequestChanges}
                    onLeaveReview={() => setShowReviewModal(true)}
                    compact={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 bg-[var(--hm-bg-page)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3">
          {/* Submit Proposal button for pro */}
          {isPro &&
            !isOwner &&
            isOpen &&
            !isHired &&
            !myProposal &&
            !isCheckingProposal &&
            isAuthValidated && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    if (!isVerified) {
                      toast.error(
                        t("job.verificationRequired"),
                        t("job.verificationRequiredToSendProposal"),
                      );
                      return;
                    }
                    setShowProposalForm(true);
                  }}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {t("jobDetail.submitProposal")}
                </Button>
              </div>
            )}
          {isPro && !isOwner && isOpen && !isHired && (isCheckingProposal || !isAuthValidated) && (
            <div className="flex justify-end mb-4">
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-[var(--hm-fg-muted)]">
                <LoadingSpinner size="sm" color="#737373" />
              </div>
            </div>
          )}

          {/* Mobile Sidebar Tabs for hired projects. Sticky under the
              global header (h-14 = top-14) so tab switching never
              requires a scroll back to the top. Glassmorphism layer
              (bg + backdrop-blur) keeps the underlying content readable
              through the strip when it's pinned. Negative side margins
              + matching padding let the sticky strip span edge-to-edge
              inside the gutter-padded parent.  */}
          {isHired && (isOwner || isHiredPro) && (
            <div className="lg:hidden mb-6 sticky top-14 z-20 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-2 bg-[var(--hm-bg-page)]/85 backdrop-blur-md border-b border-[var(--hm-border-subtle)]">
              <ProjectSidebarMobile
                activeTab={activeSidebarTab}
                onTabChange={setActiveSidebarTab}
                locale={locale}
                unreadChatCount={unreadChatCount}
                unreadPollsCount={unreadPollsCount}
                unreadResourcesCount={unreadResourcesCount}
              />
            </div>
          )}

          {/* Status bar moved to hero section - keeping only sidebar tabs below */}

          {/* Two Column Layout (or Three with sidebar for hired projects - except in MVP mode) */}
          {/* id="project-workspace" gives the hired-state status banner a
              scroll target for its "Open workspace" / "Update status" CTAs. */}
          <div
            id="project-workspace"
            className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 pb-28 sm:pb-24 ${isHired && (isOwner || isHiredPro) ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
          >
            {/* Desktop Sidebar for hired projects - hidden in MVP mode */}
            {isHired && (isOwner || isHiredPro) && (
              <div className="hidden lg:block">
                <div className="sticky top-24 bg-[var(--hm-bg-elevated)] rounded-2xl p-4 border border-[var(--hm-border-subtle)]">
                  <ProjectSidebar
                    activeTab={activeSidebarTab}
                    onTabChange={setActiveSidebarTab}
                    locale={locale}
                    unreadChatCount={unreadChatCount}
                    unreadPollsCount={unreadPollsCount}
                    unreadResourcesCount={unreadResourcesCount}
                  />
                </div>
              </div>
            )}
            {/* Main Content - min-height prevents layout jumping when switching tabs */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8 min-h-[400px] sm:min-h-[500px]">
              {/* CHAT TAB CONTENT - hidden in MVP mode */}
              {isHired &&
                (isOwner || isHiredPro) &&
                activeSidebarTab === "chat" && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden min-h-[450px]">
                    <ProjectChat
                      jobId={job.id}
                      locale={locale}
                      isClient={!!isOwner}
                      // Pass whichever side is "other" so the chat
                      // header can show a small "Active recently"
                      // indicator. lastLoginAt is best-effort -
                      // missing field just hides the indicator.
                      otherPartyLastLoginAt={
                        isOwner
                          ? (job.hiredPro as { userId?: { lastLoginAt?: string } } | undefined)?.userId?.lastLoginAt
                            ?? (job.hiredPro as { lastLoginAt?: string } | undefined)?.lastLoginAt
                          : (job.clientId as { lastLoginAt?: string } | string | undefined) && typeof job.clientId === 'object'
                            ? (job.clientId as { lastLoginAt?: string }).lastLoginAt
                            : undefined
                      }
                    />
                  </div>
                )}

              {/* POLLS TAB CONTENT - hidden in MVP mode */}
              {isHired &&
                (isOwner || isHiredPro) &&
                activeSidebarTab === "polls" && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] p-4 md:p-6 min-h-[300px]">
                    <PollsTab
                      jobId={job.id}
                      // Pro controls (create/close/delete) must be gated on
                      // being THE hired pro for this job, not on being any
                      // user with role==='pro'. Previously a pro user who
                      // posted a job as a client would see the pro-side
                      // poll UI in their own hired job. Backend already
                      // enforces this correctly; this fixes the UI leak.
                      isPro={!!isHiredPro}
                      isClient={isOwner || false}
                      userId={user?.id}
                      locale={locale}
                      embedded={true}
                      refreshTick={pollsRefreshTick}
                    />
                  </div>
                )}

              {/* RESOURCES TAB CONTENT - hidden in MVP mode */}
              {isHired &&
                (isOwner || isHiredPro) &&
                activeSidebarTab === "resources" && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] p-4 md:p-6 min-h-[300px]">
                    <ProjectWorkspace
                      jobId={job.id}
                      locale={locale}
                      isClient={isOwner || false}
                      embedded={true}
                      refreshTick={materialsRefreshTick}
                    />
                  </div>
                )}

              {/* HISTORY TAB CONTENT - hidden in MVP mode */}
              {isHired &&
                (isOwner || isHiredPro) &&
                activeSidebarTab === "history" && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden min-h-[300px]">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 px-4 py-3 border-b border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/30">
                      {[
                        { key: "all", label: t("common.all") },
                        { key: "client", label: t("common.client") },
                        { key: "pro", label: t("jobDetail.pro") },
                      ].map((f) => (
                        <Button
                          key={f.key}
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setHistoryFilter(f.key as typeof historyFilter)
                          }
                          className={`rounded-full ${
                            historyFilter === f.key
                              ? "text-white hover:text-white"
                              : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]"
                          }`}
                          style={
                            historyFilter === f.key
                              ? { backgroundColor: ACCENT }
                              : {}
                          }
                        >
                          {f.label}
                        </Button>
                      ))}
                    </div>
                    {/* History Timeline */}
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="lg" color={ACCENT} />
                        </div>
                      ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-8 text-[var(--hm-fg-muted)]">
                          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">
                            {t("jobDetail.noActivityYet")}
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[var(--hm-bg-tertiary)]" />

                          <div className="space-y-4">
                            {filteredHistory.slice(0, 30).map((event, idx) => {
                              const config = getEventConfig(event.eventType);
                              const description = getEventDescription(event);
                              return (
                                <div
                                  key={`history-${idx}`}
                                  className="relative flex items-start gap-3 pl-1"
                                >
                                  <div
                                    className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white"
                                    style={{
                                      backgroundColor: config.bgColor,
                                      color: config.color,
                                    }}
                                  >
                                    {config.icon}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
                                        {event.userName}
                                      </span>
                                      <Badge
                                        variant={
                                          event.userRole === "client"
                                            ? "info"
                                            : "success"
                                        }
                                        size="xs"
                                      >
                                        {event.userRole === "client"
                                          ? t("common.client")
                                          : t("jobDetail.pro")}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--hm-fg-secondary)] mt-0.5">
                                      {pick({ en: config.label, ka: config.labelKa })}
                                      {description && (
                                        <span className="text-[var(--hm-fg-muted)]">
                                          {" "}
                                          · {description}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-[var(--hm-fg-muted)] mt-1">
                                      {formatHistoryTime(event.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Show more indicator */}
                          {filteredHistory.length > 30 && (
                            <div className="mt-4 text-center">
                              <span className="text-xs text-[var(--hm-fg-muted)]">
                                {t("jobDetail.moreEvents", {
                                  count: filteredHistory.length - 30,
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* DETAILS TAB CONTENT (or non-hired job content) */}
              {(!isHired ||
                !(isOwner || isHiredPro) ||
                activeSidebarTab === "details") && (
                <>
                  {/* Inline Applicants (moved here from the bottom of the
                      details tab so owners see the proposal list before
                      the spec block). id="applicants-section" pairs with
                      the meta-row anchor link in the hero. Hidden once
                      the job is hired - the hired-pro sidebar card is
                      already showing the active contact. */}
                  {isOwner && isOpen && proposals.length > 0 && (
                    <section id="applicants-section" className="bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] scroll-mt-24">
                      <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--hm-brand-500)]" />
                        {t("jobDetail.applicants")} ({proposals.length})
                      </h2>
                      <div className="space-y-3">
                        {proposals.slice(0, 10).map((proposal: any) => {
                          const pro = proposal.proId || {};
                          const isPending = proposal.status === 'pending';
                          const isShortlisted = proposal.status === 'shortlisted';
                          return (
                            <div
                              key={proposal._id || proposal.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                isShortlisted
                                  ? 'border-[var(--hm-success-500)]/20 bg-[var(--hm-success-50)]/50'
                                  : 'border-[var(--hm-border-subtle)]'
                              }`}
                            >
                              <Link href={`/professionals/${pro.uid || pro.id || pro._id}`} className="relative">
                                {pro.avatar ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={pro.avatar}
                                    alt={pro.name ? `${pro.name} avatar` : ""}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center text-sm font-bold text-[var(--hm-fg-muted)]">
                                    {(pro.name || '?')[0]}
                                  </div>
                                )}
                                {/* Recently-active dot - hints to the
                                    client that this pro was around in
                                    the last 30 min so a message will
                                    likely land while they're still
                                    looking. lastLoginAt is a stale
                                    snapshot, not WS presence; keep
                                    the visual subtle to match. */}
                                {isRecentlyActive(pro.lastLoginAt) && (
                                  <span
                                    aria-label={t("presence.activeRecently")}
                                    title={t("presence.activeRecently")}
                                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--hm-success-500)] ring-2 ring-[var(--hm-bg-elevated)]"
                                  />
                                )}
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <Link
                                    href={`/professionals/${pro.uid || pro.id || pro._id}`}
                                    className="text-sm font-medium text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors"
                                  >
                                    {pro.name}
                                  </Link>
                                  <ResponseTimeChip avgHours={pro.avgResponseTime} variant="block" />
                                  {proposal.proposedPrice && (
                                    <span className="text-xs font-semibold text-[var(--hm-brand-500)]">
                                      {proposal.proposedPrice}{currencySymbol({ country: job.country ?? 'GE' })}
                                    </span>
                                  )}
                                  {isShortlisted && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--hm-success-100)] text-[var(--hm-success-500)] font-medium">
                                      {t("common.shortlisted")}
                                    </span>
                                  )}
                                </div>
                                {proposal.coverLetter && (
                                  <p className="text-xs text-[var(--hm-fg-muted)] line-clamp-2">
                                    {proposal.coverLetter}
                                  </p>
                                )}
                                {isPending && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await api.post(`/jobs/proposals/${proposal._id || proposal.id}/shortlist`, { hiringChoice: 'homico' });
                                          setProposals(prev => prev.map(p =>
                                            (p._id || p.id) === (proposal._id || proposal.id)
                                              ? { ...p, status: 'shortlisted' }
                                              : p
                                          ));
                                        } catch {}
                                      }}
                                    >
                                      {t("common.interested")}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await api.post(`/jobs/proposals/${proposal._id || proposal.id}/reject`);
                                          setProposals(prev => prev.map(p =>
                                            (p._id || p.id) === (proposal._id || proposal.id)
                                              ? { ...p, status: 'rejected' }
                                              : p
                                          ));
                                        } catch {}
                                      }}
                                      className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
                                    >
                                      {t("common.reject")}
                                    </Button>
                                  </div>
                                )}
                                {isShortlisted && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={async () => {
                                        const proposalKey = proposal._id || proposal.id;
                                        // Optimistic update: flip this one to
                                        // accepted, the rest to rejected (only
                                        // one pro can be hired per job).
                                        setProposals((prev) =>
                                          prev.map((p) => {
                                            const key = p._id || p.id;
                                            if (key === proposalKey) return { ...p, status: 'accepted' };
                                            if (p.status === 'pending') return { ...p, status: 'rejected' };
                                            return p;
                                          }),
                                        );
                                        try {
                                          const { data: acceptData } = await api.post<{ paymentRedirectUrl?: string | null }>(`/jobs/proposals/${proposalKey}/accept`);
                                          trackEvent(AnalyticsEvent.PROPOSAL_ACCEPT, {
                                            jobId: params.id as string,
                                            proposalId: String(proposalKey ?? ""),
                                            proposalAmount: typeof proposal.proposedPrice === "number" ? proposal.proposedPrice : undefined,
                                          });
                                          // Escrow-at-hire: the hire is not final until the client pays.
                                          if (acceptData?.paymentRedirectUrl) {
                                            window.location.href = acceptData.paymentRedirectUrl;
                                            return;
                                          }
                                          toast.success(t("proposal.hireSuccess"));
                                          haptic("success");
                                          // Visual celebration to match the
                                          // haptic + toast. Hiring is a real
                                          // milestone moment - users earned
                                          // the confetti. Auto-resets after
                                          // ~2s so a follow-up re-hire (test
                                          // scenarios) can trigger again.
                                          setHireCelebration(true);
                                          window.setTimeout(() => setHireCelebration(false), 2000);
                                          // Refetch so server-computed fields
                                          // (hiredPro, status, project record)
                                          // land in state. The hero block and
                                          // sidebar tabs key off this object.
                                          const fresh = await api.get(`/jobs/${params.id}`);
                                          setJob(fresh.data);
                                        } catch {
                                          toast.error(t("proposal.hireFailed"));
                                          // Revert by refetching proposals.
                                          if (job?.id) {
                                            const res = await api.get(`/jobs/${job.id}/proposals`);
                                            setProposals(res.data ?? []);
                                          }
                                        }
                                      }}
                                    >
                                      {t("common.hire")}
                                    </Button>
                                    <Link
                                      href={`/professionals/${pro.uid || pro.id || pro._id}`}
                                      className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--hm-fg-muted)] border border-[var(--hm-border)] hover:border-[var(--hm-brand-500)]/40 transition-colors"
                                    >
                                      {t("common.viewProfile")}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Empty state - owner is open with no proposals yet. Sits
                      where the applicants section would go so the prominent
                      slot above the description is never blank for the owner
                      of an open job. */}
                  {isOwner && isOpen && proposals.length === 0 && (
                    <section className="bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-0.5">
                            {t("jobDetail.empty.noProposalsTitle")}
                          </h3>
                          <p className="text-xs sm:text-sm text-[var(--hm-fg-secondary)] mb-3">
                            {t("jobDetail.empty.noProposalsBody")}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShareJob}
                          >
                            <Share2 className="w-4 h-4" />
                            {t("jobDetail.empty.shareCta")}
                          </Button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Description - gated so non-owners never see an empty
                      heading-only card, and owners on a description-less
                      open job see an "Add description" prompt instead. */}
                  {job.description ? (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] transition-all duration-500 delay-100 hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                          {t("common.description")}
                        </h2>
                        {isOwner && !isHired && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditDescription(job.description || "");
                              setShowDescriptionEdit(true);
                            }}
                            title={t("common.edit")}
                            aria-label={t("common.edit")}
                            className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-border)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="font-body text-sm sm:text-base text-[var(--hm-fg-secondary)] leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </section>
                  ) : isOwner && !isHired ? (
                    <section className="bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-dashed border-[var(--hm-border)]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-0.5">
                            {t("jobDetail.empty.noDescriptionTitle")}
                          </h3>
                          <p className="text-xs sm:text-sm text-[var(--hm-fg-secondary)] mb-3">
                            {t("jobDetail.empty.noDescriptionBody")}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditDescription("");
                              setShowDescriptionEdit(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                            {t("jobDetail.empty.addDescriptionCta")}
                          </Button>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {/* Services breakdown. Grouped by catalog subcategory
                      so multi-service jobs read as a structured estimate
                      rather than a flat shopping list. Per-line pricing
                      shows: fixed total (qty × unitPrice), catalog-
                      sourced range, or a "Negotiable" pill when the
                      client left the price open. Footer rolls up the
                      fixed total + the range bracket + the negotiable
                      count so the viewer always sees the full picture. */}
                  {servicesView.groups.length > 0 && (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] overflow-hidden transition-all duration-500 delay-100 hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
                    >
                      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--hm-border-subtle)]">
                        <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                          {t("common.services")}
                        </h2>
                        <span className="text-[11px] text-[var(--hm-fg-muted)] tabular-nums">
                          {servicesView.fixedCount + servicesView.rangeCount + servicesView.negotiableCount}
                        </span>
                      </div>
                      {servicesView.groups.map((group) => {
                        const sym = currencySymbol({ country: job.country ?? "GE" });
                        return (
                          <div key={group.key} className="border-b border-[var(--hm-border-subtle)] last:border-b-0">
                            {/* Group header. Always render even with a
                                single group so the section reads as a
                                structured estimate. */}
                            <div className="px-4 sm:px-5 pt-3 pb-1.5">
                              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)]">
                                {group.name}
                              </h3>
                            </div>
                            <div className="divide-y divide-[var(--hm-border-subtle)]">
                              {group.items.map((line) => (
                                <div
                                  key={line.key}
                                  className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block truncate text-[var(--hm-fg-primary)]">
                                      {line.name}
                                    </span>
                                    <span className="text-[11px] text-[var(--hm-fg-muted)]">
                                      {line.qty > 1 ? `${line.qty} × ` : ""}
                                      {line.unitLabel || "-"}
                                    </span>
                                  </div>
                                  {line.mode === "fixed" && (
                                    <span className="text-sm font-bold shrink-0 text-[var(--hm-brand-500)] tabular-nums">
                                      {line.lineFixed}{sym}
                                    </span>
                                  )}
                                  {line.mode === "range" && (
                                    <span className="text-sm font-bold shrink-0 text-[var(--hm-brand-500)] tabular-nums">
                                      {line.lineMin}-{line.lineMax}{sym}
                                    </span>
                                  )}
                                  {line.mode === "negotiable" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border border-dashed border-[var(--hm-border-subtle)]">
                                      <MessageCircle className="w-3 h-3" />
                                      {t("job.negotiable")}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Footer roll-up. Skipped entirely when there's a
                          single line (a one-row card needs no total). */}
                      {(servicesView.fixedCount + servicesView.rangeCount + servicesView.negotiableCount) > 1 && (
                        <div className="px-4 sm:px-5 py-3 bg-[var(--hm-brand-500)]/[4%] border-t border-[var(--hm-border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <span className="text-[12px] font-semibold text-[var(--hm-fg-secondary)]">
                            {t("common.total")}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const sym = currencySymbol({ country: job.country ?? "GE" });
                              const fixedSum = servicesView.fixedTotal;
                              const hasRange = servicesView.rangeCount > 0;
                              const hasFixed = servicesView.fixedCount > 0;
                              if (hasFixed && hasRange) {
                                // Combined: fixed + range bracket
                                return (
                                  <span className="text-sm font-bold text-[var(--hm-brand-500)] tabular-nums">
                                    {fixedSum + servicesView.rangeMin}-{fixedSum + servicesView.rangeMax}{sym}
                                  </span>
                                );
                              }
                              if (hasFixed) {
                                return (
                                  <span className="text-sm font-bold text-[var(--hm-brand-500)] tabular-nums">
                                    {fixedSum}{sym}
                                  </span>
                                );
                              }
                              if (hasRange) {
                                return (
                                  <span className="text-sm font-bold text-[var(--hm-brand-500)] tabular-nums">
                                    {servicesView.rangeMin}-{servicesView.rangeMax}{sym}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {servicesView.negotiableCount > 0 && (
                              <span className="text-[11px] text-[var(--hm-fg-muted)]">
                                {t("job.openToOffersCount", { count: servicesView.negotiableCount })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Property Specs */}
                  {(job.propertyType ||
                    job.currentCondition ||
                    job.areaSize != null ||
                    job.roomCount != null ||
                    job.floorCount != null ||
                    job.deadline ||
                    job.cadastralId ||
                    job.landArea != null ||
                    job.pointsCount != null) && (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] transition-all duration-500 delay-150 hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                          {t("jobDetail.propertyDetails")}
                        </h2>
                        {isOwner && !isHired && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={openPropertyEditModal}
                            title={t("common.edit")}
                            aria-label={t("common.edit")}
                            className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-border)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {job.propertyType && (
                          <SpecCard
                            icon={<Home className="w-5 h-5" />}
                            label={t("common.type")}
                            value={getPropertyTypeLabel(job.propertyType)}
                          />
                        )}
                        {job.currentCondition && (
                          <SpecCard
                            icon={<Hammer className="w-5 h-5" />}
                            label={t("job.condition")}
                            value={getConditionLabel(job.currentCondition)}
                          />
                        )}
                        {job.areaSize != null && (
                          <SpecCard
                            icon={<Ruler className="w-5 h-5" />}
                            label={t("jobDetail.area")}
                            value={`${job.areaSize} მ²`}
                          />
                        )}
                        {job.landArea != null && (
                          <SpecCard
                            icon={<Mountain className="w-5 h-5" />}
                            label={t("jobDetail.landArea")}
                            value={`${job.landArea} მ²`}
                          />
                        )}
                        {job.roomCount != null && (
                          <SpecCard
                            icon={<DoorOpen className="w-5 h-5" />}
                            label={t("jobDetail.rooms")}
                            value={job.roomCount.toString()}
                          />
                        )}
                        {job.pointsCount != null && (
                          <SpecCard
                            icon={<Zap className="w-5 h-5" />}
                            label={t("jobDetail.points")}
                            value={job.pointsCount.toString()}
                          />
                        )}
                        {job.floorCount != null && (
                          <SpecCard
                            icon={<Layers className="w-5 h-5" />}
                            label={t("jobDetail.floors")}
                            value={job.floorCount.toString()}
                          />
                        )}
                        {job.cadastralId && (
                          <SpecCard
                            icon={<Map className="w-5 h-5" />}
                            label={t("jobDetail.cadastral")}
                            value={job.cadastralId}
                          />
                        )}
                        {job.deadline && (
                          <SpecCard
                            icon={<Calendar className="w-5 h-5" />}
                            label={t("jobDetail.deadline")}
                            value={(() => {
                              return formatDateMonthDay(job.deadline, locale);
                            })()}
                          />
                        )}
                      </div>
                    </section>
                  )}

                  {/* Work Types */}
                  {job.workTypes && job.workTypes.length > 0 && (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] transition-all duration-500 delay-200 hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                          {t("jobDetail.workTypes")}
                        </h2>
                        {isOwner && !isHired && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={openWorkTypesEditModal}
                            title={t("common.edit")}
                            aria-label={t("common.edit")}
                            className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-border)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {job.workTypes.map((type) => (
                          <span
                            key={type}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-body text-xs sm:text-sm font-medium transition-all hover:scale-105 bg-[var(--hm-brand-500)]/[6%] text-[var(--hm-brand-500)]"
                          >
                            {getWorkTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Requirements */}
                  {(job.furnitureIncluded ||
                    job.visualizationNeeded ||
                    job.materialsProvided ||
                    job.occupiedDuringWork) && (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] transition-all duration-500 delay-[250ms] hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                          {t("jobDetail.requirements")}
                        </h2>
                        {isOwner && !isHired && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={openRequirementsEditModal}
                            title={t("common.edit")}
                            aria-label={t("common.edit")}
                            className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-border)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {job.furnitureIncluded && (
                          <RequirementBadge
                            icon={<Armchair className="w-4 h-4" />}
                            text={t("jobDetail.furnitureSelection")}
                          />
                        )}
                        {job.visualizationNeeded && (
                          <RequirementBadge
                            icon={<Box className="w-4 h-4" />}
                            text={t("jobDetail.3dVisualization")}
                          />
                        )}
                        {job.materialsProvided && (
                          <RequirementBadge
                            icon={<Package className="w-4 h-4" />}
                            text={t("jobDetail.materialsProvided")}
                          />
                        )}
                        {job.occupiedDuringWork && (
                          <RequirementBadge
                            icon={<Users className="w-4 h-4" />}
                            text={t("jobDetail.occupiedDuringWork")}
                          />
                        )}
                      </div>
                    </section>
                  )}

                  {/* References */}
                  {job.references && job.references.length > 0 && (() => {
                    const refImages = job.references.filter((r) => r.type === "image");
                    const refLinks = job.references.filter((r) => r.type !== "image");
                    return (
                    <section
                      className={`bg-[var(--hm-bg-elevated)] rounded-xl p-4 sm:p-5 border border-[var(--hm-border-subtle)] transition-all duration-500 delay-300 hover:border-[var(--hm-border)] hover:shadow-[0_4px_16px_-4px_rgba(20,18,14,0.08)] hover:-translate-y-0.5 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-3 sm:mb-4">
                        {t("jobDetail.references")}
                      </h2>

                      {/* Reference Images - grid with lightbox preview */}
                      {refImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                          {refImages.map((ref, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              onClick={() => setSelectedRefImageIndex(idx)}
                              className="relative aspect-[4/3] h-auto p-0 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] group hover:bg-transparent"
                              aria-label={ref.title || `Reference ${idx + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={storage.getFileUrl(ref.url)}
                                alt={ref.title || ""}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Reference Links */}
                      {refLinks.length > 0 && (
                      <div className="space-y-2">
                        {refLinks.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-[var(--hm-border-subtle)] hover:bg-[var(--hm-bg-tertiary)]/50 active:bg-[var(--hm-bg-tertiary)] transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                              {ref.type === "pinterest" ? (
                                /* Pinterest brand mark - not available in lucide-react */
                                <svg
                                  className="w-5 h-5"
                                  style={{ color: "#E60023" }}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                                </svg>
                              ) : ref.type === "instagram" ? (
                                <Instagram
                                  className="w-5 h-5"
                                  style={{ color: "#E4405F" }}
                                  strokeWidth={1.5}
                                />
                              ) : (
                                <ExternalLink className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                              )}
                            </div>
                            <span className="font-body text-sm text-[var(--hm-fg-secondary)] truncate flex-1">
                              {ref.title ||
                                (() => {
                                  try {
                                    return new URL(ref.url).hostname;
                                  } catch {
                                    return ref.url;
                                  }
                                })()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-fg-muted)] group-hover:translate-x-1 transition-all" />
                          </a>
                        ))}
                      </div>
                      )}
                    </section>
                    );
                  })()}

                  {/* Inline Applicants moved above description for prominence -
                      the list is the most actionable thing on the page for a
                      client and used to sit at the very bottom of details. */}

                  {/* My Proposal - only show when not hired (pending/rejected/withdrawn) */}
                  {myProposal &&
                    isPro &&
                    !isHiredPro &&
                    myProposal.status !== "accepted" && (
                      <MyProposalCard
                        proposal={{
                          id: myProposal.id,
                          coverLetter: myProposal.coverLetter,
                          proposedPrice: myProposal.proposedPrice,
                          estimatedDuration: myProposal.estimatedDuration,
                          estimatedDurationUnit:
                            myProposal.estimatedDurationUnit as
                              | "days"
                              | "weeks"
                              | "months"
                              | undefined,
                          status: myProposal.status as
                            | "pending"
                            | "accepted"
                            | "rejected"
                            | "withdrawn",
                          createdAt: myProposal.createdAt,
                        }}
                        locale={locale as "en" | "ka" | "ru"}
                      />
                    )}
                </>
              )}

              {/* LEGACY: Project Status Tracker - HIDDEN when sidebar is active */}
              {(isHiredPro || isOwner) &&
                isHired &&
                activeSidebarTab === "details" &&
                false && (
                  <section className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden">
                    {/* Header with progress */}
                    <div className="p-4 border-b border-[var(--hm-border-subtle)]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${ACCENT}15` }}
                          >
                            <BarChart3
                              className="w-5 h-5"
                              style={{ color: ACCENT }}
                            />
                          </div>
                          <div>
                            <h3 className="font-display text-base font-semibold text-[var(--hm-fg-primary)]">
                              {t("jobDetail.projectStatus")}
                            </h3>
                            <p className="text-xs text-[var(--hm-fg-muted)]">
                              {pick({
                                en: STAGES[getStageIndex(projectStage)]?.label,
                                ka: STAGES[getStageIndex(projectStage)]?.labelKa,
                              })}
                            </p>
                          </div>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: ACCENT }}
                        >
                          {STAGES[getStageIndex(projectStage)]?.progress || 0}%
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 bg-[var(--hm-bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${STAGES[getStageIndex(projectStage)]?.progress || 0}%`,
                            background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Client Actions when project is completed but not yet confirmed */}
                      {isOwner &&
                        projectStage === "completed" &&
                        !isClientConfirmed && (
                          <div className="mb-4 p-4 rounded-xl bg-[var(--hm-success-50)]/20 border border-[var(--hm-success-500)]/20">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--hm-success-500)]/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-[var(--hm-success-500)]" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[var(--hm-success-500)]">
                                  {t("jobDetail.workCompleted")}
                                </p>
                                <p className="text-xs text-[var(--hm-success-500)] mt-0.5">
                                  {t(
                                    "jobDetail.pleaseReviewAndConfirmCompletion",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleClientConfirm}
                                disabled={isUpdatingStage}
                                loading={isUpdatingStage}
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                leftIcon={
                                  !isUpdatingStage ? (
                                    <BadgeCheck className="w-4 h-4" />
                                  ) : undefined
                                }
                              >
                                {t("common.confirm")}
                              </Button>
                              <Button
                                onClick={handleClientRequestChanges}
                                disabled={isUpdatingStage}
                                variant="outline"
                                size="sm"
                                leftIcon={<RotateCcw className="w-4 h-4" />}
                              >
                                {t("jobDetail.changes")}
                              </Button>
                            </div>
                          </div>
                        )}

                      {/* Leave Review button when project is confirmed but no review yet */}
                      {isOwner &&
                        projectStage === "completed" &&
                        isClientConfirmed &&
                        !hasSubmittedReview && (
                          <div className="mb-4 p-4 rounded-xl bg-[var(--hm-warning-50)]/20 border border-[var(--hm-warning-500)]/20">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--hm-warning-500)]/20 flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 text-[var(--hm-warning-500)]" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[var(--hm-warning-500)]">
                                  {t("jobDetail.leaveAReview")}
                                </p>
                                <p className="text-xs text-[var(--hm-warning-500)] mt-0.5">
                                  {t("jobDetail.yourFeedbackHelpsOtherClients")}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setShowReviewModal(true)}
                              size="sm"
                              className="w-full bg-amber-600 hover:bg-amber-700"
                              leftIcon={<Star className="w-4 h-4" />}
                            >
                              {t("jobDetail.writeAReview")}
                            </Button>
                          </div>
                        )}

                      {/* Stage Timeline */}
                      <div className="space-y-0">
                        {STAGES.map((stage, index) => {
                          const currentIndex = getStageIndex(projectStage);
                          const isStageCompleted = index < currentIndex;
                          const isCurrent = index === currentIndex;
                          const isNext = index === currentIndex + 1;
                          const canAdvance =
                            isHiredPro && isNext && !isUpdatingStage && !isCompleted;
                          const isLast = index === STAGES.length - 1;

                          return (
                            <div
                              key={stage.key}
                              className="flex items-stretch gap-3"
                            >
                              {/* Timeline indicator */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`
                                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                  transition-all duration-300
                              ${
                                isStageCompleted
                                  ? "bg-[var(--hm-success-500)] text-white"
                                  : isCurrent
                                    ? "text-white shadow-lg"
                                    : canAdvance
                                      ? "bg-[var(--hm-bg-elevated)] border-2 border-dashed text-[var(--hm-fg-muted)]"
                                      : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]"
                              }
                            `}
                                  style={{
                                    backgroundColor: isCurrent
                                      ? ACCENT
                                      : undefined,
                                    borderColor: canAdvance
                                      ? ACCENT
                                      : undefined,
                                  }}
                                >
                                  {isUpdatingStage && isCurrent ? (
                                    <LoadingSpinner size="xs" color="white" />
                                  ) : isStageCompleted ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <span className="text-xs font-bold">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>
                                {/* Connecting line */}
                                {!isLast && (
                                  <div
                                    className={`w-0.5 flex-1 min-h-[24px] transition-colors duration-300 ${
                                      isStageCompleted
                                        ? "bg-[var(--hm-success-500)]"
                                        : "bg-[var(--hm-bg-tertiary)]"
                                    }`}
                                  />
                                )}
                              </div>

                              {/* Stage content */}
                              <div
                                className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}
                              >
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    canAdvance && handleStageChange(stage.key)
                                  }
                                  disabled={!canAdvance}
                                  className={`
                                  w-full h-auto justify-start text-left p-3 rounded-xl
                                  ${
                                    isCurrent
                                      ? "bg-[var(--hm-brand-500)]/10 border border-[var(--hm-brand-500)]/20"
                                      : canAdvance
                                        ? "bg-[var(--hm-bg-elevated)] border border-dashed border-[var(--hm-brand-500)]/40 hover:border-solid hover:border-[var(--hm-brand-500)] hover:shadow-md cursor-pointer"
                                        : isStageCompleted
                                          ? "bg-[var(--hm-success-50)]/10"
                                          : ""
                                  }
                                `}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`
                                      text-sm font-medium
                                      ${
                                        isStageCompleted
                                          ? "text-[var(--hm-success-500)]"
                                          : isCurrent
                                            ? "text-[var(--hm-brand-500)] font-semibold"
                                            : "text-[var(--hm-fg-muted)]"
                                      }
                                    `}
                                      >
                                        {pick({ en: stage.label, ka: stage.labelKa })}
                                      </span>
                                      {isCurrent && (
                                        <span
                                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                                          style={{ backgroundColor: ACCENT }}
                                        >
                                          {t("jobDetail.current")}
                                        </span>
                                      )}
                                    </div>
                                    {canAdvance && (
                                      <div
                                        className="flex items-center gap-1 text-xs font-medium"
                                        style={{ color: ACCENT }}
                                      >
                                        <span>{t("common.next")}</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

              {/* LEGACY: Project Chat moved to sidebar tabs - HIDDEN */}

              {/* Comments Section - Interest Board (for open jobs) */}
              {job.status === "open" && (
                <section className="mt-8">
                  <JobCommentsSection
                    jobId={job.id}
                    clientId={job.clientId?.id || ""}
                    isJobOwner={!!isOwner}
                  />
                </section>
              )}
            </div>

            {/* Sidebar - visible on all screens, stacked on mobile */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6">
                {/* Hired Professional Card - rendered FIRST in the sidebar
                    when the client is viewing a hired job. The active
                    contact (the hired pro's name + phone) is what the
                    client needs most; ClientCard moves below to free
                    the prime sidebar slot. */}
                {isHired && job.hiredPro && isOwner && (
                  <div
                    className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] transition-all duration-500 delay-200 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-[var(--hm-fg-secondary)]" />
                      </div>
                      <h3 className="font-display text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider">
                        {t("common.hired")}
                      </h3>
                    </div>
                    <Link
                      href={`/professionals/${job.hiredPro.uid || job.hiredPro.id || job.hiredPro.userId?.id}`}
                      className="flex items-center gap-3 group mb-4"
                    >
                      <Avatar
                        src={job.hiredPro.avatar || job.hiredPro.userId?.avatar}
                        name={
                          job.hiredPro.name ||
                          job.hiredPro.userId?.name ||
                          "Professional"
                        }
                        size="lg"
                        className="w-12 h-12"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-semibold text-[var(--hm-fg-primary)] truncate group-hover:underline">
                          {job.hiredPro.name ||
                            job.hiredPro.userId?.name ||
                            "Professional"}
                        </p>
                        {job.hiredPro.title && (
                          <p className="font-body text-xs text-[var(--hm-fg-muted)] truncate">
                            {job.hiredPro.title}
                          </p>
                        )}
                        {/* "Last active X ago" - reassures the client
                            that the pro holding their deposit is still
                            actively using Homico. Renders only when we
                            have a lastLoginAt and within 30 days. */}
                        {(() => {
                          const lastLogin =
                            (job.hiredPro as { lastLoginAt?: string })
                              ?.lastLoginAt ||
                            (job.hiredPro?.userId as { lastLoginAt?: string })
                              ?.lastLoginAt;
                          if (!lastLogin) return null;
                          const diffMin = Math.floor(
                            (Date.now() - new Date(lastLogin).getTime()) /
                              60000,
                          );
                          if (diffMin < 5) {
                            return (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--hm-success-500)] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-success-500)]" />
                                {t("professional.activeNow")}
                              </p>
                            );
                          }
                          if (diffMin >= 60 * 24 * 30) return null;
                          let label: string;
                          if (diffMin < 60)
                            label = t("professional.lastSeenMinutes", {
                              count: diffMin,
                            });
                          else if (diffMin < 60 * 24)
                            label = t("professional.lastSeenHours", {
                              count: Math.floor(diffMin / 60),
                            });
                          else
                            label = t("professional.lastSeenDays", {
                              count: Math.floor(diffMin / 60 / 24),
                            });
                          return (
                            <p className="mt-1 text-xs text-[var(--hm-fg-muted)]">
                              {label}
                            </p>
                          );
                        })()}
                      </div>
                    </Link>
                    {/* Phone CTA for client to call pro */}
                    {(job.hiredPro?.phone || job.hiredPro?.userId?.phone) && (
                      <a
                        href={`tel:${job.hiredPro?.phone || job.hiredPro?.userId?.phone}`}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-colors bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
                      >
                        <Phone className="w-4 h-4" />
                        {job.hiredPro?.phone || job.hiredPro?.userId?.phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Client Card - sits below the hired-pro card for the
                    client (reference info, not the active contact) and
                    skipped entirely when the hired pro is viewing,
                    because the hired-by banner already shows the
                    client's info. */}
                {!(isHired && isHiredPro) && (
                  <ClientCard
                    client={{
                      _id: job.clientId?.id || "",
                      name: job.clientId?.name || "Client",
                      avatar: job.clientId?.avatar,
                      city: job.clientId?.city,
                      accountType: job.clientId?.accountType,
                      companyName: job.clientId?.companyName,
                    }}
                    label={t("common.client")}
                    organizationLabel={t("jobDetail.organization")}
                    isVisible={isVisible}
                  />
                )}

                {/* Hired by banner for pro - show client info and phone */}
                {isHired && isHiredPro && (
                  <div
                    className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] transition-all duration-500 delay-150 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                        <BadgeCheck className="w-3.5 h-3.5 text-[var(--hm-fg-secondary)]" />
                      </div>
                      <h3 className="font-display text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider">
                        {t("jobDetail.youveBeenHired")}
                      </h3>
                    </div>
                    {/* Client info - clickable */}
                    <Link
                      href={`/users/${job.clientId?.id}`}
                      className="flex items-center gap-3 group mb-4"
                    >
                      <Avatar
                        src={job.clientId?.avatar}
                        name={job.clientId?.name || "Client"}
                        size="lg"
                        className="w-12 h-12 group-hover:ring-2 group-hover:ring-[var(--hm-brand-500)]/50 transition-all"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-semibold text-[var(--hm-fg-primary)] truncate group-hover:text-[var(--hm-brand-500)] transition-colors">
                          {job.clientId?.accountType === "organization"
                            ? job.clientId?.companyName || job.clientId?.name
                            : job.clientId?.name || "Client"}
                        </p>
                        <p className="text-xs text-[var(--hm-fg-muted)]">
                          {t("common.client")}
                        </p>
                      </div>
                    </Link>
                    {/* Phone CTA for pro to call client */}
                    {job.clientId?.phone && (
                      <a
                        href={`tel:${job.clientId.phone}`}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-colors bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
                      >
                        <Phone className="w-4 h-4" />
                        {job.clientId.phone}
                      </a>
                    )}
                  </div>
                )}

                {/* LEGACY: Polls Section moved to sidebar tabs - HIDDEN */}

                {/* LEGACY: Resources Section moved to sidebar tabs - HIDDEN */}

                {/* LEGACY: History Section moved to sidebar tabs - HIDDEN */}

                {/* Share Section - Only show when job is not hired */}
                {!isHired && (
                  <div className="group rounded-xl sm:rounded-2xl bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}25 100%)`,
                            border: `1px solid ${ACCENT}20`,
                          }}
                        >
                          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-brand-500)]" />
                        </div>
                        <div className="text-left">
                          <span className="font-body font-semibold text-sm sm:text-base text-[var(--hm-fg-primary)] block">
                            {t("common.share")}
                          </span>
                          <span className="text-xs text-[var(--hm-fg-muted)]">
                            #{job.jobNumber || job.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        size="icon"
                        onClick={() => {
                          const url = `${window.location.origin}/jobs/${job.id}`;
                          const text = job.title;
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
                            "facebook-share",
                            "width=580,height=400",
                          );
                        }}
                        className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={async () => {
                          const url = `${window.location.origin}/jobs/${job.id}`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: job.title,
                                text: (job.description || "").slice(0, 100),
                                url: url,
                              });
                            } catch {
                              // User cancelled or error
                            }
                          } else {
                            await navigator.clipboard.writeText(url);
                            setCopyToast(true);
                            setTimeout(() => setCopyToast(false), 2000);
                          }
                        }}
                        title={t("common.share")}
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={async () => {
                          const url = `${window.location.origin}/jobs/${job.id}`;
                          await navigator.clipboard.writeText(url);
                          setCopyToast(true);
                          setTimeout(() => setCopyToast(false), 2000);
                        }}
                        title={t("common.copyLink")}
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA for Submit Proposal.
          The previous `bottom-16` (64px) overlapped the mobile bottom
          nav on iOS - the nav is 58px content + safe-area-inset-bottom
          (~34px on iPhones with home indicator) so the bar was tucked
          behind the nav. Now anchored to the nav's true top edge via
          `calc(58px + env(safe-area-inset-bottom))` so it always sits
          flush above whatever device chrome the nav is wearing. */}
      {isPro &&
        !isOwner &&
        isOpen &&
        !isHired &&
        !myProposal &&
        !isCheckingProposal &&
        isAuthValidated && (
          <div
            className="sm:hidden fixed left-0 right-0 z-40 bg-[var(--hm-bg-elevated)] border-t border-[var(--hm-border)] p-3"
            style={{ bottom: 'calc(58px + env(safe-area-inset-bottom))' }}
          >
            <Button
              onClick={() => {
                if (!isVerified) {
                  toast.error(
                    t("job.verificationRequired"),
                    t("job.verificationRequiredToSendProposal"),
                  );
                  return;
                }
                setShowProposalForm(true);
              }}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full h-12 text-base"
            >
              {t("jobDetail.submitProposal")}
            </Button>
          </div>
        )}

      {/* Proposal Form Modal */}
      <ProposalFormModal
        isOpen={showProposalForm}
        onClose={() => setShowProposalForm(false)}
        onSubmit={handleSubmitProposal}
        isSubmitting={isSubmitting}
        error={error}
        locale={locale}
        proposalData={proposalData}
        onDataChange={setProposalData}
        job={
          job
            ? {
                title: job.title,
                budgetMin: job.budgetMin,
                budgetMax: job.budgetMax,
                location: job.location,
                country: job.country,
                category: job.category,
                subcategory: job.subcategory,
                propertyType: job.propertyType,
                propertySize: job.areaSize,
                services: job.services,
              }
            : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteError("");
        }}
        onConfirm={handleDeleteJob}
        title={t("jobDetail.deleteThisJob")}
        description={t("jobDetail.thisActionCannotBeUndone")}
        icon={<Trash2 className="w-6 h-6 text-[var(--hm-error-500)]" />}
        variant="danger"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        isLoading={isDeleting}
        loadingLabel="..."
      >
        {deleteError && (
          <div className="px-4 py-3 rounded-xl bg-[var(--hm-error-50)]/20 text-[var(--hm-error-500)] font-body text-sm mb-4">
            {deleteError}
          </div>
        )}
      </ConfirmModal>

      {/* Invite Professionals Modal */}
      {job && (
        <InviteProsModal
          isOpen={showInviteProsModal}
          onClose={() => setShowInviteProsModal(false)}
          jobId={job.id}
          subcategory={job.subcategory || job.skills?.[0]}
          category={job.category}
        />
      )}

      {/* Portfolio Completion Modal - intercepts the pro's "advance to
          completed" click so they can attach after-photos that get
          promoted into their public portfolio when the client confirms. */}
      <PortfolioCompletionModal
        isOpen={showPortfolioModal}
        onClose={() => {
          if (!isUpdatingStage) setShowPortfolioModal(false);
        }}
        onComplete={handleCompleteWithPortfolio}
        isLoading={isUpdatingStage}
        locale={locale}
        portfolioImages={portfolioImages}
        onImagesChange={setPortfolioImages}
        isUploading={isUploadingPortfolio}
        onUpload={handlePortfolioUpload}
      />

      {/* Success Toast */}
      {success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--hm-success-500)] text-white shadow-lg font-body">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{success}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSuccess("")}
              className="hover:bg-white/20 text-white hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Copy Link Toast */}
      {copyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-neutral-800 text-white shadow-lg font-body">
            <Check className="w-5 h-5" />
            <span className="font-medium">{t("common.linkCopied")}</span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <MediaLightbox
        items={allMedia.map((m) => ({ url: m.url, type: m.type }))}
        currentIndex={selectedMediaIndex ?? 0}
        isOpen={selectedMediaIndex !== null}
        onClose={() => setSelectedMediaIndex(null)}
        onIndexChange={setSelectedMediaIndex}
        getImageUrl={(url) => storage.getFileUrl(url)}
        locale={locale as "en" | "ka" | "ru"}
        showThumbnails={false}
        showInfo={false}
      />

      {/* Reference Images Lightbox */}
      {job?.references && (() => {
        const refImages = job.references.filter((r) => r.type === "image");
        return refImages.length > 0 ? (
          <MediaLightbox
            items={refImages.map((r) => ({ url: r.url, type: "image" as const }))}
            currentIndex={selectedRefImageIndex ?? 0}
            isOpen={selectedRefImageIndex !== null}
            onClose={() => setSelectedRefImageIndex(null)}
            onIndexChange={setSelectedRefImageIndex}
            getImageUrl={(url) => storage.getFileUrl(url)}
            locale={locale as "en" | "ka" | "ru"}
            showThumbnails={refImages.length > 1}
            showInfo={false}
          />
        ) : null;
      })()}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setIsCompletionFlow(false);
        }}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
        locale={locale}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        text={reviewText}
        onTextChange={setReviewText}
        pro={
          job?.hiredPro || {
            name: "Professional",
            userId: { name: "Professional" },
          }
        }
        isCompletionFlow={isCompletionFlow}
      />

      {/* Description Edit Modal */}
      <Modal
        isOpen={showDescriptionEdit}
        onClose={() => setShowDescriptionEdit(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--hm-fg-primary)] mb-4">
            {t("jobDetail.editDescription")}
          </h2>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={8}
            placeholder={t("jobDetail.describeTheJob")}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDescriptionEdit(false)}
              disabled={isSavingDescription}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveDescription}
              loading={isSavingDescription}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Title Edit Modal */}
      <Modal
        isOpen={showTitleEdit}
        onClose={() => setShowTitleEdit(false)}
        size="md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--hm-fg-primary)] mb-4">
            {t("jobDetail.editTitle")}
          </h2>
          <Input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={t("jobDetail.jobTitle")}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowTitleEdit(false)}
              disabled={isSavingTitle}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveTitle}
              loading={isSavingTitle}
              disabled={!editTitle.trim()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Property Details Edit Modal.
       *
       * The edit form mirrors what the post-job flow originally
       * collected for this category - we don't surface fields the
       * client never saw at post time (e.g. cadastral ID on a
       * cleaning job). A field is shown if EITHER:
       *   - the job already has a non-empty value for it (the user
       *     set it at post time and should be able to change it), OR
       *   - it's in the active "expected fields" set for this job's
       *     category (so a cleaning job edit shows propertyType /
       *     areaSize / roomCount / deadline; an architecture job edit
       *     shows those plus cadastralId / landArea / floorCount).
       *
       * Universal fields (propertyType, areaSize, deadline) are
       * always rendered because the post-job's early steps collect
       * them on every category.
       */}
      <Modal
        isOpen={showPropertyEdit}
        onClose={() => setShowPropertyEdit(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--hm-fg-primary)] mb-6">
            {t("jobDetail.editPropertyDetails")}
          </h2>
          {/* Field visibility - mirrors post-job's category-aware fields.
              Each conditional below shows a field when EITHER the job
              already has a value for it (so the user can edit what
              they set) OR the current category/subcategory would have
              surfaced the field at post time. propertyType, areaSize,
              and deadline are always shown - they're collected on
              every post-job category. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                {t("job.propertyType")}
              </label>
              <Select
                value={editPropertyData.propertyType}
                onChange={(value) =>
                  setEditPropertyData((prev) => ({
                    ...prev,
                    propertyType: value,
                  }))
                }
                placeholder={t("common.select")}
                options={Object.entries(propertyTypeKeys).map(
                  ([key, translationKey]) => ({
                    value: key,
                    label: t(translationKey),
                  }),
                )}
              />
            </div>

            {/* Current Condition - relevant only for trades that
                renovate an existing space (renovation, craftsmen,
                construction). Cleaning / design / architecture flows
                don't ask about current condition at post time, so we
                hide this field unless the job already has a value. */}
            {(job?.currentCondition || ['renovation', 'craftsmen', 'construction'].includes(job?.category ?? '')) && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.currentCondition")}
                </label>
                <Select
                  value={editPropertyData.currentCondition}
                  onChange={(value) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      currentCondition: value,
                    }))
                  }
                  placeholder={t("common.select")}
                  options={Object.entries(conditionKeys).map(
                    ([key, translationKey]) => ({
                      value: key,
                      label: t(translationKey),
                    }),
                  )}
                />
              </div>
            )}

            {/* Area Size */}
            <div>
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                {t("jobDetail.areaSizeM")}
              </label>
              <Input
                type="number"
                value={editPropertyData.areaSize}
                onChange={(e) =>
                  setEditPropertyData((prev) => ({
                    ...prev,
                    areaSize: e.target.value,
                  }))
                }
                placeholder="100"
              />
            </div>

            {/* Land Area - architecture / design only, and only when
                the property is a house or building (post-job gates it
                the same way; see post-job/page.tsx line 731). */}
            {(job?.landArea != null ||
              ((job?.propertyType === 'house' || job?.propertyType === 'building') &&
                (job?.category === 'architecture' || job?.category === 'design'))) && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.landAreaM")}
                </label>
                <Input
                  type="number"
                  value={editPropertyData.landArea}
                  onChange={(e) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      landArea: e.target.value,
                    }))
                  }
                  placeholder="500"
                />
              </div>
            )}

            {/* Room Count - commonly collected on apartment / design /
                lighting categories. Hidden on categories that don't
                ask about it unless a value already exists. */}
            {(job?.roomCount != null ||
              job?.category === 'design' ||
              job?.subcategory === 'lighting' ||
              job?.propertyType === 'apartment') && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.roomCount")}
                </label>
                <Input
                  type="number"
                  value={editPropertyData.roomCount}
                  onChange={(e) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      roomCount: e.target.value,
                    }))
                  }
                  placeholder="3"
                />
              </div>
            )}

            {/* Floor Count - architecture-specific (multi-storey
                buildings, house plans). Hidden otherwise unless a
                value exists. */}
            {(job?.floorCount != null ||
              job?.category === 'architecture' ||
              job?.propertyType === 'building' ||
              job?.propertyType === 'house') && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.floorCount")}
                </label>
                <Input
                  type="number"
                  value={editPropertyData.floorCount}
                  onChange={(e) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      floorCount: e.target.value,
                    }))
                  }
                  placeholder="2"
                />
              </div>
            )}

            {/* Points Count - electrical / plumbing / HVAC / lighting
                subcategories (see post-job subcategoryFieldsOverride).
                Hidden otherwise unless a value exists. */}
            {(job?.pointsCount != null ||
              ['electrical', 'plumbing', 'hvac', 'lighting'].includes(job?.subcategory ?? '')) && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.pointsCount")}
                </label>
                <Input
                  type="number"
                  value={editPropertyData.pointsCount}
                  onChange={(e) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      pointsCount: e.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </div>
            )}

            {/* Cadastral ID - architecture / design only (see
                post-job/page.tsx line 712-713). Hidden otherwise
                unless a value exists. */}
            {(job?.cadastralId ||
              job?.category === 'architecture' ||
              job?.category === 'design') && (
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                  {t("jobDetail.cadastralId")}
                </label>
                <Input
                  type="text"
                  value={editPropertyData.cadastralId}
                  onChange={(e) =>
                    setEditPropertyData((prev) => ({
                      ...prev,
                      cadastralId: e.target.value,
                    }))
                  }
                  placeholder="XX.XX.XX.XXX.XXX.XX.XXX"
                />
              </div>
            )}

            {/* Deadline */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                {t("jobDetail.deadline")}
              </label>
              <DatePicker
                value={editPropertyData.deadline}
                onChange={(value) =>
                  setEditPropertyData((prev) => ({
                    ...prev,
                    deadline: value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
                locale={locale as "ka" | "en" | "ru"}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowPropertyEdit(false)}
              disabled={isSavingProperty}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSavePropertyDetails}
              loading={isSavingProperty}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Work Types Edit Modal */}
      <Modal
        isOpen={showWorkTypesEdit}
        onClose={() => setShowWorkTypesEdit(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--hm-fg-primary)] mb-6">
            {t("jobDetail.workTypes")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
            {allWorkTypes.map((type) => {
              const isSelected = editWorkTypes.includes(type);
              return (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditWorkTypes((prev) =>
                      isSelected
                        ? prev.filter((t) => t !== type)
                        : [...prev, type],
                    );
                  }}
                  className={`h-auto px-4 py-3 rounded-xl ${
                    isSelected
                      ? "border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]"
                      : "hover:border-[var(--hm-brand-500)]/50"
                  }`}
                >
                  {t(workTypeKeys[type] || type)}
                </Button>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowWorkTypesEdit(false)}
              disabled={isSavingWorkTypes}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveWorkTypes} loading={isSavingWorkTypes}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Requirements Edit Modal */}
      <Modal
        isOpen={showRequirementsEdit}
        onClose={() => setShowRequirementsEdit(false)}
        size="md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--hm-fg-primary)] mb-6">
            {t("jobDetail.requirements")}
          </h2>
          <div className="space-y-4">
            {/* Furniture Included */}
            <Checkbox
              checked={editRequirements.furnitureIncluded}
              onChange={(checked) =>
                setEditRequirements((prev) => ({
                  ...prev,
                  furnitureIncluded: checked,
                }))
              }
              className="p-4 rounded-xl border border-[var(--hm-border)] hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors w-full"
            >
              <div className="flex items-center gap-2">
                <Armchair className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                <span className="text-[var(--hm-fg-primary)]">
                  {t("jobDetail.furnitureSelection")}
                </span>
              </div>
            </Checkbox>

            {/* Visualization Needed */}
            <Checkbox
              checked={editRequirements.visualizationNeeded}
              onChange={(checked) =>
                setEditRequirements((prev) => ({
                  ...prev,
                  visualizationNeeded: checked,
                }))
              }
              className="p-4 rounded-xl border border-[var(--hm-border)] hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors w-full"
            >
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                <span className="text-[var(--hm-fg-primary)]">
                  {t("jobDetail.3dVisualization")}
                </span>
              </div>
            </Checkbox>

            {/* Materials Provided */}
            <Checkbox
              checked={editRequirements.materialsProvided}
              onChange={(checked) =>
                setEditRequirements((prev) => ({
                  ...prev,
                  materialsProvided: checked,
                }))
              }
              className="p-4 rounded-xl border border-[var(--hm-border)] hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors w-full"
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                <span className="text-[var(--hm-fg-primary)]">
                  {t("jobDetail.materialsProvided")}
                </span>
              </div>
            </Checkbox>

            {/* Occupied During Work */}
            <Checkbox
              checked={editRequirements.occupiedDuringWork}
              onChange={(checked) =>
                setEditRequirements((prev) => ({
                  ...prev,
                  occupiedDuringWork: checked,
                }))
              }
              className="p-4 rounded-xl border border-[var(--hm-border)] hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors w-full"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                <span className="text-[var(--hm-fg-primary)]">
                  {t("jobDetail.occupiedDuringWork")}
                </span>
              </div>
            </Checkbox>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowRequirementsEdit(false)}
              disabled={isSavingRequirements}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveRequirements}
              loading={isSavingRequirements}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pro Sticky CTA - signed-in pros viewing an open job they
          haven't applied to. Slides up once the hero scrolls off so it
          doesn't compete with the inline "Submit proposal" button at
          the top of the details column. Mobile-only (lg:hidden) since
          desktop has the sidebar always in view. */}
      {isPro &&
        !isOwner &&
        isOpen &&
        !isHired &&
        !myProposal &&
        !isCheckingProposal &&
        isAuthValidated && (
          <div
            className={`lg:hidden fixed bottom-[calc(58px+env(safe-area-inset-bottom))] left-0 right-0 z-40 transition-all duration-300 ease-out ${
              heroOutOfView
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-[var(--hm-bg-elevated)]/95 backdrop-blur-xl border-t border-[var(--hm-border)] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--hm-brand-500)] truncate flex-1 min-w-0">
                  {budgetDisplay}
                </span>
                <Button
                  onClick={() => {
                    if (!isVerified) {
                      toast.error(
                        t("job.verificationRequired"),
                        t("job.verificationRequiredToSendProposal"),
                      );
                      return;
                    }
                    setShowProposalForm(true);
                  }}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="shrink-0"
                >
                  {t("jobDetail.submitProposal")}
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Guest Sticky CTA - non-authenticated visitors from Facebook / shared links */}
      {!user && job && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up safe-area-bottom">
          {/* Glassmorphism backdrop */}
          <div className="relative overflow-hidden">
            {/* Gradient glow line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${ACCENT} 30%, #F28764 70%, transparent 100%)`,
              }}
            />
            {/* Main bar */}
            <div className="bg-[var(--hm-bg-elevated)]/95 backdrop-blur-xl border-t border-[var(--hm-border)] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
              <div className="max-w-6xl mx-auto px-4 py-3.5 sm:py-3 flex items-center gap-4">
                {/* Desktop: value text with animated dot */}
                <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse bg-[var(--hm-brand-500)]" />
                  <p className="text-sm text-[var(--hm-fg-secondary)] truncate">
                    {t("jobDetail.guestCtaTitle")}
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Primary: Become a Pro */}
                  <Link
                    href="/register/professional"
                    className="guest-cta-primary flex-1 sm:flex-none relative flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT} 0%, #F06B43 50%, #F28764 100%)`,
                      boxShadow: `0 4px 16px ${ACCENT}40`,
                    }}
                  >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent guest-cta-shimmer" />
                    <Zap className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{t("jobDetail.guestCtaBecomePro")}</span>
                  </Link>

                  {/* Secondary: Sign In */}
                  {/* Tailwind hover: variants replace the previous JS
                      mouseenter/mouseleave handlers that mutated
                      currentTarget.style - the result is the same brand
                      tint reveal but without an extra render path. */}
                  <Button
                    variant="outline"
                    onClick={() => openLoginModal()}
                    className="flex-1 sm:flex-none h-auto px-6 py-3 sm:py-2.5 rounded-xl text-sm font-semibold border-[1.5px] border-[var(--hm-brand-500)]/[19%] text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[3%] hover:bg-[var(--hm-brand-500)]/[8%] hover:border-[var(--hm-brand-500)]/[31%] transition-colors"
                  >
                    {t("jobDetail.guestCtaSignIn")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest CTA shimmer animation */}
      <style jsx>{`
        @keyframes guest-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .guest-cta-shimmer {
          animation: guest-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      {/* Animations */}
      <style jsx>{`
        @keyframes ken-burns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }
        .animate-ken-burns {
          animation: ken-burns 20s ease-out forwards;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
