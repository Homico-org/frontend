'use client';

import NextImage from 'next/image';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Input, Textarea } from '@/components/ui/input';
import { ArrowLeftRight, Image as ImageIcon, Plus, Trash2, Video, X } from 'lucide-react';
import { useRef } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import type { PortfolioProject } from '../hooks/useRegistration';

export interface ServicesStepProps {
  locale: string;
  portfolioProjects: PortfolioProject[];
  addPortfolioProject: () => void;
  updatePortfolioProject: (id: string, field: string, value: string | string[]) => void;
  removePortfolioProject: (id: string) => void;
  handleProjectImageUpload: (projectId: string, files: FileList | null) => void;
  removeProjectImage: (projectId: string, imageIndex: number) => void;
  handleProjectVideoUpload: (projectId: string, files: FileList | null) => void;
  removeProjectVideo: (projectId: string, videoIndex: number) => void;
  handleBeforeAfterUpload: (projectId: string, type: 'before' | 'after', file: File) => void;
  removeBeforeAfterPair: (projectId: string, pairId: string) => void;
}

export default function StepServices({
  locale,
  portfolioProjects,
  addPortfolioProject,
  updatePortfolioProject,
  removePortfolioProject,
  handleProjectImageUpload,
  removeProjectImage,
  handleProjectVideoUpload,
  removeProjectVideo,
  handleBeforeAfterUpload,
  removeBeforeAfterPair,
}: ServicesStepProps) {
  const { t } = useLanguage();
  const hasValidProject = portfolioProjects.length > 0 && 
    portfolioProjects.some(p => p.images.length > 0 || p.videos.length > 0 || p.beforeAfterPairs.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
          {t('register.portfolio')}
        </h1>
        <p className="text-sm text-neutral-500">
          {t('register.showcaseYourWorkMinimum')}
        </p>
      </div>

      {/* Required notice */}
      <Alert variant="warning" size="sm">
        {t('register.atLeast1ProjectIs')}
      </Alert>

      {/* Portfolio Projects Section */}
      <Card className={`p-4 border-2 transition-all ${
        hasValidProject
          ? 'border-emerald-500/50'
          : 'border-[#C4735B] ring-4 ring-[#C4735B]/10'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <IconBadge icon={ImageIcon} variant="accent" size="sm" />
              {t('common.projects')}
              <span className="text-[#C4735B]">*</span>
            </h2>
            {hasValidProject ? (
              <Badge variant="success" size="xs">
                {t('common.completed')}
              </Badge>
            ) : (
              <Badge variant="default" size="xs">
                {t('common.required')}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            onClick={addPortfolioProject}
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('common.add')}
          </Button>
        </div>

        {portfolioProjects.length === 0 ? (
          <div
            onClick={addPortfolioProject}
            className="border-2 border-dashed border-[#C4735B]/30 rounded-xl p-6 text-center hover:border-[#C4735B]/50 hover:bg-[#C4735B]/5 transition-colors cursor-pointer"
          >
            <IconBadge icon={Plus} variant="accent" size="lg" className="mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-900 mb-1">
              {t('register.addYourFirstProject')}
            </p>
            <p className="text-xs text-neutral-500">
              {t('register.showcaseYourWork')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolioProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                locale={locale}
                onUpdate={(field, value) => updatePortfolioProject(project.id, field, value)}
                onRemove={() => removePortfolioProject(project.id)}
                onImageUpload={(files) => handleProjectImageUpload(project.id, files)}
                onRemoveImage={(imgIndex) => removeProjectImage(project.id, imgIndex)}
                onVideoUpload={(files) => handleProjectVideoUpload(project.id, files)}
                onRemoveVideo={(vidIndex) => removeProjectVideo(project.id, vidIndex)}
                onBeforeAfterUpload={(type, file) => handleBeforeAfterUpload(project.id, type, file)}
                onRemoveBeforeAfterPair={(pairId) => removeBeforeAfterPair(project.id, pairId)}
              />
            ))}

            {/* Add more projects button */}
            <Button
              type="button"
              variant="outline"
              onClick={addPortfolioProject}
              className="w-full border-2 border-dashed border-[#C4735B]/20 text-[#C4735B] hover:border-[#C4735B]/40 hover:bg-[#C4735B]/5"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('register.addAnotherProject')}
            </Button>
          </div>
        )}
      </Card>

      <p className="text-xs text-neutral-400 text-center">
        {t('register.youCanUpdateThisInformation')}
      </p>
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: PortfolioProject;
  index: number;
  locale: string;
  onUpdate: (field: string, value: string | string[]) => void;
  onRemove: () => void;
  onImageUpload: (files: FileList | null) => void;
  onRemoveImage: (imageIndex: number) => void;
  onVideoUpload: (files: FileList | null) => void;
  onRemoveVideo: (videoIndex: number) => void;
  onBeforeAfterUpload: (type: 'before' | 'after', file: File) => void;
  onRemoveBeforeAfterPair: (pairId: string) => void;
}

function ProjectCard({
  project,
  index,
  locale,
  onUpdate,
  onRemove,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
  onBeforeAfterUpload,
  onRemoveBeforeAfterPair,
}: ProjectCardProps) {
  const { t } = useLanguage();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card variant="outlined" className="p-3 bg-[#C4735B]/5 border-[#C4735B]/10">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Input
          type="text"
          value={project.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder={locale === 'ka' ? `პროექტი ${index + 1}` : `Project ${index + 1}`}
          className="flex-1 text-xs"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-neutral-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <Textarea
        value={project.description}
        onChange={(e) => onUpdate('description', e.target.value)}
        placeholder={t('register.descriptionOptional')}
        rows={2}
        className="mb-2 text-xs"
      />

      {/* Uploaded media preview */}
      {(project.images.length > 0 || project.videos.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Images */}
          {project.images.map((img, imgIndex) => (
            <div key={`img-${imgIndex}`} className="relative group">
              <img
                src={img}
                alt={`Project ${index + 1} image ${imgIndex + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-[#C4735B]/20"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemoveImage(imgIndex)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {/* Videos */}
          {project.videos.map((vid, vidIndex) => (
            <div key={`vid-${vidIndex}`} className="relative group">
              <div className="w-16 h-16 rounded-lg border border-indigo-300 bg-indigo-50 overflow-hidden">
                <video
                  src={vid}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.pause();
                    video.currentTime = 0;
                  }}
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-indigo-500/80 flex items-center justify-center pointer-events-none">
                  <Video className="w-2 h-2 text-white" />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemoveVideo(vidIndex)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Before/After pairs preview */}
      {project.beforeAfterPairs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {project.beforeAfterPairs.map((pair) => (
            <div key={pair.id} className="relative group">
              <div className="w-24 h-12 rounded-lg border border-emerald-300 overflow-hidden flex">
                <div className="w-1/2 h-full relative">
                  <NextImage src={pair.beforeImage} alt="Before" fill className="object-cover" sizes="100px" unoptimized />
                  <span className="absolute bottom-0 left-0 text-[8px] bg-black/60 text-white px-1">
                    {t('common.before')}
                  </span>
                </div>
                <div className="w-1/2 h-full relative">
                  <NextImage src={pair.afterImage} alt="After" fill className="object-cover" sizes="100px" unoptimized />
                  <span className="absolute bottom-0 right-0 text-[8px] bg-emerald-500/80 text-white px-1">
                    {t('common.after')}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemoveBeforeAfterPair(pair.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          leftIcon={<ImageIcon className="w-3 h-3" />}
          className="text-[#C4735B] border-[#C4735B]/30 hover:bg-[#C4735B]/5"
        >
          {t('register.photo')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          leftIcon={<Video className="w-3 h-3" />}
          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
        >
          {t('common.video')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => beforeInputRef.current?.click()}
          leftIcon={<ArrowLeftRight className="w-3 h-3" />}
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
        >
          {t('register.beforeafter')}
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onImageUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => onVideoUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={beforeInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onBeforeAfterUpload('before', file);
        }}
        className="hidden"
      />
    </Card>
  );
}
