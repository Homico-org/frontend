"use client";

import AddressPicker from "@/components/common/AddressPicker";
import BeforeAfterUpload from "@/components/common/BeforeAfterUpload";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StarRating } from "@/components/ui/StarRating";

export interface BeforeAfterPair {
  id: string;
  beforeImage: string;
  afterImage: string;
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
  clientName?: string;
  clientAvatar?: string;
  rating?: number;
  review?: string;
  completedDate?: string;
  displayOrder?: number;
  isVisible?: boolean; // Whether visible on portfolio page
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
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div
        className={`absolute top-0 bottom-0 bg-white pointer-events-none ${compact ? "w-0.5" : "w-[3px]"}`}
        style={{
          left: `${sliderPosition}%`,
          transform: "translateX(-50%)",
          boxShadow: "0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex items-center justify-center ${compact ? "w-6 h-6" : "w-10 h-10"}`}
        >
          <div className="flex items-center gap-0.5">
            <svg
              className={`text-neutral-700 ${compact ? "w-2 h-2" : "w-3 h-3"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <svg
              className={`text-neutral-700 ${compact ? "w-2 h-2" : "w-3 h-3"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </div>
        </div>
      </div>
      {!compact && (
        <>
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-gray-900/80 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
            Before
          </div>
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[#C4735B]/90 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
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
  const { t, locale } = useLanguage();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/public`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (data?.url) {
        return data.url.startsWith("http") || data.url.startsWith("data:")
          ? data.url
          : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
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
      const url = await uploadImage(files[i]);
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

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/public`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.url) {
            const url = data.url.startsWith("http") || data.url.startsWith("data:")
              ? data.url
              : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
            uploadedUrls.push(url);
          }
        }
      } catch (error) {
        console.error("Failed to upload video:", error);
      }

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
      {/* Header — only show when there are projects */}
      {projects.length > 0 && !isAddingProject && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {projects.length} {t('common.total')}
          </span>
          {projects.length < maxProjects && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProject}
            >
              + {t('common.addProject')}
            </Button>
          )}
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
                    group relative rounded-2xl overflow-hidden border-2 bg-[var(--color-bg-elevated)] transition-all duration-300
                    ${
                      isHomico
                        ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-transparent cursor-default"
                        : "border-[var(--color-border-subtle)] hover:border-[#C4735B]/30 cursor-grab active:cursor-grabbing"
                    }
                    ${isDragOver ? "border-[#C4735B] border-dashed bg-[#C4735B]/5 transform scale-[1.02]" : ""}
                    ${isBeingDragged ? "opacity-50 scale-95" : ""}
                    ${!isVisible ? "opacity-60" : ""}
                  `}
                >
                  <div className="p-4">
                    {/* Project Header — number + title + badges + actions */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Number badge */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            willShowInBrowse
                              ? "bg-[#C4735B] text-white"
                              : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
                              {project.title}
                            </h4>
                            {willShowInBrowse && (
                              <Badge variant="warning" size="xs" className="flex-shrink-0">
                                {t('common.visible')}
                              </Badge>
                            )}
                            {isHomico && (
                              <Badge variant="success" size="xs" className="flex-shrink-0">
                                Homico
                              </Badge>
                            )}
                        </div>
                        {project.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        {project.location && (
                          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                            <svg
                              className="w-3 h-3 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {project.location}
                          </p>
                        )}
                        {/* Homico project extra info */}
                        {isHomico && project.clientName && (
                          <div className="flex items-center gap-2 mt-2">
                            {project.clientAvatar && (
                              <img
                                src={project.clientAvatar}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="text-xs text-emerald-700">
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

                      {/* Actions (only for external projects) */}
                      {!isHomico && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(project.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isVisible
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]"
                            }`}
                            title={
                              isVisible
                                ? "Hide from portfolio"
                                : "Show in portfolio"
                            }
                          >
                            {isVisible ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditProject(project)}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[#C4735B] hover:bg-[#C4735B]/10 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
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
                            <div className="absolute top-1 left-1 px-1 py-0.5 bg-[#C4735B] rounded text-[8px] font-bold text-white flex items-center gap-0.5">
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      {project.images
                        ?.slice(0, 5 - (project.beforeAfterPairs?.length || 0) - (project.videos?.slice(0, 2).length || 0))
                        .map((url, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]"
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      {(project.images?.length || 0) +
                        (project.videos?.length || 0) +
                        (project.beforeAfterPairs?.length || 0) >
                        5 && (
                        <div className="aspect-square rounded-lg bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center">
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
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs text-emerald-800 italic">
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

      {/* Empty State — compact, auto-opens form */}
      {projects.length === 0 && !isAddingProject && (
        <button
          type="button"
          onClick={handleAddProject}
          className="w-full py-8 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[#C4735B]/40 bg-[var(--color-bg-elevated)] transition-all group"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 flex items-center justify-center group-hover:bg-[#C4735B]/20 transition-colors">
              <svg className="w-5 h-5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[#C4735B] transition-colors">
              {t('common.addYourFirstProject')}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('common.showcaseYourWorkWithPhotos')}
            </p>
          </div>
        </button>
      )}

      {/* Add/Edit Project Form */}
      {isAddingProject && (
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
          {/* Form Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {editingProjectId
                ? t('common.editProject')
                : t('common.newProject')}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Title + Location row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  {t('common.projectTitle')} <span className="text-red-400">*</span>
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

            {/* Description — compact */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
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

            {/* Media Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                  {t('common.media')}
                </label>
                {totalMedia > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
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
                    <div key={pair.id} className="relative group col-span-2 aspect-[2/1] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex">
                      <div className="w-1/2 h-full relative">
                        <img src={pair.beforeImage} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white">
                          {t('common.before')}
                        </span>
                      </div>
                      <div className="w-1/2 h-full relative">
                        <img src={pair.afterImage} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-emerald-500 rounded text-[8px] font-bold text-white">
                          {t('common.after')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBeforeAfterPair(pair.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#C4735B] rounded text-[8px] font-bold text-white shadow flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Video
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {currentProject.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      {idx === 0 &&
                        currentProject.beforeAfterPairs.length === 0 &&
                        currentProject.videos.length === 0 && (
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#C4735B] rounded text-[8px] font-bold text-white">
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
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingType === "gallery"}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[#C4735B]/40 bg-[var(--color-bg-tertiary)] transition-all duration-200 flex flex-col items-center gap-2 text-[var(--color-text-secondary)] hover:text-[#C4735B] group"
                >
                  {uploadingType === "gallery" ? (
                    <>
                      <LoadingSpinner size="md" color="#C4735B" />
                      <span className="text-sm">{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 group-hover:bg-[#C4735B]/20 flex items-center justify-center transition-colors">
                        <svg
                          className="w-5 h-5 text-[#C4735B]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">
                        {t('common.photos')}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {t('common.multiplePhotos')}
                      </span>
                    </>
                  )}
                </button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingType === "video"}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[#C4735B]/40 bg-[var(--color-bg-tertiary)] transition-all duration-200 flex flex-col items-center gap-2 text-[var(--color-text-secondary)] hover:text-[#C4735B] group"
                >
                  {uploadingType === "video" ? (
                    <>
                      <LoadingSpinner size="md" color="#C4735B" />
                      <span className="text-sm">{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 group-hover:bg-[#C4735B]/20 flex items-center justify-center transition-colors">
                        <svg
                          className="w-5 h-5 text-[#C4735B]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">
                        {t('common.videos')}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {t('common.max100mbEach')}
                      </span>
                    </>
                  )}
                </button>

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
                  uploadImage={uploadImage}
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

      {/* No stats summary — keep it clean */}
    </div>
  );
}
