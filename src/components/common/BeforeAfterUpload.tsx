'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import { ChevronRight, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

export interface BeforeAfterPair {
  before: string;
  after: string;
}

interface BeforeAfterUploadProps {
  pairs: BeforeAfterPair[];
  onPairsChange: (pairs: BeforeAfterPair[]) => void;
  uploadImage: (file: File) => Promise<string | null>;
  /** Whether to use storage.getFileUrl for display (pro detail page) */
  useStorageUrls?: boolean;
}

export default function BeforeAfterUpload({
  pairs,
  onPairsChange,
  uploadImage,
  useStorageUrls = false,
}: BeforeAfterUploadProps) {
  const { t } = useLanguage();
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [pendingBefore, setPendingBefore] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);

  const getUrl = (url: string) => useStorageUrls ? storage.getFileUrl(url) : url;

  const handleBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('before');
    try {
      const url = await uploadImage(file);
      if (url) setPendingBefore(url);
    } catch {
      // Error handled by parent
    } finally {
      setUploading(null);
      if (beforeInputRef.current) beforeInputRef.current.value = '';
    }
  };

  const handleAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingBefore) return;
    setUploading('after');
    try {
      const url = await uploadImage(file);
      if (url) {
        onPairsChange([...pairs, { before: pendingBefore, after: url }]);
        setPendingBefore(null);
      }
    } catch {
      // Error handled by parent
    } finally {
      setUploading(null);
      if (afterInputRef.current) afterInputRef.current.value = '';
    }
  };

  const removePair = (idx: number) => {
    onPairsChange(pairs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs */}
      <input ref={beforeInputRef} type="file" accept="image/*" onChange={handleBeforeUpload} className="hidden" />
      <input ref={afterInputRef} type="file" accept="image/*" onChange={handleAfterUpload} className="hidden" />

      {/* Existing pairs */}
      {pairs.map((pair, idx) => (
        <div
          key={idx}
          className="relative flex gap-3 p-3 rounded-xl bg-[var(--hm-bg-elevated)]/50 border border-[var(--hm-border)] shadow-sm"
        >
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-error-500)] bg-[var(--hm-error-50)]/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-error-400)]" />
              {t('common.before')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-[var(--hm-border)]">
              <Image src={getUrl(pair.before)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-[var(--hm-brand-500)]" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-success-500)] bg-[var(--hm-success-50)]/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-success-400)]" />
              {t('common.after')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-[var(--hm-border)]">
              <Image src={getUrl(pair.after)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <button
            onClick={() => removePair(idx)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--hm-error-500)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--hm-error-600)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Pending before or add new */}
      {pendingBefore ? (
        <div className="relative flex gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[var(--hm-warning-500)]/20">
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-warning-500)] bg-[var(--hm-warning-100)] px-2 py-0.5 rounded-full">
              ✓ {t('common.before')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-2 ring-amber-300">
              <Image src={getUrl(pendingBefore)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[var(--hm-warning-100)] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-[var(--hm-warning-500)]" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)] px-2 py-0.5">
              {t('common.after')}
            </span>
            <button
              onClick={() => afterInputRef.current?.click()}
              disabled={uploading === 'after'}
              className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-[var(--hm-warning-500)]/20 flex flex-col items-center justify-center text-[var(--hm-warning-500)] hover:bg-[var(--hm-warning-50)] transition-colors"
            >
              {uploading === 'after' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">{t('common.upload')}</span>
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => setPendingBefore(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--hm-fg-muted)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--hm-fg-secondary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Add new pair button */
        <div className="flex gap-2">
          <button
            onClick={() => beforeInputRef.current?.click()}
            disabled={uploading === 'before'}
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5 transition-all"
          >
            {uploading === 'before' ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{t('common.before')}</span>
              </>
            )}
          </button>
          <button
            disabled
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-[var(--hm-border)] flex flex-col items-center justify-center text-[var(--hm-fg-muted)]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{t('common.after')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
