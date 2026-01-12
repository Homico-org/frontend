'use client';

import { useState, useCallback, useEffect } from 'react';
import { Share2, Facebook, Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useLanguage } from "@/contexts/LanguageContext";
export interface ShareMenuProps {
  /** URL to share. Defaults to current page URL */
  url?: string;
  /** Title/text to share */
  title?: string;
  /** Description for native share */
  description?: string;
  /** Position of the menu relative to button */
  position?: 'top' | 'bottom';
  /** Additional class for the container */
  className?: string;
  /** Callback when link is copied */
  onCopy?: () => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom button render */
  renderButton?: (props: { onClick: () => void; isOpen: boolean }) => React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

const menuIconSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-8 h-8',
};

export default function ShareMenu({
  url,
  title = '',
  description = '',
  position = 'top',
  className = '',
  onCopy,
  locale = 'en',
  renderButton,
  size = 'md',
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useLanguage();
  const [copySuccess, setCopySuccess] = useState(false);

  const getShareUrl = useCallback(() => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  }, [url]);

  const handleShareFacebook = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const shareTitle = encodeURIComponent(title);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareTitle}`,
      'facebook-share',
      'width=600,height=400'
    );
    setIsOpen(false);
  };

  const handleShareWhatsApp = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const shareText = encodeURIComponent(title);
    window.open(`https://wa.me/?text=${shareText}%20${shareUrl}`, '_blank');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      onCopy?.();
      setTimeout(() => setCopySuccess(false), 2000);
      setIsOpen(false);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      onCopy?.();
      setTimeout(() => setCopySuccess(false), 2000);
      setIsOpen(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: getShareUrl(),
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await handleCopyLink();
    }
    setIsOpen(false);
  };

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const menuPositionClass = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  return (
    <div className={`relative ${className}`}>
      {/* Share menu dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={`absolute right-0 ${menuPositionClass} z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <button
              onClick={handleShareFacebook}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className={`${menuIconSizes[size]} rounded-full bg-[#1877F2] flex items-center justify-center`}>
                <Facebook className="w-4 h-4 text-white" />
              </div>
              <span>Facebook</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className={`${menuIconSizes[size]} rounded-full bg-[#25D366] flex items-center justify-center`}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className={`${menuIconSizes[size]} rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center`}>
                {copySuccess ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Link2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                )}
              </div>
              <span>{t('common.copyLink')}</span>
            </button>
          </div>
        </>
      )}

      {/* Share button */}
      {renderButton ? (
        renderButton({ onClick: () => setIsOpen(!isOpen), isOpen })
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${sizeClasses[size]} rounded-full shadow-lg flex items-center justify-center transition-all ${
            isOpen
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rotate-45'
              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
          }`}
          aria-label={t('common.share')}
        >
          {isOpen ? (
            <X className={iconSizes[size]} />
          ) : (
            <Share2 className={iconSizes[size]} />
          )}
        </button>
      )}
    </div>
  );
}

// Inline share buttons variant (like in job detail page)
export interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  locale?: 'en' | 'ka' | 'ru';
  onCopy?: () => void;
  className?: string;
}

export function ShareButtons({
  url,
  title,
  description = '',
  locale = 'en',
  onCopy,
  className = '',
}: ShareButtonsProps) {
  const { t } = useLanguage();
  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
      'facebook-share',
      'width=580,height=400'
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onCopy?.();
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopy?.();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        size="icon"
        onClick={handleShareFacebook}
        className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
        title="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleNativeShare}
        title={locale === 'ka' ? 'გაზიარება' : 'Share'}
      >
        <Share2 className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleCopyLink}
        title={t('common.copyLink')}
      >
        <Link2 className="w-5 h-5" />
      </Button>
    </div>
  );
}
