'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { RELEASE_NOTES } from '@/config/releaseNotes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';

// Keyed off the release version, so bumping RELEASE_NOTES.version re-shows the
// modal once to everyone. Per-device (localStorage) - the standard for a
// "what's new" announcement; no backend needed.
const SEEN_KEY = 'homi.releaseNotes.seenVersion';

/**
 * One-time "what's new" modal. Shows once per release version, never again
 * after the user closes it. Content + version live in `config/releaseNotes.ts`
 * - to announce a future release, just bump the version there. Mounted once
 * globally (ClientLayout).
 */
export default function ReleaseNotesModal() {
  const { t, pick } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!RELEASE_NOTES.items.length) return;
    if (localStorage.getItem(SEEN_KEY) === RELEASE_NOTES.version) return;
    // Small delay so the app paints first - a modal mid-load reads as a glitch.
    const id = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, RELEASE_NOTES.version);
    } catch {
      // private mode / storage disabled - just close; it may re-show next visit.
    }
    setOpen(false);
  };

  return (
    <Modal
      isOpen={open}
      onClose={dismiss}
      size="md"
      ariaLabel={pick(RELEASE_NOTES.title)}
    >
      <ModalHeader
        icon={<Megaphone className="h-5 w-5" />}
        variant="accent"
        title={pick(RELEASE_NOTES.title)}
      />
      <ModalBody>
        <div className="space-y-4">
          {RELEASE_NOTES.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--hm-brand-500) 12%, transparent)',
                    color: 'var(--hm-brand-500)',
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {pick(item.title)}
                  </p>
                  <p
                    className="mt-0.5 text-[13px] leading-relaxed"
                    style={{ color: 'var(--hm-fg-secondary)' }}
                  >
                    {pick(item.description)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="default" onClick={dismiss} className="w-full sm:w-auto">
          {t('common.gotIt')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
