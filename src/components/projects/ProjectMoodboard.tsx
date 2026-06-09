'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageLightbox from '@/components/common/ImageLightbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { ExternalLink, ImagePlus, Link2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

export interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  sourceUrl?: string;
  note?: string;
  order?: number;
  createdAt?: string;
}

interface ProjectMoodboardProps {
  projectId: string;
  items: MoodboardItem[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

// External og:image URLs (e.g. a Pinterest pin) render as-is; our own
// uploaded paths go through the storage optimizer.
const imgSrc = (url: string) =>
  /^https?:\/\//.test(url) ? url : storage.getOptimizedImageUrl(url, 'feedCard');

export default function ProjectMoodboard({
  projectId,
  items,
  canManage,
  onChanged,
}: ProjectMoodboardProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ordered = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const images = ordered.map((it) => imgSrc(it.imageUrl));

  const addFromLink = async () => {
    const url = link.trim();
    if (!url || busy) return;
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/moodboard/from-url`, { url });
      setLink('');
      await onChanged();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(t('projects.moodLinkError'), msg);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/upload', fd);
        const imageUrl = res.data?.url || res.data?.filename;
        if (imageUrl) {
          await api.post(`/projects/${projectId}/moodboard`, { imageUrl });
        }
      }
      await onChanged();
    } catch {
      toast.error(t('projects.tryAgain'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/projects/${projectId}/moodboard/${id}`);
      await onChanged();
    } catch {
      toast.error(t('projects.tryAgain'));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {canManage && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFromLink()}
              placeholder={t('projects.moodPasteLink')}
              leftIcon={<Link2 className="h-4 w-4" />}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={addFromLink}
              disabled={busy || !link.trim()}
              loading={busy}
            >
              {t('projects.moodAddFromLink')}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              leftIcon={<ImagePlus className="h-4 w-4" />}
            >
              {t('projects.moodUpload')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--hm-border-subtle)] px-6 py-16 text-center">
          <p className="font-display text-[18px] font-bold italic text-[var(--hm-fg-primary)]">
            {t('projects.moodEmptyTitle')}
          </p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] text-[var(--hm-fg-muted)]">
            {t('projects.moodEmpty')}
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 xl:columns-4 [column-fill:_balance]">
          {ordered.map((it, i) => (
            <div
              key={it.id}
              className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-[var(--hm-bg-tertiary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc(it.imageUrl)}
                alt={it.title || ''}
                loading="lazy"
                onClick={() => setLightbox(i)}
                className="w-full cursor-zoom-in transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />

              {/* Delete - top-right, reveals on hover */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={t('common.delete')}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[var(--hm-fg-secondary)] opacity-0 shadow-sm backdrop-blur transition-all hover:text-[var(--hm-error-500)] group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Title + source - bottom, reveals on hover */}
              {(it.title || it.sourceUrl) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {it.title && (
                    <p className="truncate text-[12px] font-medium text-white">
                      {it.title}
                    </p>
                  )}
                  {it.sourceUrl && (
                    <a
                      href={it.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="pointer-events-auto mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/85 transition-colors hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t('projects.moodSource')}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <ImageLightbox
          isOpen={lightbox !== null}
          onClose={() => setLightbox(null)}
          images={images}
          initialIndex={lightbox}
          ariaLabel={t('projects.tabMoodboard')}
        />
      )}
    </div>
  );
}
