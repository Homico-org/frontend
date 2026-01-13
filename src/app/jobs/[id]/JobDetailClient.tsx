"use client";

import Avatar from "@/components/common/Avatar";
import BackButton from "@/components/common/BackButton";
import DatePicker from "@/components/common/DatePicker";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MediaLightbox from "@/components/common/MediaLightbox";
import Select from "@/components/common/Select";
import ClientCard from "@/components/jobs/ClientCard";
import MyProposalCard from "@/components/jobs/MyProposalCard";
import ProjectSidebar, { ProjectSidebarMobile, ProjectSidebarTab } from "@/components/jobs/ProjectSidebar";
import ProjectStatusBar from "@/components/jobs/ProjectStatusBar";
import ProposalFormModal from "@/components/jobs/ProposalFormModal";
import RequirementBadge from "@/components/jobs/RequirementBadge";
import ReviewModal from "@/components/jobs/ReviewModal";
import SpecCard from "@/components/jobs/SpecCard";
import PollsTab from "@/components/polls/PollsTab";
import ProjectChat from "@/components/projects/ProjectChat";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { ACCENT_COLOR as ACCENT, ACCENT_LIGHT } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { api } from "@/lib/api";
import { isMVPMode } from "@/lib/mvp";
import { storage } from "@/services/storage";
import type { Job, JobClient, MediaItem, ProjectStage, Proposal } from "@/types/shared";
import { formatBudget as formatBudgetUtil } from "@/utils/currencyUtils";
import { formatTimeAgoCompact } from "@/utils/dateUtils";
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
  Sparkles,
  Star,
  Trash2,
  Users,
  Vote,
  X,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useLanguage } from "@/contexts/LanguageContext";
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

function getStageIndex(stage: ProjectStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

// Extended Job type for this page with additional client fields
interface PageJob extends Omit<Job, 'clientId'> {
  clientId: JobClient & { email?: string; phone?: string };
  updatedAt?: string;
}

// i18n translation keys for property types, conditions, and work types
const propertyTypeKeys: Record<string, string> = {
  apartment: "jobDetail.propertyType.apartment",
  house: "jobDetail.propertyType.house",
  office: "jobDetail.propertyType.office",
  building: "jobDetail.propertyType.building",
  other: "jobDetail.propertyType.other",
};

const conditionKeys: Record<string, string> = {
  "shell": "jobDetail.condition.shell",
  "black-frame": "jobDetail.condition.blackFrame",
  "needs-renovation": "jobDetail.condition.needsRenovation",
  "partial-renovation": "jobDetail.condition.partialRenovation",
  "good": "jobDetail.condition.good",
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
  subcategory?: string
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
            ))
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
  const { user } = useAuth();

  const { t } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { trackEvent } = useAnalytics();
  const toast = useToast();

  const [job, setJob] = useState<PageJob | null>(null);
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
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [isPollsExpanded, setIsPollsExpanded] = useState(true);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
  // Sidebar navigation state for hired projects
  const [activeSidebarTab, setActiveSidebarTab] = useState<ProjectSidebarTab>("details");
  
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
  const [historyFilter, setHistoryFilter] = useState<"all" | "client" | "pro">("all");
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

  const isOwner = user && job?.clientId && user.id === job.clientId.id;
  const isPro = user?.role === "pro" || user?.role === "admin";
  
  // Check if current user is the hired pro for this job
  // hiredPro structure can vary:
  // - hiredPro.userId can be a string ID or a populated object { id, name, avatar }
  // - After _id->id transform, it might be in different places
  const getHiredProUserId = (): string | null => {
    if (!job?.hiredPro) return null;
    
    // Try userId first (can be string or object)
    const hiredPro = job.hiredPro as { 
      userId?: string | { id?: string; _id?: string }; 
      id?: string;
    };
    
    if (hiredPro.userId) {
      if (typeof hiredPro.userId === 'string') return hiredPro.userId;
      if (typeof hiredPro.userId === 'object') {
        return hiredPro.userId.id || hiredPro.userId._id || null;
      }
    }
    
    return null;
  };
  const hiredProUserId = getHiredProUserId();
  const isHiredPro = isPro && job?.hiredPro && user?.id === hiredProUserId;
  
  // Debug log (remove in production)
  if (job?.hiredPro && user) {
    console.log('[JobDetail] Hired pro check:', {
      hiredPro: job.hiredPro,
      hiredProUserId,
      userId: user.id,
      isPro,
      isHiredPro,
      jobStatus: job.status,
    });
  }

  // WebSocket for real-time updates (polls, resources, stage)
  const socketRef = useRef<Socket | null>(null);
  const [projectStage, setProjectStage] = useState<ProjectStage>("hired");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isClientConfirmed, setIsClientConfirmed] = useState(false);
  // Store pro info from project tracking as fallback when job.hiredPro is missing
  const [projectProId, setProjectProId] = useState<string | null>(null);

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
      console.log("[JobDetail] WebSocket connected");
      // Join the project room for this job
      socketRef.current?.emit("joinProjectChat", job.id);
    });

    // Listen for project stage updates
    socketRef.current.on("projectStageUpdate", (data: { jobId: string; stage: string; progress: number }) => {
      console.log("[JobDetail] Project stage update:", data);
      if (data.jobId === job.id) {
        setProjectStage(data.stage as ProjectStage);
      }
    });

    // Listen for poll updates (will trigger re-render in PollsTab)
    socketRef.current.on("projectPollUpdate", (data: { type: string; poll: Record<string, unknown> }) => {
      console.log("[JobDetail] Poll update:", data);
      // PollsTab component handles its own state, this is just for logging
    });

    // Listen for materials updates (will trigger re-render in ProjectWorkspace)
    socketRef.current.on("projectMaterialsUpdate", (data: { type: string }) => {
      console.log("[JobDetail] Materials update:", data);
      // ProjectWorkspace component handles its own state, this is just for logging
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

    const checkReview = async () => {
      try {
        const response = await api.get(`/reviews/check/job/${job.id}`);
        if (response.data?.hasReview) {
          setHasSubmittedReview(true);
        }
      } catch {
        // Ignore errors
      }
    };

    checkReview();
  }, [isOwner, user, job?.id, job?.status]);

  // Fetch history when expanded and not loaded yet
  const fetchHistory = async () => {
    if (!job?.id) return;
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

  useEffect(() => {
    const jobIsHired = job?.status === "in_progress" || job?.status === "completed" || !!job?.hiredPro;
    const shouldLoadHistory = (isHistoryExpanded || activeSidebarTab === "history") && !historyLoadedRef.current && jobIsHired;
    if (shouldLoadHistory) {
      fetchHistory();
    }
  }, [isHistoryExpanded, activeSidebarTab, job?.status, job?.hiredPro, job?.id]);

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredHistory = historyFilter === "all"
    ? historyEvents
    : historyEvents.filter(e => e.userRole === historyFilter);

  // Submit review handler (and optionally confirm completion)
  const handleSubmitReview = async () => {
    if (!job || reviewRating < 1 || reviewRating > 5) {
      console.log('[handleSubmitReview] Early return:', { job: !!job, reviewRating });
      return;
    }

    // Get pro ID from various possible locations (including project tracking fallback)
    const hiredProUser = job.hiredPro?.userId as { id?: string; _id?: string } | string | undefined;
    const proId = (typeof hiredProUser === 'object' ? (hiredProUser?.id || hiredProUser?._id) : hiredProUser) ||
                  job.hiredPro?.id ||
                  projectProId || // Fallback to project tracking proId
                  '';

    console.log('[handleSubmitReview] Starting review submission:', { 
      jobId: job.id, 
      proId, 
      rating: reviewRating,
      hiredPro: job.hiredPro,
      projectProId, // Fallback source
    });

    // Validate proId
    if (!proId) {
      console.error('[handleSubmitReview] No proId found!', job.hiredPro);
      setError(t('jobDetail.professionalIdNotFound'));
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsSubmittingReview(true);
    try {
      // If in completion flow, confirm completion first
      if (isCompletionFlow) {
        await api.post(`/jobs/projects/${job.id}/confirm-completion`);
        setIsClientConfirmed(true);
      }

      const reviewData = {
        jobId: job.id,
        proId: proId,
        rating: reviewRating,
        text: reviewText.trim() || undefined,
      };
      console.log('[handleSubmitReview] Sending review data:', reviewData);

      // Then submit review
      await api.post("/reviews", reviewData);
      
      setShowReviewModal(false);
      setIsCompletionFlow(false);
      setHasSubmittedReview(true);
      setSuccess(
        isCompletionFlow
          ? (t('jobDetail.projectCompletedAndReviewSubmitted'))
          : (t('jobDetail.reviewSubmittedSuccessfully'))
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const message = apiErr?.response?.data?.message;
      if (message === "Review already exists for this project") {
        // If review already exists but we were in completion flow, still try to confirm
        if (isCompletionFlow) {
          try {
            await api.post(`/jobs/projects/${job.id}/confirm-completion`);
            setIsClientConfirmed(true);
            setSuccess(t('jobDetail.projectCompleted'));
            setTimeout(() => setSuccess(""), 3000);
          } catch {
            setError(t('jobDetail.failedToCloseProject'));
            setTimeout(() => setError(""), 3000);
          }
        }
        setHasSubmittedReview(true);
        setShowReviewModal(false);
        setIsCompletionFlow(false);
      } else {
      setError(t('jobDetail.failedToSubmitReview'));
      setTimeout(() => setError(""), 3000);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${params.id}`);
        const data = response.data;
        setJob(data);
        trackEvent(AnalyticsEvent.JOB_VIEW, {
          jobId: data.id,
          jobTitle: data.title,
          jobCategory: data.category,
        });
      } catch (err) {
        console.error("Failed to fetch job:", err);
        router.push("/browse");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
    }
  }, [params.id, router]);

  useEffect(() => {
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
        const response = await api.get(`/jobs/${params.id}/my-proposal`);
        setMyProposal(response.data);
      } catch (err) {
        // 404 is expected if no proposal exists
        console.error("Failed to fetch my proposal:", err);
      } finally {
        setIsCheckingProposal(false);
      }
    };

    if (user?.role === "pro" || user?.role === "admin") {
      fetchMyProposal();
    } else {
      setIsCheckingProposal(false);
    }
  }, [user, params.id]);

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
    const fetchProjectTracking = async () => {
      if (!job?.id) return;
      // Only fetch for in_progress or completed jobs
      if (job.status !== "in_progress" && job.status !== "completed") return;
      if (!isOwner && !isHiredPro) return;

      try {
        const response = await api.get(`/jobs/projects/${job.id}`);
        if (response.data?.project) {
          const project = response.data.project;
          setProjectStage(project.currentStage || "hired");
          // For legacy jobs: if completed with completedAt but no clientConfirmedAt, treat as confirmed
          const isLegacyCompleted = project.currentStage === "completed" && 
            !!project.completedAt && !project.clientConfirmedAt;
          setIsClientConfirmed(!!project.clientConfirmedAt || isLegacyCompleted);
          
          // Store pro ID from project tracking as fallback
          if (project.proId) {
            const proIdValue = typeof project.proId === 'object' 
              ? (project.proId._id || project.proId.id) 
              : project.proId;
            setProjectProId(proIdValue);
            console.log('[fetchProjectTracking] Stored proId:', proIdValue);
          }
        }
      } catch (err) {
        console.error("Failed to fetch project tracking:", err);
      }
    };

    fetchProjectTracking();
  }, [job?.id, job?.status, isOwner, isHiredPro]);

  // Fetch unread counts for sidebar badges
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!job?.id) return;
      if (job.status !== "in_progress" && job.status !== "completed") return;
      if (!isOwner && !isHiredPro) return;

      try {
        const response = await api.get(`/jobs/projects/${job.id}/unread-counts`);
        setUnreadChatCount(response.data.chat || 0);
        setUnreadPollsCount(response.data.polls || 0);
        setUnreadResourcesCount(response.data.materials || 0);
      } catch (err) {
        // Silently fail
      }
    };

    fetchUnreadCounts();
  }, [job?.id, job?.status, isOwner, isHiredPro]);

  // Clear unread counts when switching tabs
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
  }, [activeSidebarTab, job?.id, unreadChatCount, unreadPollsCount, unreadResourcesCount]);

  // Handle stage change (for pro)
  const handleStageChange = async (newStage: ProjectStage) => {
    if (!job?.id || !isHiredPro) return;

    const previousStage = projectStage;
    setProjectStage(newStage);
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: newStage });
      toast.success(
        t('common.success'),
        t('jobDetail.stageUpdated')
      );
    } catch (err) {
      setProjectStage(previousStage);
      toast.error(
        t('common.error'),
        t('jobDetail.failedToUpdateStage')
      );
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

  // Handle client request changes
  const handleClientRequestChanges = async () => {
    if (!job?.id || !isOwner) return;

    const previousStage = projectStage;
    setProjectStage("review");
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job.id}/stage`, { stage: "review" });
      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        t('jobDetail.requestSent')
      );
    } catch (err) {
      setProjectStage(previousStage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t('jobDetail.failedToSendRequest')
      );
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

      setSuccess(
        t('jobDetail.proposalSubmittedSuccessfully')
      );
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
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || "Failed to submit proposal");
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
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        apiErr.response?.data?.message ||
        apiErr.message ||
        (t('jobDetail.failedToDelete'));
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline edit handlers
  const handleSaveDescription = async () => {
    if (!job?.id) return;
    setIsSavingDescription(true);
    try {
      await api.put(`/jobs/${job.id}`, { description: editDescription });
      setJob((prev) => prev ? { ...prev, description: editDescription } : prev);
      setShowDescriptionEdit(false);
      toast.success(t('jobDetail.saved'));
    } catch (err) {
      console.error("Failed to save description:", err);
      toast.error(t('jobDetail.failedToSave'));
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!job?.id || !editTitle.trim()) return;
    setIsSavingTitle(true);
    try {
      await api.put(`/jobs/${job.id}`, { title: editTitle });
      setJob((prev) => prev ? { ...prev, title: editTitle } : prev);
      setShowTitleEdit(false);
      toast.success(locale === "ka" ? "შენახულია" : "Saved");
    } catch (err) {
      console.error("Failed to save title:", err);
      toast.error(locale === "ka" ? "შენახვა ვერ მოხერხდა" : "Failed to save");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleSavePropertyDetails = async () => {
    if (!job?.id) return;
    setIsSavingProperty(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (editPropertyData.propertyType) updateData.propertyType = editPropertyData.propertyType;
      if (editPropertyData.propertyTypeOther) updateData.propertyTypeOther = editPropertyData.propertyTypeOther;
      if (editPropertyData.currentCondition) updateData.currentCondition = editPropertyData.currentCondition;
      if (editPropertyData.areaSize) updateData.areaSize = Number(editPropertyData.areaSize);
      if (editPropertyData.landArea) updateData.landArea = Number(editPropertyData.landArea);
      if (editPropertyData.roomCount) updateData.roomCount = Number(editPropertyData.roomCount);
      if (editPropertyData.floorCount) updateData.floorCount = Number(editPropertyData.floorCount);
      if (editPropertyData.pointsCount) updateData.pointsCount = Number(editPropertyData.pointsCount);
      if (editPropertyData.cadastralId) updateData.cadastralId = editPropertyData.cadastralId;
      if (editPropertyData.deadline) updateData.deadline = editPropertyData.deadline;
      
      await api.put(`/jobs/${job.id}`, updateData);
      setJob((prev) => prev ? { 
        ...prev, 
        ...updateData,
      } as PageJob : prev);
      setShowPropertyEdit(false);
      toast.success(locale === "ka" ? "შენახულია" : "Saved");
    } catch (err) {
      console.error("Failed to save property details:", err);
      toast.error(locale === "ka" ? "შენახვა ვერ მოხერხდა" : "Failed to save");
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleSaveWorkTypes = async () => {
    if (!job?.id) return;
    setIsSavingWorkTypes(true);
    try {
      await api.put(`/jobs/${job.id}`, { workTypes: editWorkTypes });
      setJob((prev) => prev ? { ...prev, workTypes: editWorkTypes } : prev);
      setShowWorkTypesEdit(false);
      toast.success(locale === "ka" ? "შენახულია" : "Saved");
    } catch (err) {
      console.error("Failed to save work types:", err);
      toast.error(locale === "ka" ? "შენახვა ვერ მოხერხდა" : "Failed to save");
    } finally {
      setIsSavingWorkTypes(false);
    }
  };

  const handleSaveRequirements = async () => {
    if (!job?.id) return;
    setIsSavingRequirements(true);
    try {
      await api.put(`/jobs/${job.id}`, editRequirements);
      setJob((prev) => prev ? { ...prev, ...editRequirements } : prev);
      setShowRequirementsEdit(false);
      toast.success(locale === "ka" ? "შენახულია" : "Saved");
    } catch (err) {
      console.error("Failed to save requirements:", err);
      toast.error(locale === "ka" ? "შენახვა ვერ მოხერხდა" : "Failed to save");
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
      deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
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
      return t('common.negotiable');
    }
    return formatBudgetUtil(job, locale as "en" | "ka" | "ru");
  };

  const getTimeAgo = (dateString: string) => formatTimeAgoCompact(dateString, locale as "en" | "ka" | "ru");

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

  // Loading state with elegant skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0D0D0C]">
        <Header />
        <HeaderSpacer />
        <div className="animate-pulse">
          <div className="h-[60vh] bg-neutral-200 dark:bg-neutral-800" />
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-4" />
            <div className="h-12 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"
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
  // Job is considered "hired" if status is in_progress/completed OR if hiredPro exists
  const isHired = job.status === "in_progress" || job.status === "completed" || !!job.hiredPro;
  const isCompleted = job.status === "completed";

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0D0D0C]">

      <Header />
      <HeaderSpacer />

      {/* Compact Header with Side-by-Side Layout */}
      <section className="relative bg-gradient-to-br from-[#FDF8F5] via-[#FAF5F2] to-[#F8F2EE] dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#D4846C]/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#C4735B]/5 blur-2xl" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
          {/* Back button + Edit/Delete buttons row (only when job is not hired) */}
          <div className="flex items-center justify-between mb-3">
            <BackButton href="/browse/jobs" />
            {isOwner && !isHired && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Side-by-side layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* Left: Image Gallery - smaller */}
            <div className="space-y-2 relative">
              {/* Edit Media Button for Owner - Links to full edit page */}
              {isOwner && !isHired && (
                <Link
                  href={`/post-job?edit=${job.id}`}
                  className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/95 dark:bg-neutral-800/95 shadow-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-[#C4735B] hover:border-[#C4735B] transition-all"
                  title={t('jobDetail.editMedia')}
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
              )}
              {allMedia.length > 0 ? (
                <>
                  {/* Main Image - smaller aspect ratio */}
                  <button
                    onClick={() => setSelectedMediaIndex(activeImageIndex)}
                    className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 group"
                  >
                    <img
                      src={storage.getFileUrl(allMedia[activeImageIndex]?.url)}
                      alt={job.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Expand icon */}
                    <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
        </div>
                    {/* Image count badge */}
        {allMedia.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                        {activeImageIndex + 1} / {allMedia.length}
          </div>
        )}
                  </button>

                  {/* Thumbnail strip */}
        {allMedia.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {allMedia.map((media, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                          className={`relative flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all ${
                  idx === activeImageIndex
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                    : "opacity-60 hover:opacity-100"
                }`}
                          style={idx === activeImageIndex ? { borderColor: ACCENT } as React.CSSProperties : undefined}
              >
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
              </button>
            ))}
                    </div>
                  )}
                </>
              ) : (
                /* No images placeholder - Terracotta with Homico logo */
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-[#D4846C] via-[#C4735B] to-[#A85D4A]">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
                  
                  {/* Decorative geometric pattern */}
                  <div className="absolute inset-0 opacity-[0.07]">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <pattern id="homico-grid-detail" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                          <path d="M25 0L25 25M0 25L25 25" stroke="white" strokeWidth="0.5" fill="none" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill="url(#homico-grid-detail)" />
                    </svg>
                  </div>
                  
                  {/* Centered Homico logomark */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      {/* Soft white glow */}
                      <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full scale-[2.5]" />
                      {/* Homico "H" logomark - white on terracotta */}
                      <svg className="w-16 h-16 md:w-20 md:h-20 relative drop-shadow-md" viewBox="0 0 56 60" fill="none">
                        <rect x="0" y="0" width="10" height="50" rx="2" fill="white" fillOpacity="0.9" />
                        <rect x="36" y="0" width="10" height="50" rx="2" fill="white" fillOpacity="0.9" />
                        <path d="M10 25 Q23 5 36 25" stroke="white" strokeOpacity="0.9" strokeWidth="10" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-white/70 tracking-wider uppercase">
                      {t('common.noPhoto')}
                    </span>
                  </div>
          </div>
        )}
            </div>

            {/* Right: Job Info */}
            <div className="flex flex-col justify-center">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
              {isOpen && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold">
                    {t('common.active')}
                  </span>
                </span>
              )}
              {isHired && (
                <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
                  >
                    <Check className="w-3 h-3" />
                    <span className="text-xs font-semibold">
                    {t('common.hired')}
                  </span>
                </span>
              )}
              <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${ACCENT}10`, color: ACCENT }}
                >
                  {getCategoryLabel(job.category)}
                {job.subcategory && (
                  <>
                      <span className="opacity-50">/</span>
                      {getCategoryLabel(job.subcategory)}
                  </>
                )}
              </span>
            </div>

            {/* Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
              {job.title}
            </h1>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[180px]">{job.location}</span>
                </span>
              )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                {getTimeAgo(job.createdAt)}
              </span>
            </div>

              {/* Budget highlight */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${ACCENT}15` }}
                >
                  <span className="text-lg" style={{ color: ACCENT }}>₾</span>
          </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('common.budget')}
                  </p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">
                    {budgetDisplay}
                  </p>
        </div>
              </div>

              {/* Stats row - hide proposals link when hired */}
              <div className="flex items-center gap-6 text-sm mb-3">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Eye className="w-4 h-4" />
                  <span>{job.viewCount || 0} {t('jobDetail.views')}</span>
                </div>
                {!isHired && (
              isOwner ? (
                  <Link
                      href={`/my-jobs/${job.id}/proposals`}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors"
                  >
                      <Users className="w-4 h-4" />
                      <span className="underline underline-offset-2">{job.proposalCount || 0} {t('jobDetail.proposals')}</span>
                  </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                      <Users className="w-4 h-4" />
                      <span>{job.proposalCount || 0} {locale === "ka" ? "შეთავაზება" : "proposals"}</span>
                </div>
                  )
                )}
              </div>

              {/* Compact Status Bar in Hero (for hired projects) - hidden in MVP mode */}
              {isHired && (isOwner || isHiredPro) && !isMVPMode() && (
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
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          {/* Submit Proposal button for pro - only when not hired and not owner */}
          {isPro && !isOwner && isOpen && !isHired && !myProposal && !isCheckingProposal && (
            <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowProposalForm(true)}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {t('jobDetail.submitProposal')}
                </Button>
            </div>
          )}
          {isPro && !isOwner && isOpen && !isHired && isCheckingProposal && (
            <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-neutral-400">
                  <LoadingSpinner size="sm" color="#737373" />
                </div>
            </div>
          )}

          {/* Role Banner - Shows clearly if you're hired on this job */}
          {isHiredPro && (
            <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200 dark:border-purple-800/50">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  {t('jobDetail.youveBeenHiredForThis')}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  {locale === "ka" 
                    ? `${job.clientId?.name || 'კლიენტმა'} დაგიქირავათ` 
                    : `${job.clientId?.name || 'The client'} hired you`}
                </p>
              </div>
              {job.hiredPro?.userId?.name && (
                <Avatar
                  src={job.clientId?.avatar}
                  name={job.clientId?.name || "Client"}
                  size="md"
                  className="ring-2 ring-purple-200 dark:ring-purple-700"
                />
              )}
            </div>
          )}

          {/* Mobile Sidebar Tabs for hired projects - hidden in MVP mode */}
          {isHired && (isOwner || isHiredPro) && !isMVPMode() && (
            <div className="lg:hidden mb-6">
              <ProjectSidebarMobile
                activeTab={activeSidebarTab}
                onTabChange={setActiveSidebarTab}
                locale={locale}
                unreadChatCount={unreadChatCount}
                unreadPollsCount={unreadPollsCount}
                unreadResourcesCount={unreadResourcesCount}
                isProjectStarted={projectStage !== "hired"}
              />
            </div>
          )}

          {/* MVP Mode: Simplified Hired Card */}
          {isHired && (isOwner || isHiredPro) && isMVPMode() && (
            <div className="mb-6 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {t('common.hired')}
                    </h3>
                  <p className="text-sm text-neutral-500">
                    {isOwner 
                      ? (t('jobDetail.youHiredTheProfessional'))
                      : (t('jobDetail.theClientHiredYou'))
                    }
                    </p>
                  </div>
                </div>
              
              {/* Partner info with phone */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={isOwner ? job.hiredPro?.userId?.avatar : job.clientId?.avatar} 
                    name={isOwner ? (job.hiredPro?.userId?.name || "Professional") : (job.clientId?.name || "Client")} 
                    size="md" 
                  />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {isOwner ? (job.hiredPro?.userId?.name || "Professional") : (job.clientId?.name || "Client")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isOwner ? (t('common.professional')) : (t('common.client'))}
                    </p>
                  </div>
                </div>
                
                {/* Phone CTA */}
                {isOwner && job.hiredPro?.userId?.phone && (
                  <a
                    href={`tel:${job.hiredPro.userId.phone}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
                  >
                    <Phone className="w-4 h-4" />
                    {job.hiredPro.userId.phone}
                  </a>
                )}
                {isHiredPro && job.clientId?.phone && (
                  <a
                    href={`tel:${job.clientId.phone}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
                  >
                    <Phone className="w-4 h-4" />
                    {job.clientId.phone}
                  </a>
                )}
              </div>
                  </div>
                )}

          {/* Status bar moved to hero section - keeping only sidebar tabs below */}

          {/* Two Column Layout (or Three with sidebar for hired projects - except in MVP mode) */}
          <div className={`grid gap-8 pb-24 ${isHired && (isOwner || isHiredPro) && !isMVPMode() ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {/* Desktop Sidebar for hired projects - hidden in MVP mode */}
            {isHired && (isOwner || isHiredPro) && !isMVPMode() && (
              <div className="hidden lg:block">
                <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/50 dark:border-neutral-800">
                  <ProjectSidebar
                    activeTab={activeSidebarTab}
                    onTabChange={setActiveSidebarTab}
                    locale={locale}
                    unreadChatCount={unreadChatCount}
                    unreadPollsCount={unreadPollsCount}
                    unreadResourcesCount={unreadResourcesCount}
                    isProjectStarted={projectStage !== "hired"}
                  />
              </div>
              </div>
            )}
            {/* Main Content - min-height prevents layout jumping when switching tabs */}
            <div className="lg:col-span-2 space-y-8 min-h-[500px]">
              {/* CHAT TAB CONTENT - hidden in MVP mode */}
              {isHired && (isOwner || isHiredPro) && activeSidebarTab === "chat" && !isMVPMode() && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 overflow-hidden min-h-[450px]">
                  <ProjectChat
                    jobId={job.id}
                    locale={locale}
                    isClient={!!isOwner}
                  />
            </div>
          )}

              {/* POLLS TAB CONTENT - hidden in MVP mode */}
              {isHired && (isOwner || isHiredPro) && activeSidebarTab === "polls" && !isMVPMode() && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 p-4 md:p-6 min-h-[300px]">
                  <PollsTab
                    jobId={job.id}
                    isPro={isPro || !!isHiredPro}
                    isClient={isOwner || false}
                    userId={user?.id}
                    locale={locale}
                    embedded={true}
                  />
                </div>
              )}

              {/* RESOURCES TAB CONTENT - hidden in MVP mode */}
              {isHired && (isOwner || isHiredPro) && activeSidebarTab === "resources" && !isMVPMode() && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 p-4 md:p-6 min-h-[300px]">
                  <ProjectWorkspace
                    jobId={job.id}
                    locale={locale}
                    isClient={isOwner || false}
                    embedded={true}
                  />
                </div>
              )}

              {/* HISTORY TAB CONTENT - hidden in MVP mode */}
              {isHired && (isOwner || isHiredPro) && activeSidebarTab === "history" && !isMVPMode() && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 overflow-hidden min-h-[300px]">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
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
                        style={historyFilter === f.key ? { backgroundColor: ACCENT } : {}}
                      >
                        {locale === "ka" ? f.labelKa : f.label}
                      </button>
                    ))}
                  </div>
                  {/* History Timeline */}
                  <div className="p-4 max-h-[600px] overflow-y-auto">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="lg" color={ACCENT} />
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                          {t('jobDetail.noActivityYet')}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

                        <div className="space-y-4">
                          {filteredHistory.slice(0, 30).map((event, idx) => {
                            const config = getEventConfig(event.eventType);
                            const description = getEventDescription(event);
                            return (
                              <div key={`history-${idx}`} className="relative flex items-start gap-3 pl-1">
                                <div
                                  className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                                  style={{ backgroundColor: config.bgColor, color: config.color }}
                                >
                                  {config.icon}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                      {event.userName}
                                    </span>
                                    <Badge variant={event.userRole === "client" ? "info" : "success"} size="xs">
                                      {event.userRole === "client"
                                        ? (locale === "ka" ? "კლიენტი" : "Client")
                                        : (t('jobDetail.pro'))}
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

                        {/* Show more indicator */}
                        {filteredHistory.length > 30 && (
                          <div className="mt-4 text-center">
                            <span className="text-xs text-neutral-400">
                              {locale === "ka" 
                                ? `+ ${filteredHistory.length - 30} სხვა მოვლენა` 
                                : `+ ${filteredHistory.length - 30} more events`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DETAILS TAB CONTENT (or non-hired job content) */}
              {(!isHired || !(isOwner || isHiredPro) || activeSidebarTab === "details") && (
                <>
              {/* Description */}
              <section
                className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-500 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                  {t('common.description')}
                </h2>
                      {isOwner && !isHired && (
                        <button
                          onClick={() => {
                            setEditDescription(job.description || "");
                            setShowDescriptionEdit(true);
                          }}
                          className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                <p className="font-body text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </section>

              {/* Property Specs */}
              {(job.propertyType ||
                job.currentCondition ||
                job.areaSize ||
                job.roomCount ||
                job.floorCount ||
                job.deadline ||
                job.cadastralId ||
                job.landArea ||
                job.pointsCount) && (
                <section
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-600 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                      {t('jobDetail.propertyDetails')}
                    </h2>
                    {isOwner && !isHired && (
                      <button
                        onClick={openPropertyEditModal}
                        className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        title={locale === "ka" ? "რედაქტირება" : "Edit"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {job.propertyType && (
                      <SpecCard
                        icon={<Home className="w-5 h-5" />}
                        label={t('common.type')}
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
                    {job.areaSize && (
                      <SpecCard
                        icon={<Ruler className="w-5 h-5" />}
                        label={t('jobDetail.area')}
                        value={`${job.areaSize} მ²`}
                      />
                    )}
                    {job.landArea && (
                      <SpecCard
                        icon={<Mountain className="w-5 h-5" />}
                        label={t('jobDetail.landArea')}
                        value={`${job.landArea} მ²`}
                      />
                    )}
                    {job.roomCount && (
                      <SpecCard
                        icon={<DoorOpen className="w-5 h-5" />}
                        label={t('jobDetail.rooms')}
                        value={job.roomCount.toString()}
                      />
                    )}
                    {job.pointsCount && (
                      <SpecCard
                        icon={<Zap className="w-5 h-5" />}
                        label={t('jobDetail.points')}
                        value={job.pointsCount.toString()}
                      />
                    )}
                    {job.floorCount && (
                      <SpecCard
                        icon={<Layers className="w-5 h-5" />}
                        label={t('jobDetail.floors')}
                        value={job.floorCount.toString()}
                      />
                    )}
                    {job.cadastralId && (
                      <SpecCard
                        icon={<Map className="w-5 h-5" />}
                        label={t('jobDetail.cadastral')}
                        value={job.cadastralId}
                      />
                    )}
                    {job.deadline && (
                      <SpecCard
                        icon={<Calendar className="w-5 h-5" />}
                        label={t('jobDetail.deadline')}
                        value={(() => {
                          const date = new Date(job.deadline);
                          if (locale === "ka") {
                            const months = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
                            return `${date.getDate()} ${months[date.getMonth()]}`;
                          }
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        })()}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* Work Types */}
              {job.workTypes && job.workTypes.length > 0 && (
                <section
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-700 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                      {t('jobDetail.workTypes')}
                    </h2>
                    {isOwner && !isHired && (
                      <button
                        onClick={openWorkTypesEditModal}
                        className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        title={locale === "ka" ? "რედაქტირება" : "Edit"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.workTypes.map((type) => (
                      <span
                        key={type}
                        className="px-4 py-2 rounded-xl font-body text-sm font-medium transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${ACCENT}10`,
                          color: ACCENT,
                        }}
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
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-[800ms] ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                      {t('jobDetail.requirements')}
                    </h2>
                    {isOwner && !isHired && (
                      <button
                        onClick={openRequirementsEditModal}
                        className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        title={locale === "ka" ? "რედაქტირება" : "Edit"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {job.furnitureIncluded && (
                      <RequirementBadge
                        icon={<Armchair className="w-4 h-4" />}
                        text={
                          t('jobDetail.furnitureSelection')
                        }
                      />
                    )}
                    {job.visualizationNeeded && (
                      <RequirementBadge
                        icon={<Sparkles className="w-4 h-4" />}
                        text={
                          t('jobDetail.3dVisualization')
                        }
                      />
                    )}
                    {job.materialsProvided && (
                      <RequirementBadge
                        icon={<Package className="w-4 h-4" />}
                        text={
                          t('jobDetail.materialsProvided')
                        }
                      />
                    )}
                    {job.occupiedDuringWork && (
                      <RequirementBadge
                        icon={<Users className="w-4 h-4" />}
                        text={
                          t('jobDetail.occupiedDuringWork')
                        }
                      />
                    )}
                  </div>
                </section>
              )}

              {/* References */}
              {job.references && job.references.length > 0 && (
                <section
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-[900ms] ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    {t('jobDetail.references')}
                  </h2>
                  <div className="space-y-2">
                    {job.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          {ref.type === "pinterest" ? (
                            <svg
                              className="w-5 h-5"
                              style={{ color: "#E60023" }}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                            </svg>
                          ) : ref.type === "instagram" ? (
                            <svg
                              className="w-5 h-5"
                              style={{ color: "#E4405F" }}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                          ) : (
                            <ExternalLink className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <span className="font-body text-sm text-neutral-600 dark:text-neutral-300 truncate flex-1">
                          {ref.title ||
                            (() => {
                              try {
                                return new URL(ref.url).hostname;
                              } catch {
                                return ref.url;
                              }
                            })()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* My Proposal - only show when not hired (pending/rejected/withdrawn) */}
              {myProposal && isPro && !isHiredPro && (
                <MyProposalCard
                  proposal={{
                    id: myProposal.id,
                    coverLetter: myProposal.coverLetter,
                    proposedPrice: myProposal.proposedPrice,
                    estimatedDuration: myProposal.estimatedDuration,
                    estimatedDurationUnit: myProposal.estimatedDurationUnit as 'days' | 'weeks' | 'months' | undefined,
                    status: myProposal.status as 'pending' | 'accepted' | 'rejected' | 'withdrawn',
                    createdAt: myProposal.createdAt,
                  }}
                  locale={locale as 'en' | 'ka' | 'ru'}
                />
              )}
                </>
              )}

              {/* LEGACY: Project Status Tracker - HIDDEN when sidebar is active */}
              {(isHiredPro || isOwner) && isHired && activeSidebarTab === "details" && false && (
                <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 overflow-hidden">
                  {/* Header with progress */}
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${ACCENT}15` }}
                        >
                          <BarChart3 className="w-5 h-5" style={{ color: ACCENT }} />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-neutral-900 dark:text-white">
                      {t('jobDetail.projectStatus')}
                    </h3>
                          <p className="text-xs text-neutral-500">
                          {locale === "ka" ? STAGES[getStageIndex(projectStage)]?.labelKa : STAGES[getStageIndex(projectStage)]?.label}
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
                      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
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
                    {isOwner && projectStage === "completed" && !isClientConfirmed && (
                      <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              {t('jobDetail.workCompleted')}
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {t('jobDetail.pleaseReviewAndConfirmCompletion')}
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
                            leftIcon={!isUpdatingStage ? <BadgeCheck className="w-4 h-4" /> : undefined}
                          >
                            {t('common.confirm')}
                          </Button>
                          <Button
                            onClick={handleClientRequestChanges}
                            disabled={isUpdatingStage}
                            variant="outline"
                            size="sm"
                            leftIcon={<RotateCcw className="w-4 h-4" />}
                          >
                            {t('jobDetail.changes')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Leave Review button when project is confirmed but no review yet */}
                    {isOwner && projectStage === "completed" && isClientConfirmed && !hasSubmittedReview && (
                      <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                              {t('jobDetail.leaveAReview')}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          {t('jobDetail.yourFeedbackHelpsOtherClients')}
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
                          {t('jobDetail.writeAReview')}
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
                        const canAdvance = isHiredPro && isNext && !isUpdatingStage;
                        const isLast = index === STAGES.length - 1;

                        return (
                          <div key={stage.key} className="flex items-stretch gap-3">
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center">
                              <div
                            className={`
                                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                  transition-all duration-300
                              ${isStageCompleted
                                    ? 'bg-emerald-500 text-white'
                                : isCurrent
                                      ? 'text-white shadow-lg'
                                  : canAdvance
                                        ? 'bg-white dark:bg-neutral-800 border-2 border-dashed text-neutral-400'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                              }
                            `}
                            style={{
                              backgroundColor: isCurrent ? ACCENT : undefined,
                                  borderColor: canAdvance ? ACCENT : undefined,
                            }}
                          >
                            {isUpdatingStage && isCurrent ? (
                                  <LoadingSpinner size="xs" color="white" />
                            ) : isStageCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <span className="text-xs font-bold">{index + 1}</span>
                                )}
                              </div>
                              {/* Connecting line */}
                              {!isLast && (
                                <div 
                                  className={`w-0.5 flex-1 min-h-[24px] transition-colors duration-300 ${
                                    isStageCompleted 
                                      ? 'bg-emerald-500' 
                                      : 'bg-neutral-200 dark:bg-neutral-700'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Stage content */}
                            <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                              <button
                                onClick={() => canAdvance && handleStageChange(stage.key)}
                                disabled={!canAdvance}
                                className={`
                                  w-full text-left p-3 rounded-xl transition-all duration-200
                                  ${isCurrent
                                    ? 'bg-[#C4735B]/10 border border-[#C4735B]/20'
                                    : canAdvance
                                      ? 'bg-white dark:bg-neutral-800 border border-dashed border-[#C4735B]/40 hover:border-solid hover:border-[#C4735B] hover:shadow-md cursor-pointer'
                                      : isStageCompleted
                                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                                        : ''
                                  }
                                `}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`
                                      text-sm font-medium
                                      ${isStageCompleted 
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isCurrent
                                          ? 'text-[#C4735B] font-semibold'
                                          : 'text-neutral-500 dark:text-neutral-400'
                                      }
                                    `}>
                                      {locale === "ka" ? stage.labelKa : stage.label}
                                    </span>
                                    {isCurrent && (
                                      <span 
                                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                                        style={{ backgroundColor: ACCENT }}
                                      >
                                        {t('jobDetail.current')}
                                      </span>
                                    )}
                                  </div>
                            {canAdvance && (
                                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: ACCENT }}>
                                      <span>{t('common.next')}</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </div>
                            )}
                                </div>
                          </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* LEGACY: Project Chat moved to sidebar tabs - HIDDEN */}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Client Card */}
                <ClientCard
                  client={{
                    _id: job.clientId?.id || '',
                    name: job.clientId?.name || 'Client',
                    avatar: job.clientId?.avatar,
                    city: job.clientId?.city,
                    accountType: job.clientId?.accountType,
                    companyName: job.clientId?.companyName,
                  }}
                  label={t('common.client')}
                  organizationLabel={t('jobDetail.organization')}
                  isVisible={isVisible}
                />

                {/* Hired Professional Card */}
                {isHired && job.hiredPro && (
                  <div
                    className={`rounded-2xl p-6 border transition-all duration-700 delay-600 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{
                      backgroundColor: `${ACCENT}08`,
                      borderColor: `${ACCENT}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${ACCENT}20` }}
                      >
                        <Check className="w-4 h-4" style={{ color: ACCENT }} />
                      </div>
                      <h3
                        className="font-display text-sm font-semibold uppercase tracking-wider"
                        style={{ color: ACCENT }}
                      >
                        {locale === "ka" ? "დაქირავებული" : "Hired"}
                      </h3>
                    </div>
                    <Link
                      href={`/professionals/${job.hiredPro.id}`}
                      className="flex items-center gap-4 group"
                    >
                      <Avatar
                        src={job.hiredPro.avatar || job.hiredPro.userId?.avatar}
                        name={job.hiredPro.userId?.name || "Professional"}
                        size="lg"
                        className="w-14 h-14 ring-2 transition-all group-hover:ring-4"
                        style={{ "--tw-ring-color": `${ACCENT}40` } as React.CSSProperties}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-semibold text-neutral-900 dark:text-white truncate group-hover:underline">
                          {job.hiredPro.userId?.name || "Professional"}
                        </p>
                        {job.hiredPro.title && (
                          <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 truncate">
                            {job.hiredPro.title}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform"
                        style={{ color: ACCENT }}
                      />
                    </Link>
                  </div>
                )}

                {/* LEGACY: Polls Section moved to sidebar tabs - HIDDEN */}

                {/* LEGACY: Resources Section moved to sidebar tabs - HIDDEN */}

                {/* LEGACY: History Section moved to sidebar tabs - HIDDEN */}

                {/* Share Section - Only show when job is not hired */}
                {!isHired && (
                <div className="group rounded-2xl bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-900 dark:to-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}25 100%)`,
                          border: `1px solid ${ACCENT}20`
                        }}
                      >
                        <Share2 className="w-5 h-5" style={{ color: ACCENT }} />
                      </div>
                      <div className="text-left">
                        <span className="font-body font-semibold text-neutral-900 dark:text-white block">
                          {t('common.share')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            #{job.jobNumber || job.id.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        onClick={() => {
                            const url = `${window.location.origin}/jobs/${job.id}`;
                          const text = job.title;
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
                            'facebook-share',
                            'width=580,height=400'
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
                                text: job.description.slice(0, 100) + '...',
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
                        title={t('common.share')}
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
                        title={t('common.copyLink')}
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
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteError("");
        }}
        onConfirm={handleDeleteJob}
        title={t('jobDetail.deleteThisJob')}
        description={t('jobDetail.thisActionCannotBeUndone')}
        icon={<Trash2 className="w-6 h-6 text-red-500" />}
        variant="danger"
        cancelLabel={t('common.cancel')}
        confirmLabel={locale === "ka" ? "წაშლა" : "Delete"}
        isLoading={isDeleting}
        loadingLabel="..."
      >
        {deleteError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-body text-sm mb-4">
            {deleteError}
          </div>
        )}
      </ConfirmModal>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500 text-white shadow-lg font-body">
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
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white shadow-lg font-body">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              {t('common.linkCopied')}
            </span>
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
        pro={job?.hiredPro || { userId: { name: 'Professional' } }}
        isCompletionFlow={isCompletionFlow}
      />

      {/* Description Edit Modal */}
      <Modal
        isOpen={showDescriptionEdit}
        onClose={() => setShowDescriptionEdit(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('jobDetail.editDescription')}
          </h2>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50 focus:border-[#C4735B]"
            placeholder={t('jobDetail.describeTheJob')}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDescriptionEdit(false)}
              disabled={isSavingDescription}
            >
              {locale === "ka" ? "გაუქმება" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveDescription}
              loading={isSavingDescription}
            >
              {t('common.save')}
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
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('jobDetail.editTitle')}
          </h2>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50 focus:border-[#C4735B]"
            placeholder={t('jobDetail.jobTitle')}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowTitleEdit(false)}
              disabled={isSavingTitle}
            >
              {locale === "ka" ? "გაუქმება" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveTitle}
              loading={isSavingTitle}
              disabled={!editTitle.trim()}
            >
              {locale === "ka" ? "შენახვა" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Property Details Edit Modal */}
      <Modal
        isOpen={showPropertyEdit}
        onClose={() => setShowPropertyEdit(false)}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
            {t('jobDetail.editPropertyDetails')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t("job.propertyType")}
              </label>
              <Select
                value={editPropertyData.propertyType}
                onChange={(value) => setEditPropertyData(prev => ({ ...prev, propertyType: value }))}
                placeholder={t('common.select')}
                options={Object.entries(propertyTypeKeys).map(([key, translationKey]) => ({
                  value: key,
                  label: t(translationKey)
                }))}
              />
            </div>

            {/* Current Condition */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.currentCondition')}
              </label>
              <Select
                value={editPropertyData.currentCondition}
                onChange={(value) => setEditPropertyData(prev => ({ ...prev, currentCondition: value }))}
                placeholder={t('common.select')}
                options={Object.entries(conditionKeys).map(([key, translationKey]) => ({
                  value: key,
                  label: t(translationKey)
                }))}
              />
            </div>

            {/* Area Size */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.areaSizeM')}
              </label>
              <input
                type="number"
                value={editPropertyData.areaSize}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, areaSize: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="100"
              />
            </div>

            {/* Land Area */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.landAreaM')}
              </label>
              <input
                type="number"
                value={editPropertyData.landArea}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, landArea: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="500"
              />
            </div>

            {/* Room Count */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.roomCount')}
              </label>
              <input
                type="number"
                value={editPropertyData.roomCount}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, roomCount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="3"
              />
            </div>

            {/* Floor Count */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.floorCount')}
              </label>
              <input
                type="number"
                value={editPropertyData.floorCount}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, floorCount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="2"
              />
            </div>

            {/* Points Count */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.pointsCount')}
              </label>
              <input
                type="number"
                value={editPropertyData.pointsCount}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, pointsCount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="10"
              />
            </div>

            {/* Cadastral ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.cadastralId')}
              </label>
              <input
                type="text"
                value={editPropertyData.cadastralId}
                onChange={(e) => setEditPropertyData(prev => ({ ...prev, cadastralId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/50"
                placeholder="XX.XX.XX.XXX.XXX.XX.XXX"
              />
            </div>

            {/* Deadline */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('jobDetail.deadline')}
              </label>
              <DatePicker
                value={editPropertyData.deadline}
                onChange={(value) => setEditPropertyData(prev => ({ ...prev, deadline: value }))}
                min={new Date().toISOString().split('T')[0]}
                locale={locale as 'ka' | 'en' | 'ru'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowPropertyEdit(false)}
              disabled={isSavingProperty}
            >
              {locale === "ka" ? "გაუქმება" : "Cancel"}
            </Button>
            <Button
              onClick={handleSavePropertyDetails}
              loading={isSavingProperty}
            >
              {locale === "ka" ? "შენახვა" : "Save"}
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
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
            {locale === "ka" ? "სამუშაოს ტიპები" : "Work Types"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
            {allWorkTypes.map((type) => {
              const isSelected = editWorkTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEditWorkTypes(prev => 
                      isSelected 
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    isSelected
                      ? "border-[#C4735B] bg-[#C4735B]/10 text-[#C4735B]"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-[#C4735B]/50"
                  }`}
                >
                  {t(workTypeKeys[type] || type)}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowWorkTypesEdit(false)}
              disabled={isSavingWorkTypes}
            >
              {locale === "ka" ? "გაუქმება" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveWorkTypes}
              loading={isSavingWorkTypes}
            >
              {locale === "ka" ? "შენახვა" : "Save"}
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
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
            {locale === "ka" ? "მოთხოვნები" : "Requirements"}
          </h2>
          <div className="space-y-4">
            {/* Furniture Included */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <input
                type="checkbox"
                checked={editRequirements.furnitureIncluded}
                onChange={(e) => setEditRequirements(prev => ({ ...prev, furnitureIncluded: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
              />
              <div className="flex items-center gap-2">
                <Armchair className="w-5 h-5 text-neutral-500" />
                <span className="text-neutral-900 dark:text-white">
                  {t('jobDetail.furnitureSelection')}
                </span>
              </div>
            </label>

            {/* Visualization Needed */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <input
                type="checkbox"
                checked={editRequirements.visualizationNeeded}
                onChange={(e) => setEditRequirements(prev => ({ ...prev, visualizationNeeded: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
              />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neutral-500" />
                <span className="text-neutral-900 dark:text-white">
                  {t('jobDetail.3dVisualization')}
                </span>
              </div>
            </label>

            {/* Materials Provided */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <input
                type="checkbox"
                checked={editRequirements.materialsProvided}
                onChange={(e) => setEditRequirements(prev => ({ ...prev, materialsProvided: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
              />
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-500" />
                <span className="text-neutral-900 dark:text-white">
                  {t('jobDetail.materialsProvided')}
                </span>
              </div>
            </label>

            {/* Occupied During Work */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <input
                type="checkbox"
                checked={editRequirements.occupiedDuringWork}
                onChange={(e) => setEditRequirements(prev => ({ ...prev, occupiedDuringWork: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
              />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-500" />
                <span className="text-neutral-900 dark:text-white">
                  {t('jobDetail.occupiedDuringWork')}
                </span>
              </div>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowRequirementsEdit(false)}
              disabled={isSavingRequirements}
            >
              {locale === "ka" ? "გაუქმება" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveRequirements}
              loading={isSavingRequirements}
            >
              {locale === "ka" ? "შენახვა" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

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

