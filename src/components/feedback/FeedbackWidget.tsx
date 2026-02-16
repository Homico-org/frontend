'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Bug, Lightbulb, MessageSquare, ChevronLeft, ChevronRight, Send, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea, Input } from '@/components/ui/input';
import { SelectionGroup, type SelectionOption } from '@/components/ui/SelectionGroup';
import { ConfirmModal } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ACCENT_COLOR } from '@/constants/theme';
import { cn } from '@/lib/utils';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
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

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktopPanel = panelRef.current?.contains(target);
      const inMobilePanel = mobilePanelRef.current?.contains(target);
      const inTab = tabRef.current?.contains(target);
      if (!inDesktopPanel && !inMobilePanel && !inTab) {
        requestClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, requestClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, requestClose]);

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
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[51] lg:hidden"
          onClick={requestClose}
        />
      )}

      {/* Desktop: Tab (always visible, outside the sliding container) */}
      <button
        ref={tabRef}
        onClick={() => (isOpen ? requestClose() : setIsOpen(true))}
        className={cn(
          'hidden lg:flex fixed z-[45] top-[70%] -translate-y-1/2 w-8 h-24 items-center justify-center rounded-l-lg cursor-pointer transition-all duration-300 shadow-md',
          isOpen ? 'right-[360px]' : 'right-0',
        )}
        style={{
          backgroundColor: ACCENT_COLOR,
          color: '#fff',
        }}
        aria-label={t('feedback.title')}
      >
        <div className="flex flex-col items-center gap-1">
          {isOpen ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
          <span
            className="text-[11px] font-semibold tracking-wide"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {t('feedback.title')}
          </span>
        </div>
      </button>

      {/* Desktop panel */}
      <div
        ref={panelRef}
        className={cn(
          'hidden lg:flex lg:flex-col fixed z-[45] top-0 bottom-0 right-0 w-[360px] border-l border-[var(--color-border-subtle)] shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
      >
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
      </div>

      {/* Mobile bottom sheet */}
      <div
        ref={mobilePanelRef}
        className={cn(
          'fixed z-[51] lg:hidden left-0 right-0 bottom-0 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none',
        )}
      >
        <div
          className="rounded-t-2xl border-t border-[var(--color-border-subtle)] shadow-2xl max-h-[85vh] flex flex-col"
          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
          </div>
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
        </div>
      </div>

      {/* Mobile trigger button — positioned above the AI chat FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed lg:hidden bottom-36 right-4 z-[39] w-11 h-11 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: ACCENT_COLOR, color: '#fff' }}
          aria-label={t('feedback.title')}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

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
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t('feedback.submitted')}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] text-center">
          {t('feedback.submittedMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {t('feedback.title')}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
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
            <p className="text-xs text-red-500 mt-1">
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
      <div className="px-5 py-4 border-t border-[var(--color-border-subtle)]">
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
