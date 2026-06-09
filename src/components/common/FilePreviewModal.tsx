'use client';

import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import { ExternalLink, FileText } from 'lucide-react';

export interface PreviewFile {
  name: string;
  url: string;
  fileType?: string;
}

export type FileKind = 'image' | 'pdf' | 'video' | 'audio' | 'other';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|bmp)$/i;
const PDF_EXT = /\.pdf$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac)$/i;

// Classify a file for preview. `fileType` may be a real MIME type or
// absent; we fall back to the url/name extension either way.
export function fileKind(f: { fileType?: string; url: string; name: string }): FileKind {
  const ft = f.fileType ?? '';
  const hay = `${f.url} ${f.name}`;
  if (ft.startsWith('image/') || IMAGE_EXT.test(hay)) return 'image';
  if (ft === 'application/pdf' || PDF_EXT.test(hay)) return 'pdf';
  if (ft.startsWith('video/') || VIDEO_EXT.test(hay)) return 'video';
  if (ft.startsWith('audio/') || AUDIO_EXT.test(hay)) return 'audio';
  return 'other';
}

function fileExt(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toUpperCase() : '';
}

/**
 * In-app preview for a single file. Renders pdf / video / audio / image
 * inline; for anything else (CAD, Pages, archives, ...) it shows a clean
 * fallback with an "Open file" action. Images are supported but callers
 * with multiple images usually route those to a gallery lightbox instead.
 */
export default function FilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const url = file ? storage.getFileUrl(file.url) : '';
  const kind = file ? fileKind(file) : 'other';

  return (
    <Modal
      isOpen={!!file}
      onClose={onClose}
      size="xl"
      showCloseButton
      ariaLabel={file?.name || t('projects.docPreview')}
    >
      {file && (
        <>
          <ModalHeader title={file.name} />
          <ModalBody>
            {kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={file.name}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : kind === 'pdf' ? (
              <iframe
                src={url}
                title={file.name}
                className="w-full h-[70vh] rounded-lg border border-[var(--hm-border-subtle)] bg-white"
              />
            ) : kind === 'video' ? (
              <video
                src={url}
                controls
                className="w-full max-h-[70vh] rounded-lg bg-black"
              />
            ) : kind === 'audio' ? (
              <audio src={url} controls className="w-full" />
            ) : (
              <div className="flex flex-col items-center text-center gap-3 py-10">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                  <FileText className="w-8 h-8" />
                </span>
                {fileExt(file.name) && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)]">
                    {fileExt(file.name)}
                  </span>
                )}
                <p className="text-[13px] text-[var(--hm-fg-muted)] max-w-[40ch]">
                  {t('projects.docNoPreview')}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                {t('projects.docOpenFile')}
              </a>
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
