'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  ChevronRight,
  Check,
  Play,
  Eye,
  CheckCircle2,
  User,
  FileText,
  Plus,
  Send,
  X,
  Upload,
} from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { storage } from '@/services/storage';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

// Terracotta palette
const ACCENT = '#C4735B';
const ACCENT_LIGHT = '#D4897A';
const ACCENT_DARK = '#A85D4A';

export type ProjectStage = 'hired' | 'started' | 'in_progress' | 'review' | 'completed';

interface ProjectComment {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'client' | 'pro';
  content: string;
  createdAt: string;
}

interface ProjectAttachment {
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  uploadedAt: string;
}

interface ProjectTracking {
  _id: string;
  jobId: string;
  clientId: { _id: string; name: string; avatar?: string };
  proId: { _id: string; name: string; avatar?: string; phone?: string; title?: string };
  currentStage: ProjectStage;
  progress: number;
  hiredAt: string;
  startedAt?: string;
  expectedEndDate?: string;
  completedAt?: string;
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  agreedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  media: { type: string; url: string }[];
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
}

interface ProjectTrackerCardProps {
  job: Job;
  project: ProjectTracking;
  isClient: boolean;
  locale: string;
  onRefresh?: () => void;
}

const STAGES: { key: ProjectStage; label: string; labelKa: string; icon: React.ReactNode }[] = [
  { key: 'hired', label: 'Hired', labelKa: 'დაქირავებული', icon: <Check className="w-3.5 h-3.5" /> },
  { key: 'started', label: 'Started', labelKa: 'დაწყებული', icon: <Play className="w-3.5 h-3.5" /> },
  { key: 'in_progress', label: 'In Progress', labelKa: 'მიმდინარე', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'review', label: 'Review', labelKa: 'შემოწმება', icon: <Eye className="w-3.5 h-3.5" /> },
  { key: 'completed', label: 'Completed', labelKa: 'დასრულებული', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

function getStageIndex(stage: ProjectStage): number {
  return STAGES.findIndex(s => s.key === stage);
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ka') {
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    return `${diffDays} დღის წინ`;
  }

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function ProjectTrackerCard({
  job,
  project,
  isClient,
  locale,
  onRefresh,
}: ProjectTrackerCardProps) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const currentStageIndex = getStageIndex(project.currentStage);
  const firstImage = job.media?.[0]?.url || job.images?.[0];

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.post(`/jobs/projects/${job._id}/comments`, { content: newComment });
      setNewComment('');
      toast.success(
        locale === 'ka' ? 'წარმატება' : 'Success',
        locale === 'ka' ? 'კომენტარი დაემატა' : 'Comment added'
      );
      onRefresh?.();
    } catch (err) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'კომენტარი ვერ დაემატა' : 'Failed to add comment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (newStage: ProjectStage) => {
    try {
      setIsSubmitting(true);
      await api.patch(`/jobs/projects/${job._id}/stage`, { stage: newStage });
      setShowStageModal(false);
      toast.success(
        locale === 'ka' ? 'წარმატება' : 'Success',
        locale === 'ka' ? 'სტატუსი განახლდა' : 'Stage updated'
      );
      onRefresh?.();
    } catch (err) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'სტატუსი ვერ განახლდა' : 'Failed to update stage'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');

        .project-card {
          font-family: 'Outfit', system-ui, sans-serif;
        }
        .project-card .font-mono {
          font-family: 'Space Mono', monospace;
        }

        @keyframes progress-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .progress-bar-shine {
          animation: progress-shine 2s ease-in-out infinite;
        }

        .stage-active::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid currentColor;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        .card-gradient {
          background: linear-gradient(
            135deg,
            rgba(196, 115, 91, 0.03) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(196, 115, 91, 0.05) 100%
          );
        }

        .timeline-dot {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timeline-dot:hover {
          transform: scale(1.2);
        }
      `}</style>

      <div className="project-card bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transition-all duration-300 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50">
        {/* Header Section with Gradient Overlay */}
        <div className="relative">
          {/* Background Image or Color */}
          <div className="h-32 sm:h-40 relative overflow-hidden">
            {firstImage ? (
              <img
                src={storage.getFileUrl(firstImage)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`
                }}
              />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {locale === 'ka' ? 'აქტიური პროექტი' : 'Active Project'}
                  </span>
                  <span className="text-white/60 text-xs font-mono">
                    #{job._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white line-clamp-1">
                  {job.title}
                </h3>
              </div>

              {/* Pro Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <Avatar
                    src={isClient ? project.proId?.avatar : project.clientId?.avatar}
                    name={isClient ? project.proId?.name : project.clientId?.name}
                    size="md"
                    className="w-12 h-12 ring-2 ring-white/30"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {isClient ? 'P' : 'C'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 card-gradient">
          {/* Stage Timeline */}
          <div className="relative mb-4">
            {/* Progress Line */}
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-700" />
            <div
              className="absolute top-3.5 left-0 h-0.5 transition-all duration-500 overflow-hidden"
              style={{
                width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                backgroundColor: ACCENT
              }}
            >
              <div
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent progress-bar-shine"
              />
            </div>

            {/* Stage Dots */}
            <div className="relative flex justify-between">
              {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <button
                    key={stage.key}
                    onClick={() => !isClient && setShowStageModal(true)}
                    disabled={isClient}
                    className={`timeline-dot flex flex-col items-center gap-1.5 ${!isClient ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'text-white'
                          : isCurrent
                          ? 'text-white stage-active'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                      }`}
                      style={{
                        backgroundColor: isCompleted || isCurrent ? ACCENT : undefined,
                        color: isCurrent ? ACCENT : undefined,
                      }}
                    >
                      {stage.icon}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:block ${
                      isCurrent ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                    }`}>
                      {locale === 'ka' ? stage.labelKa : stage.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${project.progress}%`, backgroundColor: ACCENT }}
              >
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent progress-bar-shine" />
              </div>
            </div>
            <span className="font-mono text-sm font-bold" style={{ color: ACCENT }}>
              {project.progress}%
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
          {/* Started Date */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === 'ka' ? 'დაწყება' : 'Started'}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
              {project.startedAt ? formatDate(project.startedAt, locale) : formatDate(project.hiredAt, locale)}
            </span>
          </div>

          {/* Expected End */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === 'ka' ? 'დასრულება' : 'Due'}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
              {project.expectedEndDate
                ? formatDate(project.expectedEndDate, locale)
                : project.estimatedDuration
                  ? `${project.estimatedDuration} ${project.estimatedDurationUnit || 'days'}`
                  : '—'}
            </span>
          </div>

          {/* Agreed Price */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === 'ka' ? 'თანხა' : 'Budget'}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold" style={{ color: ACCENT }}>
              {project.agreedPrice
                ? `₾${project.agreedPrice.toLocaleString()}`
                : job.budgetAmount
                  ? `₾${job.budgetAmount.toLocaleString()}`
                  : job.budgetMin && job.budgetMax
                    ? `₾${job.budgetMin.toLocaleString()}-${job.budgetMax.toLocaleString()}`
                    : locale === 'ka' ? 'შეთანხმებით' : 'TBD'}
            </span>
          </div>
        </div>

        {/* Activity Section */}
        <div className="px-4 sm:px-5 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-neutral-500">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">{project.comments?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-500">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm font-medium">{project.attachments?.length || 0}</span>
                </div>
              </div>
              {project.comments?.length > 0 && (
                <span className="text-xs text-neutral-400">
                  {locale === 'ka' ? 'ბოლო:' : 'Last:'} {formatRelativeTime(project.comments[project.comments.length - 1].createdAt, locale)}
                </span>
              )}
            </div>
            <ChevronRight
              className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Comments */}
              {project.comments?.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {project.comments.slice(-5).map((comment, idx) => (
                    <div key={idx} className="flex gap-3">
                      <Avatar
                        src={comment.userAvatar}
                        name={comment.userName}
                        size="sm"
                        className="w-8 h-8 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">
                            {comment.userName}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
                            style={{
                              backgroundColor: comment.userRole === 'pro' ? `${ACCENT}20` : '#3B82F620',
                              color: comment.userRole === 'pro' ? ACCENT : '#3B82F6'
                            }}
                          >
                            {comment.userRole === 'pro'
                              ? (locale === 'ka' ? 'პრო' : 'PRO')
                              : (locale === 'ka' ? 'კლიენტი' : 'CLIENT')}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {formatRelativeTime(comment.createdAt, locale)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder={locale === 'ka' ? 'დაწერე კომენტარი...' : 'Write a comment...'}
                  className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ '--tw-ring-color': ACCENT } as any}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Attachments Preview */}
              {project.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.attachments.slice(-4).map((attachment, idx) => (
                    <a
                      key={idx}
                      href={storage.getFileUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate max-w-[100px]">
                        {attachment.fileName}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-4 sm:px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
          <Link
            href={`/messages?job=${job._id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {locale === 'ka' ? 'მესიჯი' : 'Message'}
          </Link>

          <Link
            href={`/jobs/${job._id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            {locale === 'ka' ? 'დეტალები' : 'View Details'}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stage Change Modal */}
      {showStageModal && !isClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStageModal(false)}
          />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {locale === 'ka' ? 'სტატუსის განახლება' : 'Update Stage'}
              </h3>
              <button
                onClick={() => setShowStageModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const canSelect = index > currentStageIndex || isCurrent;

                return (
                  <button
                    key={stage.key}
                    onClick={() => canSelect && handleStageChange(stage.key)}
                    disabled={!canSelect || isSubmitting}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? 'ring-2'
                        : canSelect
                        ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? `${ACCENT}10` : undefined,
                      ['--tw-ring-color' as any]: ACCENT,
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted || isCurrent ? 'text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                      }`}
                      style={{ backgroundColor: isCompleted || isCurrent ? ACCENT : undefined }}
                    >
                      {stage.icon}
                    </div>
                    <span className={`font-medium ${
                      isCurrent ? '' : 'text-neutral-600 dark:text-neutral-400'
                    }`} style={{ color: isCurrent ? ACCENT : undefined }}>
                      {locale === 'ka' ? stage.labelKa : stage.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                        {locale === 'ka' ? 'მიმდინარე' : 'Current'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
