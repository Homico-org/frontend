'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Bug, Lightbulb, MessageSquare, ChevronLeft, Send, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea, Input } from '@/components/ui/input';
import { SelectionGroup, type SelectionOption } from '@/components/ui/SelectionGroup';
import { ConfirmModal } from '@/components/ui/Modal';
import SidePanel from '@/components/ui/SidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ACCENT_COLOR } from '@/constants/theme';

type FeedbackType = 'bug' | 'feature' | 'general';

const HIDDEN_ROUTES = ['/admin'];

const SUBJECT_MAP: Record<FeedbackType, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  general: 'General Feedback',
};

export function FeedbackWidget() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const tabRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  const isDirty = message.trim().length > 0 || email.trim().length > 0;

  const typeOptions: SelectionOption<FeedbackType>[] = [
    { value: 'bug', label: t('feedback.bugReport'), icon: <Bug className="w-4 h-4" /> },
    { value: 'feature', label: t('feedback.featureRequest'), icon: <Lightbulb className="w-4 h-4" /> },
    { value: 'general', label: t('feedback.general'), icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const getPlaceholder = () => {
    switch (feedbackType) {
      case 'bug': return t('feedback.bugPlaceholder');
      case 'feature': return t('feedback.featurePlaceholder');
      default: return t('feedback.messagePlaceholder');
    }
  };

  const resetForm = useCallback(() => {
    setFeedbackType('general');
    setMessage('');
    setEmail('');
    setIsSubmitted(false);
  }, []);

  const forceClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsOpen(false);
    }
  }, [isDirty]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    forceClose();
  }, [forceClose]);

  // SidePanel handles click-outside and Escape

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      toast.error(t('feedback.messageTooShort'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        await api.post('/support/tickets', {
          subject: SUBJECT_MAP[feedbackType],
          category: 'feedback',
          subcategory: feedbackType,
          message: `${message.trim()}\n\n---\nPage: ${pathname}`,
          priority: 'medium',
        });
      } else {
        await api.post('/support/contact', {
          type: 'feedback',
          message: `[${SUBJECT_MAP[feedbackType]}] ${message.trim()}\n\n---\nPage: ${pathname}`,
          contactEmail: email.trim() || undefined,
        });
      }

      setIsSubmitted(true);
      toast.success(t('feedback.submitted'));

      setTimeout(() => {
        forceClose();
      }, 1500);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isHidden) return null;

  return (
    <>
      {/* Edge tab trigger — desktop */}
      {!isOpen && (
        <button
          ref={tabRef}
          onClick={() => setIsOpen(true)}
          className="hidden lg:flex fixed z-[45] top-[70%] -translate-y-1/2 right-0 w-8 items-center justify-center rounded-l-lg cursor-pointer shadow-md py-3 hover:pr-1 transition-all"
          style={{ backgroundColor: ACCENT_COLOR, color: '#fff' }}
          aria-label={t('feedback.title')}
        >
          <div className="flex flex-col items-center gap-1.5">
            <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" />
            <span
              className="text-[10px] font-semibold tracking-wide leading-tight"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {t('feedback.title')}
            </span>
          </div>
        </button>
      )}

      {/* Mobile trigger — FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed flex sm:hidden bottom-20 right-3 z-[39] w-10 h-10 rounded-full shadow-lg items-center justify-center cursor-pointer"
          style={{ backgroundColor: ACCENT_COLOR, color: '#fff' }}
          aria-label={t('feedback.title')}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      )}

      {/* Side panel — uses generic SidePanel */}
      <SidePanel isOpen={isOpen} onClose={requestClose} title={t('feedback.title')}>
        <PanelContent
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          feedbackType={feedbackType}
          setFeedbackType={setFeedbackType}
          message={message}
          setMessage={setMessage}
          email={email}
          setEmail={setEmail}
          user={user}
          typeOptions={typeOptions}
          placeholder={getPlaceholder()}
          onSubmit={handleSubmit}
          onClose={requestClose}
          t={t}
          locale={locale}
        />
      </SidePanel>

      {/* Discard confirmation */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title={t('feedback.discardTitle')}
        description={t('feedback.discardMessage')}
        icon={<AlertTriangle className="w-6 h-6" />}
        variant="danger"
        cancelLabel={t('feedback.keepEditing')}
        confirmLabel={t('feedback.discard')}
      />
    </>
  );
}

interface PanelContentProps {
  isSubmitted: boolean;
  isSubmitting: boolean;
  feedbackType: FeedbackType;
  setFeedbackType: (type: FeedbackType) => void;
  message: string;
  setMessage: (msg: string) => void;
  email: string;
  setEmail: (email: string) => void;
  user: ReturnType<typeof useAuth>['user'];
  typeOptions: SelectionOption<FeedbackType>[];
  placeholder: string;
  onSubmit: () => void;
  onClose: () => void;
  t: (key: string) => string;
  locale: string;
}

function PanelContent({
  isSubmitted,
  isSubmitting,
  feedbackType,
  setFeedbackType,
  message,
  setMessage,
  email,
  setEmail,
  user,
  typeOptions,
  placeholder,
  onSubmit,
  onClose,
  t,
  locale,
}: PanelContentProps) {
  if (isSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${ACCENT_COLOR}1A`, color: ACCENT_COLOR }}
        >
          <Send className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)]">
          {t('feedback.submitted')}
        </h3>
        <p className="text-sm text-[var(--hm-fg-secondary)] text-center">
          {t('feedback.submittedMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Form */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
            {t('feedback.selectType')}
          </label>
          <SelectionGroup
            options={typeOptions}
            value={feedbackType}
            onChange={setFeedbackType}
            layout="horizontal"
            size="sm"
            pill
            locale={locale as 'en' | 'ka' | 'ru'}
          />
        </div>

        {/* Message */}
        <div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            textareaSize="default"
            className="min-h-[120px]"
          />
          {message.length > 0 && message.trim().length < 10 && (
            <p className="text-xs text-[var(--hm-error-500)] mt-1">
              {t('feedback.messageTooShort')}
            </p>
          )}
        </div>

        {/* Email for unauthenticated users */}
        {!user && (
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('feedback.email')}
              inputSize="default"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[var(--hm-border-subtle)]">
        <Button
          onClick={onSubmit}
          disabled={message.trim().length < 10}
          loading={isSubmitting}
          className="w-full"
          leftIcon={<Send className="w-4 h-4" />}
        >
          {t('feedback.submit')}
        </Button>
      </div>
    </div>
  );
}

export default FeedbackWidget;
