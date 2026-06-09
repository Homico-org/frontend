"use client";

import api from "@/lib/api";
import AddressPicker from "@/components/common/AddressPicker";
import BeforeAfterUpload from "@/components/common/BeforeAfterUpload";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfileSetup } from "@/contexts/ProfileSetupContext";
import { useMarketplaceCountry } from "@/hooks/useCountry";
import { currencySymbol } from "@/utils/currency";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MapPin,
  Play,
  Plus,
  Star,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { StarRating } from "@/components/ui/StarRating";

export interface BeforeAfterPair {
  id: string;
  beforeImage: string;
  afterImage: string;
}

// Services snapshotted onto a project - pros pick from their own pricing
// catalog when adding/editing a project, and the chosen services with their
// prices travel with the project so customers see "this 'TV Mounting' project
// covered: TV install ₾40, Wall mount ₾30".
export interface PortfolioProjectService {
  serviceKey: string;
  subcategoryKey?: string;
  label: string;
  unitLabel?: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  location?: string;
  images: string[];
  videos: string[];
  beforeAfterPairs: BeforeAfterPair[];
  source?: "external" | "homico";
  // Link to a completed Homico job when `source === 'homico'`. Must round-trip
  // through profile-setup saves or "homico"-flagged entries become orphaned.
  jobId?: string;
  clientName?: string;
  clientAvatar?: string;
  rating?: number;
  review?: string;
  completedDate?: string;
  displayOrder?: number;
  isVisible?: boolean; // Whether visible on portfolio page
  // Services that were performed on this project (and their prices).
  // Pros pick from their pricing catalog when adding the project.
  services?: PortfolioProjectService[];
}

interface ProjectsStepProps {
  projects: PortfolioProject[];
  onChange: (projects: PortfolioProject[]) => void;
  maxProjects?: number;
  maxVisibleInBrowse?: number; // How many show on browse page
}

// Before/After Slider Preview Component
function BeforeAfterPreview({
  beforeImage,
  afterImage,
  compact = false,
}: {
  beforeImage: string;
  afterImage: string;
  compact?: boolean;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden cursor-ew-resize select-none ${compact ? "aspect-square rounded-lg" : "aspect-[4/3] rounded-xl"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-served + onError fallback; next/image conversion deferred until perf audit. */}
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-served + onError fallback; next/image conversion deferred until perf audit. */}
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div
        className={`absolute top-0 bottom-0 bg-[var(--hm-bg-elevated)] pointer-events-none ${compact ? "w-0.5" : "w-[3px]"}`}
        style={{
          left: `${sliderPosition}%`,
          transform: "translateX(-50%)",
          boxShadow: "0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--hm-bg-elevated)] rounded-full shadow-lg flex items-center justify-center ${compact ? "w-6 h-6" : "w-10 h-10"}`}
        >
          <div className="flex items-center gap-0.5">
            <ChevronLeft
              className={`text-[var(--hm-fg-secondary)] ${compact ? "w-2 h-2" : "w-3 h-3"}`}
            />
            <ChevronRight
              className={`text-[var(--hm-fg-secondary)] ${compact ? "w-2 h-2" : "w-3 h-3"}`}
            />
          </div>
        </div>
      </div>
      {!compact && (
        <>
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-gray-900/80 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
            Before
          </div>
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[var(--hm-brand-500)]/90 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
            After
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectsStep({
  projects,
  onChange,
  maxProjects = 20,
  maxVisibleInBrowse = 6,
}: ProjectsStepProps) {
  const { t, locale, pick } = useLanguage();
  const country = useMarketplaceCountry();
  const sym = currencySymbol({ country });
  const { selectedSubcategoriesWithPricing } = useProfileSetup();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Flatten the pro's pricing catalog into a list of priced services they
  // can attach to a project. Range-mode entries surface their (priceMin, priceMax).
  //
  // Resilience note: we detect "this unit is a range" from EITHER the explicit
  // `useRange` flag OR the presence of meaningful `priceMin`/`priceMax`. The
  // flag is the modern source of truth, but stale data from before the DTO fix
  // (2026-05) or partial hydration may carry priceMin/priceMax without the
  // flag - so we fall through to the values themselves to avoid showing the
  // midpoint as a single price.
  const availableServicesForProject = useMemo<PortfolioProjectService[]>(() => {
    const out: PortfolioProjectService[] = [];
    for (const sub of selectedSubcategoriesWithPricing) {
      const subName = pick({ en: sub.name, ka: sub.nameKa });
      for (const svc of sub.services) {
        if (!svc.isActive) continue;
        const activeUnits = (svc.unitPrices ?? []).filter((u) => u.isActive);
        let lo = Number.POSITIVE_INFINITY;
        let hi = Number.NEGATIVE_INFINITY;
        let unitLabel = svc.unitLabel;
        let anyRange = false;
        for (const u of activeUnits) {
          const hasExplicitRange =
            u.priceMin !== undefined &&
            u.priceMax !== undefined &&
            u.priceMin > 0 &&
            u.priceMax > 0 &&
            u.priceMin !== u.priceMax;
          const unitIsRange = u.useRange === true || hasExplicitRange;
          const min = unitIsRange ? (u.priceMin ?? u.price) : u.price;
          const max = unitIsRange ? (u.priceMax ?? u.price) : u.price;
          if (unitIsRange) anyRange = true;
          if (min > 0 && min < lo) lo = min;
          if (max > 0 && max > hi) hi = max;
          if (u.unitLabel) unitLabel = u.unitLabel;
        }
        if (!Number.isFinite(lo) && svc.price > 0) {
          lo = hi = svc.price;
        }
        if (!Number.isFinite(lo)) continue;
        out.push({
          serviceKey: svc.serviceKey,
          subcategoryKey: svc.subcategoryKey || sub.key,
          label: svc.label || subName,
          unitLabel,
          price: svc.price > 0 ? svc.price : lo,
          ...(anyRange && lo !== hi ? { priceMin: lo, priceMax: hi } : {}),
        });
      }
    }
    return out;
  }, [selectedSubcategoriesWithPricing, pick]);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<
    "gallery" | "beforeAfter" | "video" | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);

  const [currentProject, setCurrentProject] = useState<PortfolioProject>({
    id: "",
    title: "",
    description: "",
    location: "",
    images: [],
    videos: [],
    beforeAfterPairs: [],
    source: "external",
    isVisible: true,
  });

  // Ensure all projects have displayOrder
  useEffect(() => {
    const needsUpdate = projects.some((p, idx) => p.displayOrder !== idx);
    if (needsUpdate) {
      const updated = projects.map((p, idx) => ({ ...p, displayOrder: idx }));
      onChange(updated);
    }
    // Run once on mount only - this is a backfill for legacy projects
    // missing displayOrder. Re-running on every parent re-render would
    // create an update loop since onChange's identity is unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setCurrentProject({
      id: "",
      title: "",
      description: "",
      location: "",
      images: [],
      videos: [],
      beforeAfterPairs: [],
      source: "external",
      isVisible: true,
    });
    setIsAddingProject(false);
    setEditingProjectId(null);
  };

  const handleAddProject = () => {
    setCurrentProject({
      id: `project-${Date.now()}`,
      title: "",
      description: "",
      location: "",
      images: [],
      videos: [],
      beforeAfterPairs: [],
      source: "external",
      isVisible: true,
      displayOrder: projects.length,
    });
    setIsAddingProject(true);
    setEditingProjectId(null);
  };

  const handleEditProject = (project: PortfolioProject) => {
    if (project.source === "homico") return; // Can't edit Homico projects
    setCurrentProject({ ...project });
    setEditingProjectId(project.id);
    setIsAddingProject(true);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project?.source === "homico") return; // Can't delete Homico projects
    onChange(
      projects
        .filter((p) => p.id !== projectId)
        .map((p, idx) => ({ ...p, displayOrder: idx }))
    );
  };

  const handleSaveProject = () => {
    if (!currentProject.title.trim()) return;
    if (
      currentProject.images.length === 0 &&
      currentProject.beforeAfterPairs.length === 0
    )
      return;

    if (editingProjectId) {
      onChange(
        projects.map((p) => (p.id === editingProjectId ? currentProject : p))
      );
    } else {
      onChange([...projects, currentProject]);
    }
    resetForm();
  };

  const toggleVisibility = (projectId: string) => {
    onChange(
      projects.map((p) =>
        p.id === projectId ? { ...p, isVisible: !p.isVisible } : p
      )
    );
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project?.source === "homico") {
      e.preventDefault();
      return;
    }
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);

    // Add drag image styling
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedProject(null);
    setDragOverProject(null);
  };

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (projectId !== draggedProject) {
      setDragOverProject(projectId);
    }
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    setDragOverProject(null);

    if (!draggedProject || draggedProject === targetProjectId) return;

    const draggedIdx = projects.findIndex((p) => p.id === draggedProject);
    const targetIdx = projects.findIndex((p) => p.id === targetProjectId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIdx, 1);
    newProjects.splice(targetIdx, 0, removed);

    // Update display orders
    onChange(newProjects.map((p, idx) => ({ ...p, displayOrder: idx })));
    setDraggedProject(null);
  };

  // Touch drag handlers for mobile
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchedProjectId = useRef<string | null>(null);

  const handleTouchStart = (e: React.TouchEvent, projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project?.source === "homico") return;

    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchedProjectId.current = projectId;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/upload", formData);
      if (data?.url) {
        return data.url.startsWith("http") || data.url.startsWith("data:")
          ? data.url
          : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
    return null;
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType("gallery");
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const url = await uploadFile(files[i]);
      if (url) uploadedUrls.push(url);
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setCurrentProject((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));

    setUploadingType(null);
    setUploadProgress(0);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Before/After handled by BeforeAfterUpload component

  const handleRemoveGalleryImage = (index: number) => {
    setCurrentProject((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveBeforeAfterPair = (pairId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      beforeAfterPairs: prev.beforeAfterPairs.filter((p) => p.id !== pairId),
    }));
  };

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 100 * 1024 * 1024; // 100MB per video
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    setUploadingType("video");
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid video type:', file.type);
        continue;
      }

      if (file.size > maxSize) {
        console.error('Video too large:', file.size);
        continue;
      }

      const url = await uploadFile(file);
      if (url) uploadedUrls.push(url);

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setCurrentProject((prev) => ({
      ...prev,
      videos: [...prev.videos, ...uploadedUrls],
    }));

    setUploadingType(null);
    setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleRemoveVideo = (index: number) => {
    setCurrentProject((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const canSave = () => {
    if (!currentProject.title.trim()) return false;
    if (!currentProject.location?.trim()) return false;
    return (
      currentProject.images.length > 0 ||
      currentProject.videos.length > 0 ||
      currentProject.beforeAfterPairs.length > 0
    );
  };

  const totalMedia =
    currentProject.images.length + currentProject.videos.length + currentProject.beforeAfterPairs.length;
  const visibleProjects = projects.filter((p) => p.isVisible !== false);
  const homicoProjects = projects.filter((p) => p.source === "homico");
  const externalProjects = projects.filter((p) => p.source !== "homico");

  return (
    <div className="space-y-6">
      {/* Header - count + featured-on-card explanation + add button */}
      {projects.length > 0 && !isAddingProject && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-[var(--hm-fg-secondary)]">
                {projects.length} {t('common.total')}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ background: 'rgba(239,78,36,0.08)', color: 'var(--hm-brand-500)' }}
              >
                <Star className="w-3 h-3" />
                {Math.min(visibleProjects.length, maxVisibleInBrowse)} / {maxVisibleInBrowse} {t('common.onCard')}
              </span>
            </div>
            {projects.length < maxProjects && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProject}
              >
                <Plus className="w-3.5 h-3.5" />
                {t('common.addProject')}
              </Button>
            )}
          </div>
          <p className="text-[11px] leading-snug text-[var(--hm-fg-muted)]">
            {t('common.cardVisibilityHint', { max: maxVisibleInBrowse })}
          </p>
        </div>
      )}

      {/* Projects List with Drag & Drop */}
      {projects.length > 0 && !isAddingProject && (
        <div className="space-y-3">
          {projects
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((project, index) => {
              const isHomico = project.source === "homico";
              const isVisible = project.isVisible !== false;
              const willShowInBrowse = index < maxVisibleInBrowse && isVisible;
              const isDragOver = dragOverProject === project.id;
              const isBeingDragged = draggedProject === project.id;

              return (
                <div
                  key={project.id}
                  draggable={!isHomico}
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, project.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, project.id)}
                  onTouchStart={(e) => handleTouchStart(e, project.id)}
                  className={`
                    group relative rounded-2xl overflow-hidden bg-[var(--hm-bg-elevated)] transition-all duration-200
                    ${
                      isHomico
                        ? "cursor-default"
                        : "hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
                    }
                    ${isDragOver ? "transform scale-[1.02]" : ""}
                    ${isBeingDragged ? "opacity-50 scale-95" : ""}
                  `}
                  style={{
                    border: `1px solid ${
                      isDragOver
                        ? 'var(--hm-brand-500)'
                        : isHomico
                          ? 'rgba(62,143,90,0.30)'
                          : 'var(--hm-border-subtle)'
                    }`,
                    opacity: !isVisible ? 0.7 : 1,
                    boxShadow: !isHomico
                      ? '0 1px 2px rgba(0,0,0,0.02)'
                      : 'none',
                  }}
                >
                  <div className="p-4">
                    {/* Project Header - number badge, status pill, actions all
                        ALWAYS visible (no more hover-only). Pros immediately
                        understand what's visible where + how to edit. On
                        narrow mobile the actions drop to a second row so the
                        title "TV Mounting" doesn't get squeezed into a 2-line
                        wrap by three icon buttons fighting for the same row. */}
                    <div className="flex flex-wrap sm:flex-nowrap items-start justify-between mb-3 gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0 w-full sm:w-auto">
                        {/* Number badge - vermillion when featured on browse card, neutral otherwise */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={
                            willShowInBrowse
                              ? { background: 'var(--hm-brand-500)', color: '#fff' }
                              : { background: 'var(--hm-n-100)', color: 'var(--hm-fg-muted)' }
                          }
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--hm-fg-primary)] leading-tight">
                            {project.title}
                          </h4>
                          {/* Status pills row - VISIBILITY signals always shown */}
                          <div className="mt-1 flex items-center flex-wrap gap-1.5">
                            {willShowInBrowse ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                                style={{ background: 'var(--hm-brand-500)', color: '#fff' }}
                              >
                                <Star className="w-3 h-3" />
                                {t('common.featuredOnCard')}
                              </span>
                            ) : isVisible ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                                style={{
                                  color: 'var(--hm-fg-secondary)',
                                  border: '1px solid var(--hm-border-subtle)',
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                {t('common.profileOnly')}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                                style={{
                                  color: 'var(--hm-fg-muted)',
                                  border: '1px solid var(--hm-border-subtle)',
                                }}
                              >
                                <EyeOff className="w-3 h-3" />
                                {t('common.hidden')}
                              </span>
                            )}
                            {isHomico && (
                              <Badge variant="success" size="xs">
                                Homico
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-[var(--hm-fg-secondary)] mt-2 leading-relaxed">
                              {project.description}
                            </p>
                          )}
                          {/* Meta row - location + completion date side-by-side */}
                          {(project.location || project.completedDate) && (
                            <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--hm-fg-muted)]">
                              {project.location && (
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span>{project.location}</span>
                                </span>
                              )}
                              {project.completedDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 flex-shrink-0" />
                                  <span>{project.completedDate}</span>
                                </span>
                              )}
                            </div>
                          )}
                          {/* Services performed - pills with prices */}
                          {project.services && project.services.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {project.services.map((svc) => {
                                const priceLabel =
                                  svc.priceMin !== undefined &&
                                  svc.priceMax !== undefined &&
                                  svc.priceMin > 0 &&
                                  svc.priceMax > 0 &&
                                  svc.priceMin !== svc.priceMax
                                    ? `${svc.priceMin}-${svc.priceMax}${sym}`
                                    : `${svc.price}${sym}`;
                                return (
                                  <span
                                    key={svc.serviceKey}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                    style={{
                                      border: '1px solid var(--hm-border-subtle)',
                                      color: 'var(--hm-fg-primary)',
                                    }}
                                  >
                                    <span>{svc.label}</span>
                                    <span
                                      className="font-semibold tabular-nums"
                                      style={{ color: 'var(--hm-brand-500)' }}
                                    >
                                      {priceLabel}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {/* Homico project extra info */}
                          {isHomico && project.clientName && (
                            <div className="flex items-center gap-2 mt-2">
                              {project.clientAvatar && (
                                <Image
                                  src={project.clientAvatar}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              )}
                              <span className="text-xs text-[var(--hm-success-500)]">
                                {t('common.client')}{" "}
                                {project.clientName}
                              </span>
                              {project.rating && (
                                <StarRating rating={project.rating} size="xs" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions (only for external projects) - ALWAYS visible.
                          `w-full sm:w-auto` + `justify-end` drops the actions
                          to a right-aligned second row on narrow mobile so the
                          title gets its full row. */}
                      {!isHomico && (
                        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleVisibility(project.id)}
                            className={
                              isVisible
                                ? "text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)]"
                                : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)]"
                            }
                            aria-label={
                              isVisible
                                ? t('common.hideProject')
                                : t('common.showProject')
                            }
                            title={
                              isVisible
                                ? t('common.hideProject')
                                : t('common.showProject')
                            }
                          >
                            {isVisible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEditProject(project)}
                            className="text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/10"
                            aria-label={t('common.edit')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Media Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {project.beforeAfterPairs?.slice(0, 2).map((pair) => (
                        <div key={pair.id} className="relative">
                          <BeforeAfterPreview
                            beforeImage={pair.beforeImage}
                            afterImage={pair.afterImage}
                            compact
                          />
                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-[8px] font-bold text-white">
                            B/A
                          </div>
                        </div>
                      ))}
                      {project.videos
                        ?.slice(0, Math.max(0, 2 - (project.beforeAfterPairs?.length || 0)))
                        .map((url, idx) => (
                          <div
                            key={`video-${idx}`}
                            className="relative aspect-square rounded-lg overflow-hidden bg-neutral-900"
                          >
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute top-1 left-1 px-1 py-0.5 bg-[var(--hm-brand-500)] rounded text-[8px] font-bold text-white flex items-center gap-0.5">
                              <Play className="w-2 h-2" fill="currentColor" />
                            </div>
                          </div>
                        ))}
                      {project.images
                        ?.slice(0, 5 - (project.beforeAfterPairs?.length || 0) - (project.videos?.slice(0, 2).length || 0))
                        .map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden bg-[var(--hm-bg-tertiary)]"
                          >
                            <Image
                              src={url}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 25vw, 20vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      {(project.images?.length || 0) +
                        (project.videos?.length || 0) +
                        (project.beforeAfterPairs?.length || 0) >
                        5 && (
                        <div className="aspect-square rounded-lg bg-neutral-900 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            +
                            {(project.images?.length || 0) +
                              (project.videos?.length || 0) +
                              (project.beforeAfterPairs?.length || 0) -
                              5}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Review from Homico project */}
                    {isHomico && project.review && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--hm-success-50)] border border-emerald-100">
                        <p className="text-xs text-[var(--hm-success-500)] italic">
                          {`"${project.review}"`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Empty State - compact, auto-opens form */}
      {projects.length === 0 && !isAddingProject && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleAddProject}
          className="w-full h-auto py-8 rounded-xl border-2 border-dashed border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 bg-[var(--hm-bg-elevated)] hover:bg-[var(--hm-bg-elevated)] transition-all group"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center group-hover:bg-[var(--hm-brand-500)]/20 transition-colors">
              <Plus className="w-5 h-5 text-[var(--hm-brand-500)]" />
            </div>
            <p className="text-sm font-medium text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-brand-500)] transition-colors">
              {t('common.addYourFirstProject')}
            </p>
            <p className="text-xs text-[var(--hm-fg-muted)]">
              {t('common.showcaseYourWorkWithPhotos')}
            </p>
          </div>
        </Button>
      )}

      {/* Add/Edit Project Form */}
      {isAddingProject && (
        <div className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {/* Form Header */}
          <div className="px-4 py-3 border-b border-[var(--hm-border-subtle)] flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[var(--hm-fg-primary)]">
              {editingProjectId
                ? t('common.editProject')
                : t('common.newProject')}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={resetForm}
              className="text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Title + Location row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--hm-fg-secondary)] mb-1">
                  {t('common.projectTitle')} <span className="text-[var(--hm-error-500)]">*</span>
                </label>
                <Input
                  type="text"
                  value={currentProject.title}
                  onChange={(e) =>
                    setCurrentProject((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={t('common.egApartmentRenovation')}
                  inputSize="default"
                />
              </div>
              <div>
                <AddressPicker
                  value={currentProject.location || ""}
                  onChange={(value) =>
                    setCurrentProject((prev) => ({ ...prev, location: value }))
                  }
                  locale={locale as "ka" | "en" | "ru"}
                  label={t('common.location')}
                  required
                />
              </div>
            </div>

            {/* Description - compact */}
            <div>
              <label className="block text-xs font-medium text-[var(--hm-fg-secondary)] mb-1">
                {t('common.description')}
              </label>
              <Textarea
                value={currentProject.description}
                onChange={(e) =>
                  setCurrentProject((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('common.brieflyDescribeWhatYouDid')}
                rows={2}
                textareaSize="sm"
              />
            </div>

            {/* Services performed on this project - pulled from the pro's
                pricing catalog so the picker shows real prices the pro set */}
            {availableServicesForProject.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                  {t('common.servicesUsed')}
                  <span className="text-[var(--hm-fg-muted)] font-normal ml-1">
                    ({t('common.optional')})
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableServicesForProject.map((svc) => {
                    const selected = (currentProject.services ?? []).some(
                      (s) => s.serviceKey === svc.serviceKey,
                    );
                    const priceLabel =
                      svc.priceMin !== undefined &&
                      svc.priceMax !== undefined &&
                      svc.priceMin > 0 &&
                      svc.priceMax > 0 &&
                      svc.priceMin !== svc.priceMax
                        ? `${svc.priceMin}-${svc.priceMax}${sym}`
                        : `${svc.price}${sym}`;
                    return (
                      <button
                        key={svc.serviceKey}
                        type="button"
                        onClick={() => {
                          setCurrentProject((prev) => {
                            const list = prev.services ?? [];
                            const next = selected
                              ? list.filter((s) => s.serviceKey !== svc.serviceKey)
                              : [...list, svc];
                            return { ...prev, services: next };
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all hover:-translate-y-px"
                        style={
                          selected
                            ? {
                                background: 'var(--hm-brand-500)',
                                color: '#fff',
                                boxShadow: '0 2px 6px -2px rgba(239,78,36,0.30)',
                              }
                            : {
                                background: 'var(--hm-bg-elevated)',
                                color: 'var(--hm-fg-primary)',
                                border: '1px solid var(--hm-border-subtle)',
                              }
                        }
                      >
                        <span>{svc.label}</span>
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{
                            color: selected
                              ? 'rgba(255,255,255,0.85)'
                              : 'var(--hm-brand-500)',
                          }}
                        >
                          {priceLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {(currentProject.services?.length ?? 0) > 0 && (
                  <p className="mt-1.5 text-[11px] text-[var(--hm-fg-muted)]">
                    {currentProject.services!.length} {t('common.servicesSelected')}
                  </p>
                )}
              </div>
            )}

            {/* Media Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--hm-fg-primary)]">
                  {t('common.media')}
                </label>
                {totalMedia > 0 && (
                  <span className="text-xs text-[var(--hm-fg-muted)]">
                    {totalMedia} {t('common.items')}
                  </span>
                )}
              </div>

              {/* Current Media Preview */}
              {(currentProject.images.length > 0 ||
                currentProject.videos.length > 0 ||
                currentProject.beforeAfterPairs.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {currentProject.beforeAfterPairs.map((pair) => (
                    <div key={pair.id} className="relative group col-span-2 aspect-[2/1] rounded-lg overflow-hidden bg-[var(--hm-bg-tertiary)] flex">
                      <div className="w-1/2 h-full relative">
                        <Image
                          src={pair.beforeImage}
                          alt="Before"
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white">
                          {t('common.before')}
                        </span>
                      </div>
                      <div className="w-1/2 h-full relative">
                        <Image
                          src={pair.afterImage}
                          alt="After"
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-[var(--hm-success-500)] rounded text-[8px] font-bold text-white">
                          {t('common.after')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveBeforeAfterPair(pair.id)}
                        className="absolute top-1 right-1 h-auto w-auto p-1 bg-[var(--hm-error-500)] hover:bg-[var(--hm-error-500)]/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        aria-label={t('common.remove')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {currentProject.videos.map((url, idx) => (
                    <div
                      key={`video-${idx}`}
                      className="relative aspect-square rounded-lg overflow-hidden group bg-neutral-900"
                    >
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--hm-brand-500)] rounded text-[8px] font-bold text-white shadow flex items-center gap-0.5">
                        <Play className="w-2.5 h-2.5" fill="currentColor" />
                        Video
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveVideo(idx)}
                        className="absolute top-1 right-1 h-auto w-auto p-1 bg-[var(--hm-error-500)] hover:bg-[var(--hm-error-500)]/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        aria-label={t('common.remove')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {currentProject.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden group bg-[var(--hm-bg-tertiary)]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 h-auto w-auto p-1 bg-[var(--hm-error-500)] hover:bg-[var(--hm-error-500)]/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        aria-label={t('common.remove')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {idx === 0 &&
                        currentProject.beforeAfterPairs.length === 0 &&
                        currentProject.videos.length === 0 && (
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[var(--hm-brand-500)] rounded text-[8px] font-bold text-white">
                            Cover
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Options */}
              <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingType === "gallery"}
                  className="w-full h-auto p-4 rounded-xl border-2 border-dashed border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 bg-[var(--hm-bg-tertiary)] hover:bg-[var(--hm-bg-tertiary)] transition-all duration-200 flex flex-col items-center gap-2 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] group"
                >
                  {uploadingType === "gallery" ? (
                    <>
                      <LoadingSpinner size="md" color="var(--hm-brand-500)" />
                      <span className="text-sm">{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/10 group-hover:bg-[var(--hm-brand-500)]/20 flex items-center justify-center transition-colors">
                        <ImageIcon className="w-5 h-5 text-[var(--hm-brand-500)]" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('common.photos')}
                      </span>
                      <span className="text-[10px] text-[var(--hm-fg-muted)]">
                        {t('common.multiplePhotos')}
                      </span>
                    </>
                  )}
                </Button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingType === "video"}
                  className="w-full h-auto p-4 rounded-xl border-2 border-dashed border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 bg-[var(--hm-bg-tertiary)] hover:bg-[var(--hm-bg-tertiary)] transition-all duration-200 flex flex-col items-center gap-2 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] group"
                >
                  {uploadingType === "video" ? (
                    <>
                      <LoadingSpinner size="md" color="var(--hm-brand-500)" />
                      <span className="text-sm">{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/10 group-hover:bg-[var(--hm-brand-500)]/20 flex items-center justify-center transition-colors">
                        <Video className="w-5 h-5 text-[var(--hm-brand-500)]" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('common.videos')}
                      </span>
                      <span className="text-[10px] text-[var(--hm-fg-muted)]">
                        {t('common.max100mbEach')}
                      </span>
                    </>
                  )}
                </Button>

              </div>
                {/* Before/After upload */}
                <BeforeAfterUpload
                  pairs={currentProject.beforeAfterPairs.map(p => ({ before: p.beforeImage, after: p.afterImage }))}
                  onPairsChange={(newPairs) => {
                    setCurrentProject(prev => ({
                      ...prev,
                      beforeAfterPairs: newPairs.map((p, i) => ({
                        id: `pair-${Date.now()}-${i}`,
                        beforeImage: p.before,
                        afterImage: p.after,
                      })),
                    }));
                  }}
                  uploadImage={uploadFile}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSaveProject}
                disabled={!canSave()}
                className="flex-1"
              >
                {editingProjectId
                  ? t('common.saveChanges')
                  : t('common.addProject')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No stats summary - keep it clean */}
    </div>
  );
}
