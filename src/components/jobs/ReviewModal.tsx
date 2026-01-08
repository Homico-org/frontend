'use client';

import { Star } from 'lucide-react';
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
}: ReviewModalProps) {
  const t = {
    title: locale === 'ka' ? 'შეაფასეთ სპეციალისტი' : 'Rate the Professional',
    ratingLabel: locale === 'ka' ? 'თქვენი შეფასება' : 'Your Rating',
    commentLabel: locale === 'ka' ? 'თქვენი კომენტარი (არასავალდებულო)' : 'Your Comment (Optional)',
    placeholder: locale === 'ka' ? 'დაწერეთ თქვენი გამოცდილება...' : 'Share your experience...',
    cancel: locale === 'ka' ? 'გაუქმება' : 'Cancel',
    submit: locale === 'ka' ? 'გაგზავნა' : 'Submit',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton preventClose={isSubmitting}>
      {/* Modal Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t.title}
        </h3>
      </div>

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
          <Label>{t.ratingLabel}</Label>
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
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          {t.cancel}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={rating < 1}
          loading={isSubmitting}
          leftIcon={!isSubmitting ? <Star className="w-4 h-4" /> : undefined}
          className="flex-1"
        >
          {t.submit}
        </Button>
      </div>
    </Modal>
  );
}
