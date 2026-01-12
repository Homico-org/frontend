'use client';

import { CheckCircle2, Upload, X } from 'lucide-react';
import { useRef } from 'react';
import { storage } from '@/services/storage';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';

import { useLanguage } from "@/contexts/LanguageContext";
interface PortfolioCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isLoading: boolean;
  locale: string;
  portfolioImages: string[];
  onImagesChange: (images: string[]) => void;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PortfolioCompletionModal({
  isOpen,
  onClose,
  onComplete,
  isLoading,
  locale,
  portfolioImages,
  onImagesChange,
  isUploading,
  onUpload,
}: PortfolioCompletionModalProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const texts = {
    title: t('projects.completeProject'),
    info:
      t('projects.uploadPhotosOfTheCompleted'),
    imagesLabel: t('projects.portfolioImages'),
    uploadBtn: t('projects.uploadImages'),
    cancel: t('common.cancel'),
    complete: t('projects.complete'),
  };

  const removeImage = (index: number) => {
    onImagesChange(portfolioImages.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton preventClose={isLoading}>
      {/* Modal Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {texts.title}
        </h3>
      </div>

      {/* Modal Content */}
      <div className="p-5 space-y-5">
        {/* Info text */}
        <Alert variant="info">{texts.info}</Alert>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          className="hidden"
        />

        {/* Upload area */}
        <div className="space-y-3">
          <Label optional>{texts.imagesLabel}</Label>

          {/* Uploaded images grid */}
          {portfolioImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {portfolioImages.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={storage.getFileUrl(url)}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            {isUploading ? (
              <LoadingSpinner size="md" color="currentColor" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">{texts.uploadBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          {texts.cancel}
        </Button>
        <Button
          onClick={onComplete}
          loading={isLoading}
          leftIcon={!isLoading ? <CheckCircle2 className="w-4 h-4" /> : undefined}
          className="flex-1"
        >
          {texts.complete}
        </Button>
      </div>
    </Modal>
  );
}
