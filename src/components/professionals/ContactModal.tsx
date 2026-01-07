'use client';

import { useState } from 'react';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';

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
  locale?: 'en' | 'ka';
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />

        {/* Profile header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={avatar} name={name} size="lg" />
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">
              {name}
            </p>
            <p className="text-sm text-neutral-500">{title}</p>
          </div>
        </div>

        {/* Message textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            locale === 'ka'
              ? 'დაწერეთ შეტყობინება...'
              : 'Write a message...'
          }
          className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            loading={isSending}
            className="flex-1"
          >
            {locale === 'ka' ? 'გაგზავნა' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
