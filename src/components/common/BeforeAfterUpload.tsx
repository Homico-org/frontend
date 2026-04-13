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
          className="relative flex gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 shadow-sm"
        >
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {t('common.before')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700">
              <Image src={getUrl(pair.before)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#C4735B]/10 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-[#C4735B]" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('common.after')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700">
              <Image src={getUrl(pair.after)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <button
            onClick={() => removePair(idx)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Pending before or add new */}
      {pendingBefore ? (
        <div className="relative flex gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700">
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-100 dark:bg-amber-800/30 px-2 py-0.5 rounded-full">
              ✓ {t('common.before')}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-2 ring-amber-300 dark:ring-amber-600">
              <Image src={getUrl(pendingBefore)} alt="" fill className="object-cover" sizes="200px" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 px-2 py-0.5">
              {t('common.after')}
            </span>
            <button
              onClick={() => afterInputRef.current?.click()}
              disabled={uploading === 'after'}
              className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-600 flex flex-col items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
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
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-400 text-white flex items-center justify-center shadow-lg hover:bg-neutral-500 transition-colors"
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
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all"
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
            className="flex-1 p-4 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{t('common.after')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
