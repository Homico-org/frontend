"use client";

import Avatar from "@/components/common/Avatar";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import api from "@/lib/api";
import { storage } from "@/services/storage";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Edit3,
  ExternalLink,
  Eye,
  Home,
  Layers,
  Map,
  MapPin,
  MessageCircle,
  Mountain,
  Ruler,
  Send,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Terracotta accent - matching design system
const ACCENT_COLOR = "#C4735B";

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
  // New fields
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
}

// Property type translations
const propertyTypeLabels: Record<string, { en: string; ka: string }> = {
  apartment: { en: "Apartment", ka: "ბინა" },
  house: { en: "House", ka: "სახლი" },
  office: { en: "Office", ka: "ოფისი" },
  building: { en: "Building", ka: "შენობა" },
  other: { en: "Other", ka: "სხვა" },
};

// Work types translations
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { trackEvent } = useAnalytics();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
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
  const galleryRef = useRef<HTMLDivElement>(null);

  const isOwner = user && job?.clientId && user.id === job.clientId._id;
  const isPro = user?.role === "pro";

  // Combine all media
  const allMedia: MediaItem[] = job
    ? [
        ...(job.media || []),
        ...(job.images || [])
          .filter((img) => !job.media?.some((m) => m.url === img))
          .map((url) => ({ type: "image" as const, url })),
      ]
    : [];

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
      if (!user || user.role !== "pro" || !params.id) return;

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
      }
    };

    if (user?.role === "pro") {
      fetchMyProposal();
    }
  }, [user, params.id]);

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
      // Refresh job data
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

  const [deleteError, setDeleteError] = useState("");

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Header />
        <HeaderSpacer />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-8 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-5 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded" />
            <div className="h-48 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full"
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
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* ==================== HEADER ==================== */}
      <Header />
      <HeaderSpacer />

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Link
            href="/browse/jobs"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === "ka" ? "უკან" : "Back to Jobs"}
          </Link>

          {/* ==================== JOB HEADER ==================== */}
          <div className="mb-8">
            {/* Category & Status & Time */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: ACCENT_COLOR }}
              >
                {getCategoryLabel(job.category)}
                {job.subcategory && ` • ${getCategoryLabel(job.subcategory)}`}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="w-3 h-3" />
                {getTimeAgo(job.createdAt)}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              {isOpen && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {locale === "ka" ? "ღია" : "Open"}
                </span>
              )}
              {isHired && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: ACCENT_COLOR }}
                >
                  <Check className="w-3 h-3" />
                  {locale === "ka" ? "დაქირავებული" : "Hired"}
                </span>
              )}
              {job.status === "completed" && (
                <span className="text-[11px] font-medium text-neutral-500">
                  {locale === "ka" ? "დასრულებული" : "Completed"}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              {job.title}
            </h1>

            {/* Location */}
            {job.location && (
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{job.location}</span>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-2 mt-4">
                <Link
                  href={`/post-job?edit=${job._id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  {locale === "ka" ? "რედაქტირება" : "Edit"}
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {locale === "ka" ? "წაშლა" : "Delete"}
                </button>
              </div>
            )}
          </div>

          {/* ==================== IMAGE GALLERY ==================== */}
          {allMedia.length > 0 && (
            <div className="mb-8">
              <div
                ref={galleryRef}
                className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {allMedia.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMediaIndex(idx)}
                    className="flex-shrink-0 relative rounded-2xl overflow-hidden group"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    {media.type === "video" ? (
                      <div className="w-56 h-40 bg-neutral-800 flex items-center justify-center">
                        {media.thumbnail ? (
                          <img
                            src={storage.getFileUrl(media.thumbnail)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 ml-0.5"
                              style={{ color: ACCENT_COLOR }}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={storage.getFileUrl(media.url)}
                        alt=""
                        className="w-56 h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== BUDGET CARD ==================== */}
          {budgetDisplay && (
            <div
              className="p-5 rounded-2xl mb-8"
              style={{ backgroundColor: `${ACCENT_COLOR}10` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                {locale === "ka" ? "ბიუჯეტი" : "Budget"}
              </p>
              <p className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>
                {budgetDisplay}
              </p>
              {job.budgetType === "per_sqm" &&
                job.areaSize &&
                job.pricePerUnit && (
                  <p className="text-sm text-neutral-500 mt-1">
                    ≈ ₾{(job.areaSize * job.pricePerUnit).toLocaleString()}{" "}
                    {locale === "ka" ? "სულ" : "total"}
                  </p>
                )}
            </div>
          )}

          {/* ==================== SPECS GRID ==================== */}
          {(job.propertyType ||
            job.areaSize ||
            job.roomCount ||
            job.floorCount ||
            job.deadline ||
            job.cadastralId ||
            job.landArea ||
            job.pointsCount) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {job.propertyType && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "ტიპი" : "Type"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {getPropertyTypeLabel(job.propertyType)}
                  </p>
                </div>
              )}
              {job.areaSize && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "ფართი" : "Area"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.areaSize} მ²
                  </p>
                </div>
              )}
              {job.landArea && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Mountain className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "მიწის ფართი" : "Land Area"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.landArea} მ²
                  </p>
                </div>
              )}
              {job.roomCount && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <DoorOpen className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "ოთახები" : "Rooms"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.roomCount}
                  </p>
                </div>
              )}
              {job.pointsCount && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "წერტილები" : "Points"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.pointsCount}
                  </p>
                </div>
              )}
              {job.floorCount && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "სართულები" : "Floors"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.floorCount}
                  </p>
                </div>
              )}
              {job.cadastralId && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Map className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "საკადასტრო" : "Cadastral"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {job.cadastralId}
                  </p>
                </div>
              )}
              {job.deadline && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                      {locale === "ka" ? "ვადა" : "Deadline"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {new Date(job.deadline).toLocaleDateString(
                      locale === "ka" ? "ka-GE" : "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==================== DESCRIPTION ==================== */}
          {job.description && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {locale === "ka" ? "აღწერა" : "Description"}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          )}

          {/* ==================== WORK TYPES ==================== */}
          {job.workTypes && job.workTypes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {locale === "ka" ? "სამუშაოს ტიპები" : "Work Types"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.workTypes.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: `${ACCENT_COLOR}10`,
                      color: ACCENT_COLOR,
                    }}
                  >
                    {getWorkTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ==================== REQUIREMENTS ==================== */}
          {(job.furnitureIncluded ||
            job.visualizationNeeded ||
            job.materialsProvided ||
            job.occupiedDuringWork) && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {locale === "ka" ? "მოთხოვნები" : "Requirements"}
              </h2>
              <div className="space-y-2">
                {job.furnitureIncluded && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {locale === "ka"
                        ? "ავეჯის შერჩევა"
                        : "Furniture Selection"}
                    </span>
                  </div>
                )}
                {job.visualizationNeeded && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {locale === "ka" ? "3D ვიზუალიზაცია" : "3D Visualization"}
                    </span>
                  </div>
                )}
                {job.materialsProvided && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {locale === "ka"
                        ? "მასალები უზრუნველყოფილია"
                        : "Materials Provided"}
                    </span>
                  </div>
                )}
                {job.occupiedDuringWork && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {locale === "ka"
                        ? "დაკავებული სამუშაოს დროს"
                        : "Occupied During Work"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== REFERENCES ==================== */}
          {job.references && job.references.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {locale === "ka" ? "რეფერენსები" : "References"}
              </h2>
              <div className="space-y-2">
                {job.references.map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      {ref.type === "pinterest" ? (
                        <svg
                          className="w-4 h-4"
                          style={{ color: "#E60023" }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                        </svg>
                      ) : ref.type === "instagram" ? (
                        <svg
                          className="w-4 h-4"
                          style={{ color: "#E4405F" }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      ) : (
                        <ExternalLink className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300 truncate flex-1">
                      {ref.title ||
                        (() => {
                          try {
                            return new URL(ref.url).hostname;
                          } catch {
                            return ref.url;
                          }
                        })()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ==================== STATS BAR ==================== */}
          <div className="flex items-center gap-6 py-4 border-t border-b border-neutral-100 dark:border-neutral-800 mb-8 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {job.viewCount} {locale === "ka" ? "ნახვა" : "views"}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {job.proposalCount} {locale === "ka" ? "შეთავაზება" : "proposals"}
            </span>
            <span>ID: {job._id.slice(-8)}</span>
          </div>

          {/* ==================== MY PROPOSAL (if exists) ==================== */}
          {myProposal && isPro && (
            <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {locale === "ka" ? "თქვენი შეთავაზება" : "Your Proposal"}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-md font-medium ${
                    myProposal.status === "pending"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : myProposal.status === "accepted"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {myProposal.status === "pending"
                    ? locale === "ka"
                      ? "განხილვაში"
                      : "Pending"
                    : myProposal.status === "accepted"
                      ? locale === "ka"
                        ? "მიღებული"
                        : "Accepted"
                      : locale === "ka"
                        ? "უარყოფილი"
                        : "Rejected"}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                {myProposal.coverLetter}
              </p>
              {(myProposal.proposedPrice || myProposal.estimatedDuration) && (
                <div className="flex gap-6 text-sm">
                  {myProposal.proposedPrice && (
                    <span
                      className="font-semibold"
                      style={{ color: ACCENT_COLOR }}
                    >
                      ₾{myProposal.proposedPrice.toLocaleString()}
                    </span>
                  )}
                  {myProposal.estimatedDuration && (
                    <span className="text-neutral-500">
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
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== CLIENT CARD ==================== */}
          {job.clientId && (
            <div className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-8">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-4">
                {locale === "ka" ? "დამკვეთი" : "Posted By"}
              </h3>
              <div className="flex items-center gap-4">
                <Avatar
                  src={job.clientId.avatar}
                  name={job.clientId.name || "Client"}
                  size="md"
                  className="w-12 h-12"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">
                    {job.clientId.accountType === "organization"
                      ? job.clientId.companyName || job.clientId.name
                      : job.clientId.name}
                  </p>
                  {job.clientId.city && (
                    <p className="text-sm text-neutral-500">
                      {job.clientId.city}
                    </p>
                  )}
                </div>
                <Link
                  href={`/messages?recipient=${job.clientId._id}`}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {locale === "ka" ? "მიწერა" : "Message"}
                </Link>
              </div>
            </div>
          )}

          {/* ==================== PROPOSAL FORM ==================== */}
          {isPro && isOpen && !myProposal && showProposalForm && (
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {locale === "ka" ? "წინადადების გაგზავნა" : "Submit Proposal"}
                </h2>
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors resize-none"
                    placeholder={
                      locale === "ka"
                        ? "წარმოადგინეთ თქვენი გამოცდილება..."
                        : "Describe your experience..."
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      {locale === "ka" ? "ფასი (₾)" : "Price (₾)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={proposalData.proposedPrice}
                      onChange={(e) =>
                        setProposalData({
                          ...proposalData,
                          proposedPrice: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      {locale === "ka" ? "ვადა" : "Duration"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={proposalData.estimatedDuration}
                      onChange={(e) =>
                        setProposalData({
                          ...proposalData,
                          estimatedDuration: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors cursor-pointer"
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
                    className="flex-1 py-3 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {locale === "ka" ? "გაუქმება" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: ACCENT_COLOR }}
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
          )}
        </div>
      </main>

      {/* ==================== STICKY CTA BAR (for pros) ==================== */}
      {isPro && isOpen && !myProposal && !showProposalForm && (
        <div className="sticky bottom-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {job.clientId && (
                <>
                  <Avatar
                    src={job.clientId.avatar}
                    name={job.clientId.name || "Client"}
                    size="sm"
                    className="w-10 h-10"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {job.clientId.accountType === "organization"
                        ? job.clientId.companyName || job.clientId.name
                        : job.clientId.name}
                    </p>
                    {budgetDisplay && (
                      <p className="text-xs" style={{ color: ACCENT_COLOR }}>
                        {budgetDisplay}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowProposalForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <Send className="w-4 h-4" />
              {locale === "ka" ? "შეთავაზების გაგზავნა" : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>© 2024 Homico. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/help"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteError("");
            }}
          />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {locale === "ka" ? "წაშლის დადასტურება" : "Delete this job?"}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm">
              {locale === "ka"
                ? "ეს მოქმედება ვერ გაუქმდება."
                : "This action cannot be undone."}
            </p>
            {deleteError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {locale === "ka" ? "გაუქმება" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "..." : locale === "ka" ? "წაშლა" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUCCESS TOAST ==================== */}
      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500 text-white shadow-lg">
            <Check className="w-5 h-5" />
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

      {/* ==================== LIGHTBOX ==================== */}
      {selectedMediaIndex !== null && allMedia[selectedMediaIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setSelectedMediaIndex(null)}
        >
          <button
            onClick={() => setSelectedMediaIndex(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {allMedia[selectedMediaIndex].type === "video" ? (
            <video
              src={storage.getFileUrl(allMedia[selectedMediaIndex].url)}
              className="max-w-[90vw] max-h-[90vh] rounded-xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={storage.getFileUrl(allMedia[selectedMediaIndex].url)}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {allMedia.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMediaIndex(
                    (selectedMediaIndex - 1 + allMedia.length) % allMedia.length
                  );
                }}
                className="absolute left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMediaIndex(
                    (selectedMediaIndex + 1) % allMedia.length
                  );
                }}
                className="absolute right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                {selectedMediaIndex + 1} / {allMedia.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== STYLES ==================== */}
      <style jsx>{`
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
