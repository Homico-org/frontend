"use client";

import Avatar from "@/components/common/Avatar";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MediaLightbox, { MediaItem as LightboxMediaItem } from "@/components/common/MediaLightbox";
import SpecCard from "@/components/jobs/SpecCard";
import RequirementBadge from "@/components/jobs/RequirementBadge";
import { ConfirmModal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import api from "@/lib/api";
import { storage } from "@/services/storage";
import {
  Armchair,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  DoorOpen,
  Edit3,
  ExternalLink,
  Facebook,
  Home,
  Layers,
  Map,
  MapPin,
  Maximize2,
  Mountain,
  Package,
  Ruler,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Design tokens
const ACCENT = "#C4735B";
const ACCENT_LIGHT = "#D4897A";
const ACCENT_DARK = "#A85D4A";

interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface Reference {
  type: "link" | "image" | "pinterest" | "instagram";
  url: string;
  title?: string;
  thumbnail?: string;
}

interface Proposal {
  _id: string;
  coverLetter: string;
  proposedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
}

interface Job {
  _id: string;
  jobNumber?: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  location: string;
  propertyType?: "apartment" | "office" | "building" | "house" | "other";
  areaSize?: number;
  sizeUnit?: "sqm" | "room" | "unit" | "floor" | "item";
  roomCount?: number;
  budgetType: "fixed" | "range" | "per_sqm" | "negotiable";
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  floorCount?: number;
  workTypes?: string[];
  materialsProvided?: boolean;
  materialsNote?: string;
  furnitureIncluded?: boolean;
  visualizationNeeded?: boolean;
  occupiedDuringWork?: boolean;
  references?: Reference[];
  deadline?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  cadastralId?: string;
  landArea?: number;
  pointsCount?: number;
  clientId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    phone?: string;
    accountType?: "individual" | "organization";
    companyName?: string;
  };
  hiredPro?: {
    _id: string;
    userId: { _id: string; name: string; avatar?: string };
    avatar?: string;
    title?: string;
  };
}

const propertyTypeLabels: Record<string, { en: string; ka: string }> = {
  apartment: { en: "Apartment", ka: "ბინა" },
  house: { en: "House", ka: "სახლი" },
  office: { en: "Office", ka: "ოფისი" },
  building: { en: "Building", ka: "შენობა" },
  other: { en: "Other", ka: "სხვა" },
};

const workTypeLabels: Record<string, { en: string; ka: string }> = {
  Demolition: { en: "Demolition", ka: "დემონტაჟი" },
  "Wall Construction": { en: "Wall Construction", ka: "კედლების აშენება" },
  Electrical: { en: "Electrical", ka: "ელექტროობა" },
  Plumbing: { en: "Plumbing", ka: "სანტექნიკა" },
  Flooring: { en: "Flooring", ka: "იატაკი" },
  Painting: { en: "Painting", ka: "შეღებვა" },
  Tiling: { en: "Tiling", ka: "კაფელი" },
  Ceiling: { en: "Ceiling", ka: "ჭერი" },
  "Windows & Doors": { en: "Windows & Doors", ka: "ფანჯრები და კარები" },
  HVAC: { en: "HVAC", ka: "კონდიცირება/გათბობა" },
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
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { trackEvent } = useAnalytics();

  const [job, setJob] = useState<Job | null>(null);
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

  const isOwner = user && job?.clientId && user.id === job.clientId._id;
  const isPro = user?.role === "pro" || user?.role === "admin";

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

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`
        );
        if (!response.ok) throw new Error("Job not found");
        const data = await response.json();
        setJob(data);
        trackEvent(AnalyticsEvent.JOB_VIEW, {
          jobId: data._id,
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
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/my-proposal`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setMyProposal(data);
        }
      } catch (err) {
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

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/proposals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...proposalData,
            proposedPrice: proposalData.proposedPrice
              ? parseFloat(proposalData.proposedPrice)
              : undefined,
            estimatedDuration: proposalData.estimatedDuration
              ? parseInt(proposalData.estimatedDuration)
              : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit proposal");
      }

      setSuccess(
        locale === "ka"
          ? "წინადადება წარმატებით გაიგზავნა"
          : "Proposal submitted successfully"
      );
      setShowProposalForm(false);
      setMyProposal(data);
      trackEvent(AnalyticsEvent.PROPOSAL_SUBMIT, {
        jobId: params.id as string,
        proposalAmount: proposalData.proposedPrice
          ? parseFloat(proposalData.proposedPrice)
          : undefined,
      });
      const jobResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`
      );
      const jobData = await jobResponse.json();
      setJob(jobData);
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal");
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
    } catch (err: any) {
      console.error("Failed to delete job:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        (locale === "ka" ? "წაშლა ვერ მოხერხდა" : "Failed to delete");
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBudget = (job: Job) => {
    switch (job.budgetType) {
      case "fixed":
        return job.budgetAmount
          ? `₾${job.budgetAmount.toLocaleString()}`
          : null;
      case "range":
        return job.budgetMin && job.budgetMax
          ? `₾${job.budgetMin.toLocaleString()} - ₾${job.budgetMax.toLocaleString()}`
          : null;
      case "per_sqm":
        return job.pricePerUnit ? `₾${job.pricePerUnit}/მ²` : null;
      case "negotiable":
        return locale === "ka" ? "შეთანხმებით" : "Negotiable";
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (locale === "ka") {
      if (diffMins < 60) return `${diffMins} წუთის წინ`;
      if (diffHours < 24) return `${diffHours} საათის წინ`;
      if (diffDays < 7) return `${diffDays} დღის წინ`;
      return date.toLocaleDateString("ka-GE");
    }

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPropertyTypeLabel = (type: string) => {
    const label = propertyTypeLabels[type];
    return label ? label[locale as "en" | "ka"] : type;
  };

  const getWorkTypeLabel = (type: string) => {
    const label = workTypeLabels[type];
    return label ? label[locale as "en" | "ka"] : type;
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
  const isHired = job.status === "in_progress";

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0D0D0C]">
      {/* Fonts */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap");

        .font-display {
          font-family: "Playfair Display", Georgia, serif;
        }
        .font-body {
          font-family: "DM Sans", system-ui, sans-serif;
        }
      `}</style>

      <Header />
      <HeaderSpacer />

      {/* Hero Gallery Section */}
      <section className="relative h-[55vh] md:h-[65vh] overflow-hidden bg-neutral-900">
        {/* Background image with Ken Burns effect */}
        {allMedia.length > 0 ? (
          <>
            {allMedia.map((media, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  idx === activeImageIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center animate-ken-burns"
                  style={{
                    backgroundImage: `url(${storage.getFileUrl(media.url)})`,
                    animationDelay: `${idx * 5}s`,
                  }}
                />
              </div>
            ))}
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <>
            {/* Category-based illustration background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] opacity-60">
                {getCategoryIllustration(job?.category, job?.subcategory)}
              </div>
            </div>
            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          </>
        )}

        {/* Back button */}
        <div
          className={`absolute top-6 left-6 z-20 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <Link
            href="/browse/jobs"
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-body text-sm font-medium">
              {locale === "ka" ? "უკან" : "Back"}
            </span>
          </Link>
        </div>

        {/* Image counter */}
        {allMedia.length > 1 && (
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
            <button
              onClick={() => setSelectedMediaIndex(0)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="font-body text-sm">
                {allMedia.length} {locale === "ka" ? "ფოტო" : "photos"}
              </span>
            </button>
          </div>
        )}

        {/* Thumbnail strip */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {allMedia.slice(0, 5).map((media, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all duration-300 ${
                  idx === activeImageIndex
                    ? "ring-2 ring-white scale-110"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={storage.getFileUrl(media.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {allMedia.length > 5 && (
              <button
                onClick={() => setSelectedMediaIndex(0)}
                className="w-16 h-12 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center text-white text-sm font-medium"
              >
                +{allMedia.length - 5}
              </button>
            )}
          </div>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            {/* Status & Category */}
            <div
              className={`flex flex-wrap items-center gap-3 mb-4 transition-all duration-700 delay-100 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {isOpen && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-xs font-body font-semibold uppercase tracking-wider">
                    {locale === "ka" ? "აქტიური" : "Active"}
                  </span>
                </span>
              )}
              {isHired && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border"
                  style={{
                    backgroundColor: `${ACCENT}30`,
                    borderColor: `${ACCENT}50`,
                  }}
                >
                  <Check
                    className="w-3.5 h-3.5"
                    style={{ color: ACCENT_LIGHT }}
                  />
                  <span
                    className="text-xs font-body font-semibold uppercase tracking-wider"
                    style={{ color: ACCENT_LIGHT }}
                  >
                    {locale === "ka" ? "დაქირავებული" : "Hired"}
                  </span>
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border"
                style={{
                  backgroundColor: `${ACCENT}20`,
                  borderColor: `${ACCENT}40`,
                }}
              >
                <span
                  className="text-xs font-body font-medium tracking-wider"
                  style={{ color: ACCENT_LIGHT }}
                >
                  {getCategoryLabel(job.category)}
                </span>
                {job.subcategory && (
                  <>
                    <span className="text-white/40">/</span>
                    <span className="text-xs font-body font-medium tracking-wider text-white/80">
                      {getCategoryLabel(job.subcategory)}
                    </span>
                  </>
                )}
              </span>
            </div>

            {/* Title */}
            <h1
              className={`font-display text-3xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-4 transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {job.title}
            </h1>

            {/* Location & Time */}
            <div
              className={`flex flex-wrap items-center gap-4 text-white/70 transition-all duration-700 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {job.location && (
                <span className="flex items-center gap-2 font-body">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-2 font-body">
                <Clock className="w-4 h-4" />
                {getTimeAgo(job.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 -mt-6">
        <div className="max-w-6xl mx-auto px-6">
          {/* Floating Stats Bar */}
          <div
            className={`relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-4 md:p-6 mb-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Budget */}
              {budgetDisplay && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${ACCENT}15` }}
                  >
                    <span
                      className="font-body text-xl font-bold"
                      style={{ color: ACCENT }}
                    >
                      ₾
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-body font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {locale === "ka" ? "ბიუჯეტი" : "Budget"}
                    </p>
                    <p className="text-xl md:text-2xl font-body font-bold text-neutral-900 dark:text-white tabular-nums">
                      {budgetDisplay}
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="hidden md:block w-px h-12 bg-neutral-200 dark:bg-neutral-700" />

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-body font-bold text-neutral-900 dark:text-white tabular-nums">
                    {job.viewCount}
                  </p>
                  <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                    {locale === "ka" ? "ნახვა" : "Views"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-body font-bold text-neutral-900 dark:text-white tabular-nums">
                    {job.proposalCount}
                  </p>
                  <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                    {locale === "ka" ? "შეთავაზება" : "Proposals"}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-12 bg-neutral-200 dark:bg-neutral-700" />

              {/* Owner Actions or Submit Button */}
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/post-job?edit=${job._id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    {locale === "ka" ? "რედაქტირება" : "Edit"}
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : isPro && isOpen && !myProposal && !isCheckingProposal ? (
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: ACCENT,
                    boxShadow: `0 4px 20px ${ACCENT}40`,
                  }}
                >
                  <Send className="w-4 h-4" />
                  {locale === "ka" ? "შეთავაზების გაგზავნა" : "Submit Proposal"}
                </button>
              ) : isPro && isOpen && isCheckingProposal ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-neutral-400">
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8 pb-24">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section
                className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-500 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                  {locale === "ka" ? "აღწერა" : "Description"}
                </h2>
                <p className="font-body text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </section>

              {/* Property Specs */}
              {(job.propertyType ||
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
                  <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white mb-6">
                    {locale === "ka" ? "დეტალები" : "Property Details"}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {job.propertyType && (
                      <SpecCard
                        icon={<Home className="w-5 h-5" />}
                        label={locale === "ka" ? "ტიპი" : "Type"}
                        value={getPropertyTypeLabel(job.propertyType)}
                      />
                    )}
                    {job.areaSize && (
                      <SpecCard
                        icon={<Ruler className="w-5 h-5" />}
                        label={locale === "ka" ? "ფართი" : "Area"}
                        value={`${job.areaSize} მ²`}
                      />
                    )}
                    {job.landArea && (
                      <SpecCard
                        icon={<Mountain className="w-5 h-5" />}
                        label={locale === "ka" ? "მიწის ფართი" : "Land Area"}
                        value={`${job.landArea} მ²`}
                      />
                    )}
                    {job.roomCount && (
                      <SpecCard
                        icon={<DoorOpen className="w-5 h-5" />}
                        label={locale === "ka" ? "ოთახები" : "Rooms"}
                        value={job.roomCount.toString()}
                      />
                    )}
                    {job.pointsCount && (
                      <SpecCard
                        icon={<Zap className="w-5 h-5" />}
                        label={locale === "ka" ? "წერტილები" : "Points"}
                        value={job.pointsCount.toString()}
                      />
                    )}
                    {job.floorCount && (
                      <SpecCard
                        icon={<Layers className="w-5 h-5" />}
                        label={locale === "ka" ? "სართულები" : "Floors"}
                        value={job.floorCount.toString()}
                      />
                    )}
                    {job.cadastralId && (
                      <SpecCard
                        icon={<Map className="w-5 h-5" />}
                        label={locale === "ka" ? "საკადასტრო" : "Cadastral"}
                        value={job.cadastralId}
                      />
                    )}
                    {job.deadline && (
                      <SpecCard
                        icon={<Calendar className="w-5 h-5" />}
                        label={locale === "ka" ? "ვადა" : "Deadline"}
                        value={new Date(job.deadline).toLocaleDateString(
                          locale === "ka" ? "ka-GE" : "en-US",
                          { month: "short", day: "numeric" }
                        )}
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
                  <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    {locale === "ka" ? "სამუშაოს ტიპები" : "Work Types"}
                  </h2>
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
                  <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    {locale === "ka" ? "მოთხოვნები" : "Requirements"}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {job.furnitureIncluded && (
                      <RequirementBadge
                        icon={<Armchair className="w-4 h-4" />}
                        text={
                          locale === "ka"
                            ? "ავეჯის შერჩევა"
                            : "Furniture Selection"
                        }
                      />
                    )}
                    {job.visualizationNeeded && (
                      <RequirementBadge
                        icon={<Sparkles className="w-4 h-4" />}
                        text={
                          locale === "ka"
                            ? "3D ვიზუალიზაცია"
                            : "3D Visualization"
                        }
                      />
                    )}
                    {job.materialsProvided && (
                      <RequirementBadge
                        icon={<Package className="w-4 h-4" />}
                        text={
                          locale === "ka"
                            ? "მასალები უზრუნველყოფილია"
                            : "Materials Provided"
                        }
                      />
                    )}
                    {job.occupiedDuringWork && (
                      <RequirementBadge
                        icon={<Users className="w-4 h-4" />}
                        text={
                          locale === "ka"
                            ? "დაკავებული სამუშაოს დროს"
                            : "Occupied During Work"
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
                    {locale === "ka" ? "რეფერენსები" : "References"}
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

              {/* My Proposal */}
              {myProposal && isPro && (
                <section className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-6 md:p-8 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
                        {locale === "ka"
                          ? "თქვენი შეთავაზება"
                          : "Your Proposal"}
                      </h3>
                      <span
                        className={`text-xs font-body font-medium uppercase tracking-wider ${
                          myProposal.status === "pending"
                            ? "text-amber-600 dark:text-amber-400"
                            : myProposal.status === "accepted"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {myProposal.status === "pending"
                          ? locale === "ka"
                            ? "განხილვაში"
                            : "Pending"
                          : myProposal.status === "accepted"
                            ? locale === "ka"
                              ? "გაგზავნილი"
                              : "Submitted"
                            : locale === "ka"
                              ? "უარყოფილი"
                              : "Rejected"}
                      </span>
                    </div>
                  </div>
                  <p className="font-body text-neutral-600 dark:text-neutral-300 mb-4">
                    {myProposal.coverLetter}
                  </p>
                  {(myProposal.proposedPrice ||
                    myProposal.estimatedDuration) && (
                    <div className="flex gap-6">
                      {myProposal.proposedPrice && (
                        <div>
                          <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                            {locale === "ka" ? "ფასი" : "Price"}
                          </p>
                          <p
                            className="font-display text-xl font-semibold"
                            style={{ color: ACCENT }}
                          >
                            ₾{myProposal.proposedPrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {myProposal.estimatedDuration && (
                        <div>
                          <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                            {locale === "ka" ? "ვადა" : "Duration"}
                          </p>
                          <p className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                            {myProposal.estimatedDuration}{" "}
                            {myProposal.estimatedDurationUnit === "days"
                              ? locale === "ka"
                                ? "დღე"
                                : "days"
                              : myProposal.estimatedDurationUnit === "weeks"
                                ? locale === "ka"
                                  ? "კვირა"
                                  : "weeks"
                                : locale === "ka"
                                  ? "თვე"
                                  : "months"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Client Card */}
                <div
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <h3 className="font-display text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                    {locale === "ka" ? "დამკვეთი" : "Client"}
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar
                      src={job.clientId?.avatar}
                      name={job.clientId?.name || "Client"}
                      size="lg"
                      className="w-14 h-14 ring-2 ring-neutral-100 dark:ring-neutral-800"
                    />
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-neutral-900 dark:text-white truncate">
                        {job.clientId?.accountType === "organization"
                          ? job.clientId?.companyName || job.clientId?.name
                          : job.clientId?.name}
                      </p>
                      {job.clientId?.city && (
                        <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.clientId?.city}
                        </p>
                      )}
                    </div>
                  </div>
                  {job.clientId?.accountType === "organization" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <span className="font-body text-xs text-neutral-500 dark:text-neutral-400">
                        {locale === "ka" ? "ორგანიზაცია" : "Organization"}
                      </span>
                    </div>
                  )}
                </div>

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
                      href={`/professionals/${job.hiredPro._id}`}
                      className="flex items-center gap-4 group"
                    >
                      <Avatar
                        src={job.hiredPro.avatar || job.hiredPro.userId?.avatar}
                        name={job.hiredPro.userId?.name || "Professional"}
                        size="lg"
                        className="w-14 h-14 ring-2 transition-all group-hover:ring-4"
                        style={{ "--tw-ring-color": `${ACCENT}40` } as any}
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

                {/* Share */}
                <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-body text-xs text-neutral-500 dark:text-neutral-400">
                      {locale === "ka" ? "გაზიარება" : "Share"}
                    </p>
                    <p className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
                      #{job.jobNumber || job._id.slice(-6)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/jobs/${job._id}`;
                          const text = job.title;
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
                            'facebook-share',
                            'width=580,height=400'
                          );
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white transition-colors"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/jobs/${job._id}`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: job.title,
                                text: job.description.slice(0, 100) + '...',
                                url: url,
                              });
                            } catch (err) {
                              // User cancelled or error
                            }
                          } else {
                            await navigator.clipboard.writeText(url);
                            setCopyToast(true);
                            setTimeout(() => setCopyToast(false), 2000);
                          }
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                        title={locale === 'ka' ? 'გაზიარება' : 'Share'}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/jobs/${job._id}`;
                          await navigator.clipboard.writeText(url);
                          setCopyToast(true);
                          setTimeout(() => setCopyToast(false), 2000);
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                        title={locale === 'ka' ? 'ლინკის კოპირება' : 'Copy link'}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Proposal Form Modal */}
      {showProposalForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProposalForm(false)}
          />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                  {locale === "ka" ? "წინადადების გაგზავნა" : "Submit Proposal"}
                </h2>
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-body text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="p-6 space-y-5">
              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {locale === "ka" ? "სამოტივაციო წერილი" : "Cover Letter"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={proposalData.coverLetter}
                  onChange={(e) =>
                    setProposalData({
                      ...proposalData,
                      coverLetter: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ "--tw-ring-color": ACCENT } as any}
                  placeholder={
                    locale === "ka"
                      ? "წარმოადგინეთ თქვენი გამოცდილება..."
                      : "Describe your experience..."
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === "ka" ? "ფასი (₾)" : "Price (₾)"}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      proposalData.proposedPrice
                        ? Number(proposalData.proposedPrice)
                            .toLocaleString("en-US")
                            .replace(/,/g, " ")
                        : ""
                    }
                    onChange={(e) => {
                      // Remove spaces and non-numeric characters except decimal point
                      const rawValue = e.target.value.replace(/[^\d.]/g, "");
                      setProposalData({
                        ...proposalData,
                        proposedPrice: rawValue,
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": ACCENT } as any}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === "ka" ? "ვადა" : "Duration"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={proposalData.estimatedDuration}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseInt(value) >= 1) {
                        setProposalData({
                          ...proposalData,
                          estimatedDuration: value,
                        });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": ACCENT } as any}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === "ka" ? "ერთეული" : "Unit"}
                  </label>
                  <select
                    value={proposalData.estimatedDurationUnit}
                    onChange={(e) =>
                      setProposalData({
                        ...proposalData,
                        estimatedDurationUnit: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-body focus:outline-none focus:ring-2 transition-all cursor-pointer"
                    style={{ "--tw-ring-color": ACCENT } as any}
                  >
                    <option value="days">
                      {locale === "ka" ? "დღე" : "Days"}
                    </option>
                    <option value="weeks">
                      {locale === "ka" ? "კვირა" : "Weeks"}
                    </option>
                    <option value="months">
                      {locale === "ka" ? "თვე" : "Months"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="flex-1 py-3 rounded-xl font-body text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {locale === "ka" ? "გაუქმება" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {isSubmitting
                    ? "..."
                    : locale === "ka"
                      ? "გაგზავნა"
                      : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteError("");
        }}
        onConfirm={handleDeleteJob}
        title={locale === "ka" ? "წაშლის დადასტურება" : "Delete this job?"}
        description={locale === "ka"
          ? "ეს მოქმედება ვერ გაუქმდება."
          : "This action cannot be undone."}
        icon={<Trash2 className="w-6 h-6 text-red-500" />}
        variant="danger"
        cancelLabel={locale === "ka" ? "გაუქმება" : "Cancel"}
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
            <button
              onClick={() => setSuccess("")}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Copy Link Toast */}
      {copyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white shadow-lg font-body">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              {locale === "ka" ? "ლინკი დაკოპირდა" : "Link copied"}
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
        locale={locale as "en" | "ka"}
        showThumbnails={false}
        showInfo={false}
      />

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

