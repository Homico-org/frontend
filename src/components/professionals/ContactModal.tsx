'use client';

import { useState } from 'react';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';

import { useLanguage } from "@/contexts/LanguageContext";
export interface ContactModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Send message handler */
  onSend: (message: string) => Promise<void>;
  /** Professional's name */
  name: string;
  /** Professional's title */
  title: string;
  /** Professional's avatar URL */
  avatar?: string;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
}

export default function ContactModal({
  isOpen,
  onClose,
  onSend,
  name,
  title,
  avatar,
  locale = 'en',
}: ContactModalProps) {
  const [message, setMessage] = useState('');

  const { t } = useLanguage();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await onSend(message);
      setMessage('');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-1 pb-3">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <Avatar src={avatar} name={name} size="md" className="sm:w-12 sm:h-12" />
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
              {name}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 truncate">{title}</p>
          </div>
        </div>

        {/* Message textarea */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            t('professional.writeAMessage')
          }
          rows={3}
          className="text-sm sm:text-base"
        />

        {/* Actions */}
        <div className="flex gap-2 mt-3 sm:mt-4 pb-2 sm:pb-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 h-10 sm:h-11 text-sm"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            loading={isSending}
            className="flex-1 h-10 sm:h-11 text-sm"
          >
            {t('common.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
