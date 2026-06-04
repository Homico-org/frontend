"use client";

import ImageLightbox from "@/components/common/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tabs } from "@/components/ui/Tabs";
import { storage } from "@/services/storage";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, countries, type CountryCode } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { extractApiErrorMessage } from "@/utils/errorUtils";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { t, country } = useLanguage();
  const phonePlaceholder = `${countries[country as CountryCode]?.phonePrefix ?? '+995'} ${countries[country as CountryCode]?.placeholder ?? '5XX XXX XXX'}`;
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

  // Lightbox state for clicking review photos. Built from the
  // photos array of whichever review was clicked so left/right
  // arrows step through that single review's photos.
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Default handler when consumers don't pass their own. Build the
  // gallery from the photos of every review (so arrow nav works
  // across the whole list), then open at the clicked index. Photos
  // are resolved through `storage.getFileUrl` so the lightbox gets
  // the full https URL, not the raw object key from S3.
  const handlePhotoClick = (clickedPhoto: string) => {
    if (onPhotoClick) {
      onPhotoClick(clickedPhoto);
      return;
    }
    const all: string[] = [];
    reviews.forEach((r) => r.photos?.forEach((p) => all.push(storage.getFileUrl(p))));
    const clickedUrl = storage.getFileUrl(clickedPhoto);
    const idx = all.indexOf(clickedUrl);
    setLightbox({ images: all, index: idx >= 0 ? idx : 0 });
  };

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
  // Shared abort ref - the pro can toggle the request section open and
  // closed rapidly, and Strict Mode double-mount can fire two parallel
  // /reviews/request-link calls. Cancelling the prior request keeps the
  // state set from the latest one.
  const fetchReviewLinkAbortRef = useRef<AbortController | null>(null);
  const fetchReviewLink = useCallback(async () => {
    if (!isOwner || reviewLink) return;
    fetchReviewLinkAbortRef.current?.abort();
    const controller = new AbortController();
    fetchReviewLinkAbortRef.current = controller;
    setIsLinkLoading(true);
    setReviewLinkError(false);
    try {
      const res = await api.get("/reviews/request-link", {
        signal: controller.signal,
      });
      setReviewLink(res.data.link);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const code = (err as { code?: string })?.code;
      if (name === "CanceledError" || code === "ERR_CANCELED") return;
      console.error("Failed to fetch review link:", err);
      setReviewLinkError(true);
      toast.error(t("common.error"), t("common.tryAgain"));
    } finally {
      if (!controller.signal.aborted) {
        setIsLinkLoading(false);
      }
    }
    // `t` / `toast` are stable selectors closing over `locale` which
    // doesn't impact this fetch's semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err) {
      toast.error(t("common.error"), extractApiErrorMessage(err, t("common.error")));
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
                    <h3 className="text-sm font-semibold text-[var(--hm-fg-primary)]">
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
                      placeholder={phonePlaceholder}
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

        {/* Rating distribution histogram. Answers the silent "is the
            4.8 average from 3 glowing reviews or 300?" question that
            star-rating-alone doesn't. Five-bar pure-CSS render, no
            chart library. Shows only when there are >=3 reviews
            (smaller samples look misleading as bars). */}
        {reviews.length >= 3 && (
          <div className="space-y-1 px-3 py-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => Math.round(r.rating) === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 text-[var(--hm-fg-muted)] tabular-nums">{star}</span>
                  <Star className="w-2.5 h-2.5 fill-[var(--hm-warning-500)] text-[var(--hm-warning-500)]" />
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--hm-bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--hm-warning-500)]/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[var(--hm-fg-muted)] tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
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
            onPhotoClick={handlePhotoClick}
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
                    className="w-8 h-8 transition-colors"
                    strokeWidth={1.75}
                    style={
                      star <= (reviewHoverRating || reviewRating)
                        ? { fill: 'var(--hm-brand-500)', color: 'var(--hm-brand-500)' }
                        : { fill: 'transparent', color: 'var(--hm-border-strong)' }
                    }
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
                placeholder={phonePlaceholder}
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

      {/* Lightbox for review photos. Consumers can still pass their
          own `onPhotoClick` to override; the default falls through
          to this internal viewer. */}
      {lightbox && (
        <ImageLightbox
          isOpen={!!lightbox}
          onClose={() => setLightbox(null)}
          images={lightbox.images}
          initialIndex={lightbox.index}
        />
      )}
    </div>
  );
}
