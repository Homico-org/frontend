'use client';

import { BadgeCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea, Label } from '@/components/ui/input';
import Avatar from '@/components/common/Avatar';
import { Modal } from '@/components/ui/Modal';
import { StarRatingInput } from '@/components/ui/StarRating';

import { useLanguage } from "@/contexts/LanguageContext";
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  locale: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  text: string;
  onTextChange: (text: string) => void;
  pro: {
    avatar?: string;
    userId?: {
      name: string;
      avatar?: string;
    };
    name?: string;
    title?: string;
  };
  /** If true, this is a completion + review flow (mandatory, can't close without submitting) */
  isCompletionFlow?: boolean;
  /** Custom title for the modal */
  customTitle?: string;
  /** Custom submit button text */
  customSubmitText?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  locale,
  rating,
  onRatingChange,
  text,
  onTextChange,
  pro,
  isCompletionFlow = false,
  customTitle,
  customSubmitText,
}: ReviewModalProps) {
  const { t } = useLanguage();
  const texts = {
    title: customTitle || (t('job.rateTheProfessional')),
    completionTitle: t('job.completeReview'),
    ratingLabel: t('job.yourRating'),
    commentLabel: t('job.yourCommentOptional'),
    placeholder: t('job.shareYourExperience'),
    cancel: t('common.cancel'),
    submit: customSubmitText || (t('common.submit')),
    completionSubmit: t('job.confirmReview'),
    mandatoryNote: t('job.aReviewIsRequiredTo'),
  };

  const title = isCompletionFlow ? texts.completionTitle : texts.title;
  const submitText = isCompletionFlow ? texts.completionSubmit : texts.submit;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={isCompletionFlow ? () => {} : onClose} 
      size="md" 
      showCloseButton={!isCompletionFlow} 
      preventClose={isSubmitting || isCompletionFlow}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          {isCompletionFlow && (
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>

      {/* Mandatory Note for Completion Flow */}
      {isCompletionFlow && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {texts.mandatoryNote}
          </p>
        </div>
      )}

      {/* Modal Content */}
      <div className="p-5 space-y-5">
        {/* Pro Info */}
        <div className="flex items-center gap-3">
          <Avatar
            src={pro.avatar || pro.userId?.avatar}
            name={pro.userId?.name || pro.name || 'Professional'}
            size="lg"
          />
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">{pro.userId?.name || pro.name || 'Professional'}</p>
            {pro.title && (
              <p className="text-sm text-neutral-500">{pro.title}</p>
            )}
          </div>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <Label>{texts.ratingLabel} <span className="text-red-500">*</span></Label>
          <StarRatingInput
            value={rating}
            onChange={onRatingChange}
            size="lg"
          />
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label>{texts.commentLabel}</Label>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={texts.placeholder}
            rows={4}
            variant="filled"
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        {!isCompletionFlow && (
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {texts.cancel}
          </Button>
        )}
        <Button
          onClick={onSubmit}
          disabled={rating < 1}
          loading={isSubmitting}
          leftIcon={!isSubmitting ? (isCompletionFlow ? <BadgeCheck className="w-4 h-4" /> : <Star className="w-4 h-4" />) : undefined}
          className={isCompletionFlow ? "w-full" : "flex-1"}
        >
          {submitText}
        </Button>
      </div>
    </Modal>
  );
}
