'use client';

import { Button } from '@/components/ui/button';
import AddSpaceModal from '@/components/projects/AddSpaceModal';
import ImageLightbox from '@/components/common/ImageLightbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  DoorOpen,
  ImagePlus,
  Pencil,
  Plus,
  Ruler,
  Square,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

export interface Room {
  id: string;
  name: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  wallArea?: number;
  budget?: number;
  note?: string;
  photos?: string[];
  createdAt: string;
}

interface ProjectRoomsProps {
  projectId: string;
  rooms: Room[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function ProjectRooms({
  projectId,
  rooms,
  canManage,
  onChanged,
}: ProjectRoomsProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Per-space gallery: upload target + full-screen viewer.
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoRoomId, setPhotoRoomId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  // Upload a render/photo and attach it to the chosen space (room.photos).
  const uploadRoomPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const room = rooms.find((r) => r.id === photoRoomId);
    if (!file || !room) {
      setPhotoRoomId(null);
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.patch(`/projects/${projectId}/rooms/${room.id}`, {
        photos: [...(room.photos ?? []), url],
      });
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setUploadingPhoto(false);
      setPhotoRoomId(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removeRoomPhoto = async (room: Room, url: string) => {
    try {
      await api.patch(`/projects/${projectId}/rooms/${room.id}`, {
        photos: (room.photos ?? []).filter((p) => p !== url),
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  const openAdd = () => {
    setEditingRoom(null);
    setOpen(true);
  };

  const openEdit = (r: Room) => {
    setEditingRoom(r);
    setOpen(true);
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/projects/${projectId}/rooms/${id}`);
      await onChanged();
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <DoorOpen className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.tabRooms')}
        </h2>
        {canManage && (
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
            {t('projects.roomAdd')}
          </Button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <DoorOpen className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)]">
            {t('projects.roomEmpty')}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openAdd}
            >
              {t('projects.roomAdd')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-[var(--hm-fg-primary)] min-w-0 truncate">
                  {r.name}
                </h3>
                {canManage && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      aria-label={t('common.edit')}
                      className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      disabled={busyId === r.id}
                      aria-label={t('common.delete')}
                      className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--hm-fg-muted)]">
                {!!r.area && (
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" />
                    {r.area} {t('projects.sqm')}
                  </span>
                )}
                {!!r.wallArea && (
                  <span className="inline-flex items-center gap-1.5">
                    <Square className="w-4 h-4" />
                    {r.wallArea} {t('projects.sqm')}
                  </span>
                )}
                {(r.length || r.width || r.height) && (
                  <span className="tabular-nums">
                    {[r.length, r.width, r.height]
                      .map((d) => d ?? '-')
                      .join(' × ')}
                  </span>
                )}
                {!!r.budget && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="w-4 h-4" />
                    {fmtGel(r.budget)}
                  </span>
                )}
              </div>
              {r.note && (
                <p className="text-[13px] text-[var(--hm-fg-secondary)] mt-2">
                  {r.note}
                </p>
              )}

              {/* Per-space gallery: renders / photos tied to this space. */}
              {((r.photos?.length ?? 0) > 0 || canManage) && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(r.photos ?? []).map((url, i) => (
                    <div
                      key={url}
                      className="group/photo relative aspect-square overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setLightbox({ images: r.photos ?? [], index: i })
                        }
                        className="absolute inset-0 h-full w-full"
                        aria-label={r.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={storage.getOptimizedImageUrl(url, 'feedCard')}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover/photo:opacity-90"
                        />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => removeRoomPhoto(r, url)}
                          aria-label={t('common.delete')}
                          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover/photo:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoRoomId(r.id);
                        photoInputRef.current?.click();
                      }}
                      disabled={uploadingPhoto}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--hm-border-strong)] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] disabled:opacity-60"
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span className="text-[10px] font-medium">
                        {t('projects.addPhoto')}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={uploadRoomPhoto}
      />

      {lightbox && (
        <ImageLightbox
          isOpen={!!lightbox}
          onClose={() => setLightbox(null)}
          images={lightbox.images.map((u) => storage.getFileUrl(u))}
          initialIndex={lightbox.index}
        />
      )}

      {open && (
        <AddSpaceModal
          isOpen={open}
          onClose={() => setOpen(false)}
          projectId={projectId}
          item={editingRoom ?? undefined}
          onSaved={onChanged}
        />
      )}
    </section>
  );
}
