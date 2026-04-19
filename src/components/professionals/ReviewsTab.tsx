"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tabs } from "@/components/ui/Tabs";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  MessageCircle,
  Send,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReviewItem, { RatingSummary, Review } from "./ReviewItem";

type ReviewFilter = "all" | "homico" | "external";

export interface ReviewsTabProps {
  /** List of reviews */
  reviews: Review[];
  /** Average rating */
  avgRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Handler when a photo is clicked */
  onPhotoClick?: (photo: string) => void;
  /** Locale for translations */
  locale?: "en" | "ka" | "ru";
  /** Whether the current user is the profile owner */
  isOwner?: boolean;
  /** Pro ID for leaving reviews */
  proId?: string;
  /** Pro name for the modal */
  proName?: string;
  /** Callback after a new review is submitted */
  onReviewSubmitted?: () => void;
}

export default function ReviewsTab({
  reviews,
  avgRating,
  totalReviews,
  onPhotoClick,
  locale = "en",
  isOwner = false,
  proId,
  proName,
  onReviewSubmitted,
}: ReviewsTabProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [reviewLink, setReviewLink] = useState<string>("");
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showRequestSection, setShowRequestSection] = useState(false);
  const [reviewLinkError, setReviewLinkError] = useState(false);

  // Leave Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerPhone, setReviewerPhone] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Check if user's phone is already verified (pros always have verified phone, or user has phone in profile)
  const isPhoneVerified = user?.isPhoneVerified || user?.role === "pro" || !!user?.phone;

  // Check if current user has already left a review
  const hasUserReviewed = useMemo(() => {
    if (!user?.id) return false;
    const userId = user.id;
    const userPhone = user.phone;
    
    return reviews.some((review) => {
      // Check by clientId (for reviews left by logged-in users)
      const reviewClientId = review.clientId?.id || review.clientId?._id;
      if (reviewClientId && String(reviewClientId) === String(userId)) {
        return true;
      }
      // Check by phone (for external reviews)
      if (userPhone && review.externalClientPhone === userPhone) {
        return true;
      }
      return false;
    });
  }, [reviews, user?.id, user?.phone]);

  // Fetch review link when owner opens the section
  const fetchReviewLink = useCallback(async () => {
    if (!isOwner || reviewLink) return;
    setIsLinkLoading(true);
    setReviewLinkError(false);
    try {
      const res = await api.get("/reviews/request-link");
      setReviewLink(res.data.link);
    } catch (err) {
      console.error("Failed to fetch review link:", err);
      setReviewLinkError(true);
      toast.error(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsLinkLoading(false);
    }
  }, [isOwner, reviewLink]);

  useEffect(() => {
    if (showRequestSection && !reviewLink) {
      fetchReviewLink();
    }
  }, [showRequestSection, reviewLink, fetchReviewLink]);

  // Copy link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      setIsCopied(true);
      toast.success(t("common.success"), t("reviews.linkCopied"));
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast.error(t("common.error"), t("common.tryAgain"));
    }
  };

  // Send invitation
  const sendInvitation = async () => {
    if (!invitePhone.trim()) {
      toast.error(t("common.error"), t("common.required"));
      return;
    }

    setIsSendingInvite(true);
    try {
      await api.post("/reviews/send-invitation", {
        phone: invitePhone.trim(),
        name: inviteName.trim() || undefined,
      });
      toast.success(t("common.success"), t("reviews.invitationSent"));
      setInvitePhone("");
      setInviteName("");
    } catch (err: any) {
      const message = err.response?.data?.message || t("common.error");
      toast.error(t("common.error"), message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Share on WhatsApp
  const shareOnWhatsApp = () => {
    const message = `${t("reviews.leaveReview")}: ${reviewLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Submit review
  const submitReview = async () => {
    if (!isAuthenticated) {
      toast.error(t("common.error"), t("reviews.loginRequired"));
      return;
    }

    if (reviewRating === 0) {
      toast.error(t("common.error"), t("reviews.pleaseSelectRating"));
      return;
    }

    // Phone is required for non-verified users
    if (!isPhoneVerified && !reviewerPhone.trim()) {
      toast.error(t("common.error"), t("reviews.phoneRequired"));
      return;
    }

    if (!proId) return;

    setIsSubmittingReview(true);
    try {
      await api.post(`/reviews/external/direct/${proId}`, {
        rating: reviewRating,
        text: reviewText.trim() || undefined,
        phone: !isPhoneVerified ? reviewerPhone.trim() : undefined,
      });

      toast.success(t("reviews.thankYou"), t("reviews.reviewSubmitted"));
      setShowReviewModal(false);

      // Reset form
      setReviewRating(0);
      setReviewText("");
      setReviewerPhone("");

      // Refresh reviews list
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || t("reviews.failedToSubmit");
      toast.error(t("common.error"), message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Get rating label
  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return t("reviews.ratingExcellent");
      case 4:
        return t("reviews.ratingVeryGood");
      case 3:
        return t("reviews.ratingGood");
      case 2:
        return t("reviews.ratingFair");
      case 1:
        return t("reviews.ratingPoor");
      default:
        return "";
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    if (filter === "homico") return review.source !== "external";
    if (filter === "external") return review.source === "external";
    return true;
  });

  // Count by source
  const homicoCount = reviews.filter((r) => r.source !== "external").length;
  const externalCount = reviews.filter((r) => r.source === "external").length;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-4">
        {/* Leave Review Button - for logged-in non-owners who haven't reviewed yet */}
        {!isOwner && proId && isAuthenticated && !hasUserReviewed && (
          <Button
            onClick={() => setShowReviewModal(true)}
            className="w-full sm:w-auto bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t("reviews.leaveReview")}
          </Button>
        )}

        {/* Owner: Request Reviews Section */}
        {isOwner && (
          <div className="bg-gradient-to-br from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 rounded-2xl border border-[var(--hm-brand-500)]/20 overflow-hidden">
            <div className="w-full flex items-center justify-between gap-3 p-4">
              <button
                onClick={() => setShowRequestSection(!showRequestSection)}
                className="flex-1 flex items-center justify-between hover:bg-[var(--hm-brand-500)]/5 transition-colors rounded-xl px-2 py-1"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--hm-brand-500)] p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-[var(--hm-fg-primary)]">
                      {t("reviews.requestReviews")}
                    </h3>
                    <p className="text-xs text-[var(--hm-fg-muted)]">
                      {t("reviews.shareWithClients")}
                    </p>
                  </div>
                </div>
                <div
                  className={`transition-transform duration-200 ${showRequestSection ? "rotate-180" : ""}`}
                >
                  <svg
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/pro/reviews")}
                className="shrink-0"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("common.open")}
              </Button>
            </div>

            {showRequestSection && (
              <div className="px-4 pb-4 space-y-3">
                {/* Review Link */}
                <div className="bg-[var(--hm-bg-elevated)] rounded-xl p-3">
                  <label className="block text-xs font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                    {t("reviews.yourReviewLink")}
                  </label>
                  {isLinkLoading ? (
                    <div className="flex justify-center py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={reviewLink}
                        readOnly
                        inputSize="sm"
                        className="flex-1 font-mono text-xs"
                      />
                      {!reviewLink && reviewLinkError && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchReviewLink}
                          className="shrink-0"
                        >
                          {t("common.tryAgain")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyLink}
                        className="shrink-0"
                        disabled={!reviewLink}
                      >
                        {isCopied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={shareOnWhatsApp}
                        className="shrink-0 hidden sm:flex"
                        disabled={!reviewLink}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Send SMS */}
                <div className="bg-[var(--hm-bg-elevated)] rounded-xl p-3">
                  <label className="block text-xs font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                    {t("reviews.sendInvitationSms")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("reviews.clientName")}
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      inputSize="sm"
                      className="flex-1"
                    />
                    <Input
                      type="tel"
                      placeholder="+995 555 ..."
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      inputSize="sm"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={sendInvitation}
                      disabled={isSendingInvite || !invitePhone.trim()}
                      className="shrink-0 bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
                    >
                      {isSendingInvite ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rating Summary */}
        {avgRating > 0 && (
          <RatingSummary
            avgRating={avgRating}
            totalReviews={totalReviews}
            locale={locale}
          />
        )}

        {/* Filter Tabs */}
        {reviews.length > 0 && (
          <Tabs
            variant="default"
            activeTab={filter}
            onChange={(id) => setFilter(id as ReviewFilter)}
            tabs={[
              { id: "all", label: t("common.all"), badge: reviews.length },
              { id: "homico", label: "Homico", icon: <ShieldCheck className="w-3.5 h-3.5" />, badge: homicoCount },
              { id: "external", label: t("reviews.external"), icon: <Globe className="w-3.5 h-3.5" />, badge: externalCount },
            ]}
          />
        )}

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            locale={locale}
            onPhotoClick={onPhotoClick}
          />
          ))
        ) : reviews.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--hm-fg-muted)] text-sm">
              {filter === "homico"
                ? t("professional.noHomicoReviews")
                : t("professional.noExternalReviews")}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)]">
            <Star className="w-10 h-10 text-[var(--hm-fg-muted)] mx-auto mb-3" />
            <p className="text-[var(--hm-fg-muted)] text-sm mb-1">
              {t("professional.noReviewsYet")}
            </p>
            {!isOwner && proId && isAuthenticated && !hasUserReviewed && (
              <Button
                onClick={() => setShowReviewModal(true)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("reviews.leaveReview")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Leave Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        size="md"
      >
        <ModalHeader
          title={t("reviews.leaveReview")}
          description={proName}
          variant="accent"
        />
        <ModalBody>
          {/* User info - prefilled */}
          <div className="flex items-center gap-3 p-3 bg-[var(--hm-bg-tertiary)] rounded-lg mb-4">
            <div className="w-10 h-10 bg-[var(--hm-brand-500)] rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium text-[var(--hm-fg-primary)] text-sm">
                {user?.name}
              </p>
              {isPhoneVerified && (
                <p className="text-xs text-[var(--hm-success-500)] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t("reviews.verifiedUser")}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
              {t("reviews.rating")} <span className="text-[var(--hm-error-500)]">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (reviewHoverRating || reviewRating)
                        ? "text-[var(--hm-warning-500)] fill-amber-400"
                        : "text-[var(--hm-fg-muted)]"
                    }`}
                  />
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <p className="text-xs text-[var(--hm-fg-muted)] mt-1">
                {getRatingLabel(reviewRating)}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t("reviews.yourReview")}
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t("reviews.describeExperience")}
              rows={3}
            />
          </div>

          {/* Phone Number - only for non-verified users */}
          {!isPhoneVerified && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                {t("reviews.phoneNumber")} <span className="text-[var(--hm-error-500)]">*</span>
              </label>
              <Input
                type="tel"
                value={reviewerPhone}
                onChange={(e) => setReviewerPhone(e.target.value)}
                placeholder="+995 555 ..."
              />
              <p className="text-xs text-[var(--hm-fg-muted)] mt-1">
                {t("reviews.phoneVerificationNote")}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowReviewModal(false)}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submitReview}
            disabled={isSubmittingReview || reviewRating === 0}
            className="flex-1 bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
          >
            {isSubmittingReview ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              t("reviews.submitReview")
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
