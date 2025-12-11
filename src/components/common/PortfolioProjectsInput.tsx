'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useRef, useState } from 'react';
import AddressPicker from './AddressPicker';

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
  images: string[]; // Regular gallery images
  beforeAfterPairs: BeforeAfterPair[]; // Before/After comparison pairs
}

interface PortfolioProjectsInputProps {
  projects: PortfolioProject[];
  onChange: (projects: PortfolioProject[]) => void;
  maxProjects?: number;
}

type UploadingType = 'gallery' | 'beforeAfter' | null;

// Before/After Slider Preview Component
function BeforeAfterPreview({ beforeImage, afterImage, compact = false }: { beforeImage: string; afterImage: string; compact?: boolean }) {
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
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden cursor-ew-resize select-none ${compact ? 'aspect-square rounded-lg' : 'aspect-[4/3] rounded-xl'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* After Image (Background - full width) */}
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Before Image (Clipped using clip-path for proper sizing) */}
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

      {/* Slider Line */}
      <div
        className={`absolute top-0 bottom-0 bg-white pointer-events-none ${compact ? 'w-0.5' : 'w-[3px]'}`}
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 12px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)'
        }}
      >
        {/* Slider Handle */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-white/80 ${compact ? 'w-6 h-6' : 'w-10 h-10'}`}>
          <div className="flex items-center gap-0.5">
            <svg className={`text-gray-700 ${compact ? 'w-2 h-2' : 'w-3 h-3'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <svg className={`text-gray-700 ${compact ? 'w-2 h-2' : 'w-3 h-3'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      {!compact && (
        <>
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-gradient-to-r from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider shadow-lg">
            Before
          </div>
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-gradient-to-r from-[#D2691E]/90 to-[#CD853F]/80 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider shadow-lg">
            After
          </div>
        </>
      )}
    </div>
  );
}

export default function PortfolioProjectsInput({
  projects,
  onChange,
  maxProjects = 999,
}: PortfolioProjectsInputProps) {
  const { locale } = useLanguage();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const beforeAfterInputRef = useRef<HTMLInputElement>(null);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<UploadingType>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [currentProject, setCurrentProject] = useState<PortfolioProject>({
    id: '',
    title: '',
    description: '',
    location: '',
    images: [],
    beforeAfterPairs: [],
  });

  const resetForm = () => {
    setCurrentProject({
      id: '',
      title: '',
      description: '',
      location: '',
      images: [],
      beforeAfterPairs: [],
    });
    setIsAddingProject(false);
    setEditingProjectId(null);
  };

  const handleAddProject = () => {
    setCurrentProject({
      id: `project-${Date.now()}`,
      title: '',
      description: '',
      location: '',
      images: [],
      beforeAfterPairs: [],
    });
    setIsAddingProject(true);
    setEditingProjectId(null);
  };

  const handleEditProject = (project: PortfolioProject) => {
    setCurrentProject({ ...project });
    setEditingProjectId(project.id);
    setIsAddingProject(true);
  };

  const handleDeleteProject = (projectId: string) => {
    onChange(projects.filter(p => p.id !== projectId));
  };

  const handleSaveProject = () => {
    if (!currentProject.title.trim()) return;
    if (currentProject.images.length === 0 && currentProject.beforeAfterPairs.length === 0) return;

    if (editingProjectId) {
      onChange(projects.map(p => p.id === editingProjectId ? currentProject : p));
    } else {
      onChange([...projects, currentProject]);
    }
    resetForm();
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/public`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (data?.url) {
        return data.url.startsWith('http')
          ? data.url
          : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
    return null;
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType('gallery');
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const url = await uploadImage(files[i]);
      if (url) uploadedUrls.push(url);
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setCurrentProject(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));

    setUploadingType(null);
    setUploadProgress(0);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleBeforeAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length !== 2) {
      // Must select exactly 2 images
      if (beforeAfterInputRef.current) beforeAfterInputRef.current.value = '';
      return;
    }

    setUploadingType('beforeAfter');
    setUploadProgress(0);

    // Upload both images
    const beforeUrl = await uploadImage(files[0]);
    setUploadProgress(50);
    const afterUrl = await uploadImage(files[1]);
    setUploadProgress(100);

    if (beforeUrl && afterUrl) {
      const newPair: BeforeAfterPair = {
        id: `pair-${Date.now()}`,
        beforeImage: beforeUrl,
        afterImage: afterUrl,
      };
      setCurrentProject(prev => ({
        ...prev,
        beforeAfterPairs: [...prev.beforeAfterPairs, newPair],
      }));
    }

    setUploadingType(null);
    setUploadProgress(0);
    if (beforeAfterInputRef.current) beforeAfterInputRef.current.value = '';
  };

  const handleRemoveGalleryImage = (index: number) => {
    setCurrentProject(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveBeforeAfterPair = (pairId: string) => {
    setCurrentProject(prev => ({
      ...prev,
      beforeAfterPairs: prev.beforeAfterPairs.filter(p => p.id !== pairId),
    }));
  };

  const canSave = () => {
    if (!currentProject.title.trim()) return false;
    return currentProject.images.length > 0 || currentProject.beforeAfterPairs.length > 0;
  };

  const totalMedia = currentProject.images.length + currentProject.beforeAfterPairs.length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D2691E]/20 to-[#CD853F]/10 flex items-center justify-center border border-[#D2691E]/20">
            <svg className="w-4.5 h-4.5 text-[#D2691E] dark:text-[#CD853F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'პორტფოლიო პროექტები' : 'Portfolio Projects'}
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
            </p>
          </div>
        </div>

        {!isAddingProject && projects.length < maxProjects && (
          <button
            type="button"
            onClick={handleAddProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-[#D2691E] text-white hover:bg-[#D2691E] shadow-md shadow-[#D2691E]/20 hover:shadow-lg hover:shadow-[#D2691E]/25 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {locale === 'ka' ? 'დამატება' : 'Add'}
          </button>
        )}
      </div>

      {/* Existing Projects Grid */}
      {projects.length > 0 && !isAddingProject && (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="group relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[#D2691E]/30 hover:shadow-xl hover:shadow-[#D2691E]/5 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-4">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">
                      {project.title}
                    </h4>
                    {project.location && (
                      <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {project.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditProject(project)}
                      className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[#D2691E] dark:hover:text-[#CD853F] hover:bg-[#D2691E]/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* Before/After Pairs */}
                  {project.beforeAfterPairs.map((pair) => (
                    <div key={pair.id} className="relative">
                      <BeforeAfterPreview
                        beforeImage={pair.beforeImage}
                        afterImage={pair.afterImage}
                        compact
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-[8px] font-bold text-white uppercase">
                        B/A
                      </div>
                    </div>
                  ))}
                  {/* Regular Images */}
                  {project.images.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {project.description && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !isAddingProject && (
        <button
          type="button"
          onClick={handleAddProject}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[#D2691E]/40 bg-gradient-to-br from-[var(--color-bg-secondary)]/80 to-[var(--color-bg-tertiary)]/30 transition-all duration-300 group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D2691E]/15 to-[#CD853F]/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#D2691E]/20 border border-[#D2691E]/20">
              <svg className="w-7 h-7 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--color-text-secondary)] group-hover:text-[#D2691E] dark:group-hover:text-[#CD853F] transition-colors">
                {locale === 'ka' ? 'დაამატე პროექტი' : 'Add a project'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-[220px]">
                {locale === 'ka' ? 'აჩვენე შენი ნამუშევრები ჩვეულებრივი ფოტოებით ან Before/After შედარებით' : 'Showcase your work with photos or Before/After comparisons'}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Add/Edit Project Form */}
      {isAddingProject && (
        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-secondary)] shadow-xl">
          {/* Form Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-gradient-to-r from-[#D2691E]/5 to-transparent flex items-center justify-between">
            <h4 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#D2691E] animate-pulse"></span>
              {editingProjectId
                ? (locale === 'ka' ? 'პროექტის რედაქტირება' : 'Edit Project')
                : (locale === 'ka' ? 'ახალი პროექტი' : 'New Project')
              }
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                {locale === 'ka' ? 'პროექტის სახელი' : 'Project Title'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentProject.title}
                onChange={(e) => setCurrentProject(prev => ({ ...prev, title: e.target.value }))}
                placeholder={locale === 'ka' ? 'მაგ: აპარტამენტის რემონტი ვაკეში' : 'e.g., Apartment Renovation'}
                className="w-full px-4 py-3 rounded-xl border-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#D2691E]/50 transition-all"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            {/* Location with Google Maps */}
            <div>
              <AddressPicker
                value={currentProject.location || ''}
                onChange={(value) => setCurrentProject(prev => ({ ...prev, location: value }))}
                locale={locale as 'ka' | 'en'}
                label={locale === 'ka' ? 'მდებარეობა' : 'Location'}
                required={false}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                {locale === 'ka' ? 'აღწერა' : 'Description'}
              </label>
              <textarea
                value={currentProject.description}
                onChange={(e) => setCurrentProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder={locale === 'ka' ? 'მოკლედ აღწერე რა გააკეთე...' : 'Briefly describe what you did...'}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#D2691E]/50 transition-all resize-none"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'მედია' : 'Media'} <span className="text-red-500">*</span>
                </label>
                {totalMedia > 0 && (
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {totalMedia} {locale === 'ka' ? 'ელემენტი' : 'item(s)'}
                  </span>
                )}
              </div>

              {/* Current Media Preview */}
              {(currentProject.images.length > 0 || currentProject.beforeAfterPairs.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* Before/After Pairs */}
                  {currentProject.beforeAfterPairs.map((pair) => (
                    <div key={pair.id} className="relative group">
                      <BeforeAfterPreview
                        beforeImage={pair.beforeImage}
                        afterImage={pair.afterImage}
                        compact
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-[8px] font-bold text-white uppercase shadow">
                        B/A
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBeforeAfterPair(pair.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {/* Regular Images */}
                  {currentProject.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {idx === 0 && currentProject.beforeAfterPairs.length === 0 && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#D2691E] rounded text-[8px] font-bold text-white">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gallery Upload */}
                <div>
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
                    disabled={uploadingType === 'gallery'}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[#D2691E]/40 bg-[var(--color-bg-tertiary)]/30 transition-all duration-200 flex flex-col items-center gap-2 text-[var(--color-text-secondary)] hover:text-[#D2691E] dark:hover:text-[#CD853F] group"
                  >
                    {uploadingType === 'gallery' ? (
                      <>
                        <svg className="animate-spin w-6 h-6 text-[#D2691E]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">{uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-[#D2691E]/10 group-hover:bg-[#D2691E]/20 flex items-center justify-center transition-colors">
                          <svg className="w-5 h-5 text-[#D2691E] dark:text-[#CD853F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{locale === 'ka' ? 'ფოტოები' : 'Photos'}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{locale === 'ka' ? 'რამდენიმე ფოტო' : 'Multiple photos'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Before/After Upload - Select exactly 2 images */}
                <div>
                  <input
                    ref={beforeAfterInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBeforeAfterUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => beforeAfterInputRef.current?.click()}
                    disabled={uploadingType === 'beforeAfter'}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-amber-500/40 bg-[var(--color-bg-tertiary)]/30 transition-all duration-200 flex flex-col items-center gap-2 text-[var(--color-text-secondary)] hover:text-amber-600 dark:hover:text-amber-400 group"
                  >
                    {uploadingType === 'beforeAfter' ? (
                      <>
                        <svg className="animate-spin w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">{uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 group-hover:from-amber-500/20 group-hover:to-orange-500/20 flex items-center justify-center transition-colors">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{locale === 'ka' ? 'სანამ/შემდეგ' : 'Before/After'}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{locale === 'ka' ? 'აირჩიეთ 2 სურათი' : 'Select exactly 2 images'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                disabled={!canSave()}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  canSave()
                    ? 'bg-[#D2691E] text-white hover:bg-[#D2691E] shadow-lg shadow-[#D2691E]/25'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                }`}
              >
                {editingProjectId
                  ? (locale === 'ka' ? 'შენახვა' : 'Save Changes')
                  : (locale === 'ka' ? 'პროექტის დამატება' : 'Add Project')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
