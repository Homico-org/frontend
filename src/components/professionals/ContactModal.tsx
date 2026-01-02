'use client';

import { useState } from 'react';

const ACCENT = '#C4735B';

const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
};

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
          {avatar ? (
            <img
              src={getImageUrl(avatar)}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, #A65D47 100%)`,
              }}
            >
              {name.charAt(0)}
            </div>
          )}
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
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: ACCENT }}
          >
            {isSending ? '...' : locale === 'ka' ? 'გაგზავნა' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
