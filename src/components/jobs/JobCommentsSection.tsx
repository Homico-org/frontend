"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import type { JobComment, JobCommentsResponse, CommentAuthor } from "@/types/shared";
import Link from "next/link";

interface JobCommentsSectionProps {
  jobId: string;
  clientId: string; // Job owner's ID
  isJobOwner: boolean;
}

interface CommentFormData {
  content: string;
  phoneNumber: string;
  showProfile: boolean;
  portfolioItems: string[];
}

// Comment Form Component
const CommentForm = ({
  jobId,
  parentId,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  isReply = false,
}: {
  jobId: string;
  parentId?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  initialData?: Partial<CommentFormData>;
  isEditing?: boolean;
  isReply?: boolean;
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CommentFormData>({
    content: initialData?.content || "",
    phoneNumber: initialData?.phoneNumber || "",
    showProfile: initialData?.showProfile ?? true,
    portfolioItems: initialData?.portfolioItems || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        // Update existing comment - we need commentId passed through initialData
        await api.patch(`/jobs/comments/${(initialData as any).id}`, {
          content: formData.content,
          phoneNumber: formData.phoneNumber || undefined,
          showProfile: formData.showProfile,
          portfolioItems: formData.portfolioItems,
        });
      } else {
        // Create new comment
        await api.post(`/jobs/${jobId}/comments`, {
          content: formData.content,
          phoneNumber: formData.phoneNumber || undefined,
          showProfile: formData.showProfile,
          portfolioItems: formData.portfolioItems,
          parentId,
        });
      }
      setFormData({ content: "", phoneNumber: "", showProfile: true, portfolioItems: [] });
      onSubmit();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder={isReply ? t("jobComments.replyPlaceholder") : t("jobComments.expressInterestPlaceholder")}
          className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent dark:bg-neutral-800 dark:text-white"
          rows={isReply ? 2 : 4}
          maxLength={2000}
        />
        <div className="text-xs text-neutral-400 text-right mt-1">
          {formData.content.length}/2000
        </div>
      </div>

      {!isReply && (
        <>
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t("common.phone")} ({t("common.optional")})
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+995 XXX XXX XXX"
              className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#C4735B] focus:border-transparent dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Show Profile Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showProfile}
              onChange={(e) => setFormData({ ...formData, showProfile: e.target.checked })}
              className="w-4 h-4 text-[#C4735B] rounded focus:ring-[#C4735B]"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {t("jobComments.showProfileLink")}
            </span>
          </label>
        </>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
          className="bg-[#C4735B] hover:bg-[#A85D4A] text-white"
        >
          {isSubmitting ? t("common.loading") : isEditing ? t("common.update") : isReply ? t("jobComments.reply") : t("jobComments.expressInterest")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
};

// Single Comment Component
const CommentItem = ({
  comment,
  jobId,
  isJobOwner,
  currentUserId,
  onRefresh,
  depth = 0,
}: {
  comment: JobComment;
  jobId: string;
  isJobOwner: boolean;
  currentUserId?: string;
  onRefresh: () => void;
  depth?: number;
}) => {
  const { t } = useLanguage();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const isAuthor = currentUserId === comment.authorId;
  const canDelete = isAuthor || isJobOwner;
  const canEdit = isAuthor;
  const canReply = currentUserId && depth < 1;
  const canMarkInteresting = isJobOwner && !comment.parentId;

  const author = comment.author as CommentAuthor | undefined;

  const handleDelete = async () => {
    if (!confirm(t("jobComments.confirmDelete"))) return;
    setIsDeleting(true);
    try {
      await api.delete(`/jobs/comments/${comment.id}`);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete comment", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkInteresting = async () => {
    setIsMarking(true);
    try {
      await api.post(`/jobs/comments/${comment.id}/mark-interesting`, {
        isInteresting: !comment.isMarkedInteresting,
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to mark as interesting", err);
    } finally {
      setIsMarking(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700" : ""}`}>
        <CommentForm
          jobId={jobId}
          onSubmit={() => {
            setIsEditing(false);
            onRefresh();
          }}
          onCancel={() => setIsEditing(false)}
          initialData={{
            content: comment.content,
            phoneNumber: comment.phoneNumber,
            showProfile: comment.showProfile,
            portfolioItems: comment.portfolioItems,
            id: comment.id,
          } as any}
          isEditing
        />
      </div>
    );
  }

  return (
    <div
      className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700" : ""} ${
        comment.isMarkedInteresting ? "bg-amber-50 dark:bg-amber-900/20 -mx-4 px-4 py-2 rounded-lg" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={comment.showProfile && author ? `/professionals/${comment.authorId}` : "#"}>
          <Avatar
            src={author?.avatar}
            name={author?.name || "User"}
            size="md"
            className={comment.showProfile ? "cursor-pointer hover:ring-2 hover:ring-[#C4735B]" : ""}
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-neutral-900 dark:text-white">
              {author?.name || "Anonymous"}
            </span>
            {comment.isClientReply && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                Job Owner
              </span>
            )}
            {comment.isMarkedInteresting && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Interesting
              </span>
            )}
            {author?.rating && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {author.rating.toFixed(1)}
              </span>
            )}
            <span className="text-xs text-neutral-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Content */}
          <p className="mt-1 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Phone Number */}
          {comment.phoneNumber && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${comment.phoneNumber}`} className="text-[#C4735B] hover:underline">
                {comment.phoneNumber}
              </a>
            </div>
          )}

          {/* Portfolio Items */}
          {comment.portfolioDetails && comment.portfolioDetails.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-neutral-500 mb-2">Shared Projects:</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {comment.portfolioDetails.map((item) => (
                  <Link
                    key={item._id}
                    href={`/portfolio/${item._id}`}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      {item.images?.[0] && (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 truncate max-w-[80px]">
                      {item.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Profile Link */}
          {comment.showProfile && author && (
            <Link
              href={`/professionals/${comment.authorId}`}
              className="mt-2 inline-flex items-center gap-1 text-sm text-[#C4735B] hover:underline"
            >
              View Full Profile
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-neutral-500 hover:text-[#C4735B] transition-colors"
              >
                Reply
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-neutral-500 hover:text-blue-500 transition-colors"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-neutral-500 hover:text-red-500 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            {canMarkInteresting && (
              <button
                onClick={handleMarkInteresting}
                disabled={isMarking}
                className={`flex items-center gap-1 transition-colors ${
                  comment.isMarkedInteresting
                    ? "text-amber-500"
                    : "text-neutral-500 hover:text-amber-500"
                }`}
              >
                <svg className="w-4 h-4" fill={comment.isMarkedInteresting ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {isMarking ? "..." : comment.isMarkedInteresting ? "Interesting" : "Mark Interesting"}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
                jobId={jobId}
                parentId={comment.id}
                onSubmit={() => {
                  setIsReplying(false);
                  onRefresh();
                }}
                onCancel={() => setIsReplying(false)}
                isReply
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  jobId={jobId}
                  isJobOwner={isJobOwner}
                  currentUserId={currentUserId}
                  onRefresh={onRefresh}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Comments Section Component
export default function JobCommentsSection({ jobId, clientId, isJobOwner }: JobCommentsSectionProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState<JobComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [interestingCount, setInterestingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCommented, setHasCommented] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "interesting">("all");

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get<JobCommentsResponse>(`/jobs/${jobId}/comments`);
      setComments(response.data.comments);
      setTotalCount(response.data.totalCount);
      setInterestingCount(response.data.interestingCount);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const checkHasCommented = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get<{ hasCommented: boolean }>(`/jobs/${jobId}/comments/has-commented`);
      setHasCommented(response.data.hasCommented);
    } catch (err) {
      console.error("Failed to check comment status", err);
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchComments();
    checkHasCommented();
  }, [fetchComments, checkHasCommented]);

  const filteredComments = filter === "interesting"
    ? comments.filter((c) => c.isMarkedInteresting)
    : comments;

  const isVerified = user?.verificationStatus === 'verified';
  const canComment = user && !isJobOwner && !hasCommented && isVerified;
  const showVerificationWarning = user && !isJobOwner && !hasCommented && !isVerified;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              {t("jobComments.title")}
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              {interestingCount > 0
                ? t("jobComments.subtitleWithInteresting", { total: totalCount, interesting: interestingCount })
                : t("jobComments.subtitle", { total: totalCount })}
            </p>
          </div>

          {/* Filter Tabs */}
          {interestingCount > 0 && (
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {t("common.all")}
              </button>
              <button
                onClick={() => setFilter("interesting")}
                className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  filter === "interesting"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {t("jobComments.interesting")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Form for Professionals */}
      {canComment && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          {showForm ? (
            <CommentForm
              jobId={jobId}
              onSubmit={() => {
                setShowForm(false);
                setHasCommented(true);
                fetchComments();
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full p-3 text-left text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-[#C4735B] transition-colors"
            >
              {t("jobComments.expressInterestPlaceholder")}
            </button>
          )}
        </div>
      )}

      {/* Verification Required Warning */}
      {showVerificationWarning && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                {t("jobComments.verificationRequiredToExpressInterest")}
              </p>
              <Link
                href="/settings"
                className="text-sm text-amber-700 dark:text-amber-300 underline hover:no-underline"
              >
                {t("jobComments.completeVerificationCta")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Already Commented Notice */}
      {user && !isJobOwner && hasCommented && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">
              {t("jobComments.alreadyExpressedInterest")}
            </span>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-neutral-900 dark:text-white font-medium mb-1">
              {filter === "interesting" ? t("jobComments.noInterestingYet") : t("jobComments.noInterestYet")}
            </h4>
            <p className="text-sm text-neutral-500">
              {t("jobComments.beFirstToReachOut")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                jobId={jobId}
                isJobOwner={isJobOwner}
                currentUserId={user?.id}
                onRefresh={fetchComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
