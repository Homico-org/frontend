"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/Modal";
import type { JobComment, JobCommentsResponse, CommentAuthor } from "@/types/shared";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Phone,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Check,
} from "lucide-react";

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
      setError(err.response?.data?.message || t("jobComments.failedToSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder={isReply ? t("jobComments.replyPlaceholder") : t("jobComments.commentPlaceholder")}
          className="rounded-lg"
          rows={isReply ? 2 : 3}
          maxLength={2000}
        />
        <div className="text-xs text-[var(--hm-fg-muted)] text-right mt-1">
          {formData.content.length}/2000
        </div>
      </div>

      {error && (
        <div className="text-sm text-[var(--hm-error-500)] bg-[var(--hm-error-50)]/20 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
        >
          {isSubmitting ? t("common.loading") : isEditing ? t("common.update") : isReply ? t("jobComments.reply") : t("jobComments.addComment")}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const isAuthor = currentUserId === comment.authorId;
  const canDelete = isAuthor || isJobOwner;
  const canEdit = isAuthor;
  const canReply = currentUserId && depth < 1;
  const canMarkInteresting = isJobOwner && !comment.parentId;

  const author = comment.author as CommentAuthor | undefined;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/jobs/comments/${comment.id}`);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete comment", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
      <div className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-[var(--hm-border)]" : ""}`}>
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
      className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-[var(--hm-border)]" : ""} ${
        comment.isMarkedInteresting ? "bg-[var(--hm-warning-50)]/20 -mx-4 px-4 py-2 rounded-lg" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={comment.showProfile && author ? `/professionals/${comment.authorId}` : "#"}>
          <Avatar
            src={author?.avatar}
            name={author?.name || "User"}
            size="md"
            className={comment.showProfile ? "cursor-pointer hover:ring-2 hover:ring-[var(--hm-brand-500)]" : ""}
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[var(--hm-fg-primary)]">
              {author?.name || t("jobComments.anonymous")}
            </span>
            {comment.isClientReply && (
              <span className="px-2 py-0.5 bg-[var(--hm-info-100)]/30 text-[var(--hm-info-500)] text-xs rounded-full">
                {t("jobComments.jobOwner")}
              </span>
            )}
            {comment.isMarkedInteresting && (
              <span className="px-2 py-0.5 bg-[var(--hm-warning-100)]/30 text-[var(--hm-warning-500)] text-xs rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" fill="currentColor" />
                {t("jobComments.interesting")}
              </span>
            )}
            {author?.rating && (
              <span className="text-xs text-[var(--hm-fg-muted)] flex items-center gap-1">
                <Star className="w-3 h-3 text-[var(--hm-warning-500)]" fill="currentColor" />
                {author.rating.toFixed(1)}
              </span>
            )}
            <span className="text-xs text-[var(--hm-fg-muted)]">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Content */}
          <p className="mt-1 text-[var(--hm-fg-secondary)] whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Phone Number */}
          {comment.phoneNumber && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-[var(--hm-fg-muted)]" />
              <a href={`tel:${comment.phoneNumber}`} className="text-[var(--hm-brand-500)] hover:underline">
                {comment.phoneNumber}
              </a>
            </div>
          )}

          {/* Portfolio Items */}
          {comment.portfolioDetails && comment.portfolioDetails.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-[var(--hm-fg-muted)] mb-2">{t("jobComments.sharedProjects")}</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {comment.portfolioDetails.map((item) => (
                  <Link
                    key={item._id}
                    href={`/portfolio/${item._id}`}
                    className="flex-shrink-0 group"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--hm-bg-tertiary)]">
                      {item.images?.[0] && (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="text-xs text-[var(--hm-fg-secondary)] mt-1 truncate max-w-[80px]">
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
              className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--hm-brand-500)] hover:underline"
            >
              {t("jobComments.viewFullProfile")}
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="px-2 h-auto py-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
              >
                {t("jobComments.reply")}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="px-2 h-auto py-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-info-500)]"
              >
                {t("common.edit")}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="px-2 h-auto py-1 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
              >
                {isDeleting ? t("common.deleting") : t("common.delete")}
              </Button>
            )}
            {canMarkInteresting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkInteresting}
                disabled={isMarking}
                className={`px-2 h-auto py-1 flex items-center gap-1 ${
                  comment.isMarkedInteresting
                    ? "text-[var(--hm-warning-500)]"
                    : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-warning-500)]"
                }`}
              >
                <Star className="w-4 h-4" fill={comment.isMarkedInteresting ? "currentColor" : "none"} />
                {isMarking ? "..." : comment.isMarkedInteresting ? t("jobComments.interesting") : t("jobComments.markInteresting")}
              </Button>
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("jobComments.confirmDelete")}
        variant="danger"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        isLoading={isDeleting}
      />
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

  const isVerified = !!user?.isPhoneVerified;
  const canComment = !!user && isVerified;
  const showVerificationWarning = !!user && !isVerified && !isJobOwner;

  return (
    <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--hm-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--hm-brand-500)]" />
              {t("jobComments.title")}
            </h3>
            <p className="text-sm text-[var(--hm-fg-muted)] mt-0.5">
              {interestingCount > 0
                ? t("jobComments.subtitleWithInteresting", { total: totalCount, interesting: interestingCount })
                : t("jobComments.subtitle", { total: totalCount })}
            </p>
          </div>

          {/* Filter Tabs */}
          {interestingCount > 0 && (
            <div className="flex gap-1 bg-[var(--hm-bg-tertiary)] rounded-lg p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-sm"
                    : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]"
                }`}
              >
                {t("common.all")}
              </button>
              <button
                onClick={() => setFilter("interesting")}
                className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  filter === "interesting"
                    ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-sm"
                    : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]"
                }`}
              >
                <Star className="w-3 h-3 text-[var(--hm-warning-500)]" fill="currentColor" />
                {t("jobComments.interesting")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Form for Professionals */}
      {canComment && (
        <div className="p-4 border-b border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]/50">
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
              className="w-full p-3 text-left text-[var(--hm-fg-muted)] bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] rounded-lg hover:border-[var(--hm-brand-500)] transition-colors"
            >
              {t("jobComments.commentPlaceholder")}
            </button>
          )}
        </div>
      )}

      {/* Verification Required Warning */}
      {showVerificationWarning && (
        <div className="p-4 border-b border-[var(--hm-border)] bg-[var(--hm-warning-50)]/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--hm-warning-500)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[var(--hm-warning-500)] font-medium">
                {t("jobComments.verificationRequiredToExpressInterest")}
              </p>
              <Link
                href="/settings"
                className="text-sm text-[var(--hm-warning-500)] underline hover:no-underline"
              >
                {t("jobComments.completeVerificationCta")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Already Commented Notice */}
      {user && !isJobOwner && hasCommented && (
        <div className="p-4 border-b border-[var(--hm-border)] bg-[var(--hm-success-50)]/20">
          <div className="flex items-center gap-2 text-[var(--hm-success-500)]">
            <Check className="w-5 h-5" />
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
                <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-[var(--hm-bg-tertiary)] rounded" />
                  <div className="h-4 w-3/4 bg-[var(--hm-bg-tertiary)] rounded" />
                  <div className="h-4 w-1/2 bg-[var(--hm-bg-tertiary)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--hm-bg-tertiary)] rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />
            </div>
            <h4 className="text-[var(--hm-fg-primary)] font-medium mb-1">
              {filter === "interesting" ? t("jobComments.noInterestingYet") : t("jobComments.noInterestYet")}
            </h4>
            <p className="text-sm text-[var(--hm-fg-muted)]">
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
