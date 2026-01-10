'use client';

import { BadgeCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea, Label } from '@/components/ui/input';
import Avatar from '@/components/common/Avatar';
import { Modal } from '@/components/ui/Modal';
import { StarRatingInput } from '@/components/ui/StarRating';

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
  const t = {
    title: customTitle || (locale === 'ka' ? 'შეაფასეთ სპეციალისტი' : 'Rate the Professional'),
    completionTitle: locale === 'ka' ? 'დაასრულეთ და შეაფასეთ' : 'Complete & Review',
    ratingLabel: locale === 'ka' ? 'თქვენი შეფასება' : 'Your Rating',
    commentLabel: locale === 'ka' ? 'თქვენი კომენტარი (არასავალდებულო)' : 'Your Comment (Optional)',
    placeholder: locale === 'ka' ? 'დაწერეთ თქვენი გამოცდილება...' : 'Share your experience...',
    cancel: locale === 'ka' ? 'გაუქმება' : 'Cancel',
    submit: customSubmitText || (locale === 'ka' ? 'გაგზავნა' : 'Submit'),
    completionSubmit: locale === 'ka' ? 'დადასტურება და შეფასება' : 'Confirm & Review',
    mandatoryNote: locale === 'ka' 
      ? 'შეფასების დატოვება სავალდებულოა პროექტის დასასრულებლად'
      : 'A review is required to complete the project',
  };

  const title = isCompletionFlow ? t.completionTitle : t.title;
  const submitText = isCompletionFlow ? t.completionSubmit : t.submit;

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
            {t.mandatoryNote}
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
          <Label>{t.ratingLabel} <span className="text-red-500">*</span></Label>
          <StarRatingInput
            value={rating}
            onChange={onRatingChange}
            size="lg"
          />
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label>{t.commentLabel}</Label>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={t.placeholder}
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
            {t.cancel}
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
