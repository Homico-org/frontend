'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { storage } from '@/services/storage';
import { Image as ImageIcon, Plus, Trash2, Type, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useLanguage } from "@/contexts/LanguageContext";
interface PollOptionInput {
  id: string;
  text: string;
  imageUrl?: string;
  imageFile?: File;
  imagePreview?: string;
}

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; options: { text?: string; imageUrl?: string }[] }) => Promise<void>;
  locale: string;
}

export default function CreatePollModal({
  isOpen,
  onClose,
  onSubmit,
  locale,
}: CreatePollModalProps) {
  const [title, setTitle] = useState('');

  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [optionType, setOptionType] = useState<'text' | 'image'>('image');
  const [options, setOptions] = useState<PollOptionInput[]>([
    { id: '1', text: '', imageUrl: '' },
    { id: '2', text: '', imageUrl: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: Date.now().toString(), text: '', imageUrl: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the shared axios client so the request goes through the auth
      // interceptor (handles 401 refresh, base URL, global error mapping)
      // instead of the raw fetch that silently bypassed all of that.
      const response = await api.post('/upload', formData);
      const data = response.data;

      const newOptions = [...options];
      // Revoke the previous blob URL before overwriting, otherwise each
      // re-upload leaks a megabyte+ of browser memory until the tab is
      // closed. The on-unmount effect below handles the final cleanup.
      const previous = newOptions[index].imagePreview;
      if (previous) URL.revokeObjectURL(previous);
      newOptions[index].imageUrl = data.url || data.path;
      newOptions[index].imagePreview = URL.createObjectURL(file);
      setOptions(newOptions);
    } catch (err) {
      setError(t('polls.failedToUploadImage'));
    } finally {
      setUploadingIndex(null);
    }
  };

  // Revoke any remaining object URLs on unmount so the leaked blob handles
  // get released. Without this, every closed-without-saving modal session
  // keeps the uploaded preview images pinned in browser memory.
  useEffect(() => {
    return () => {
      options.forEach((o) => {
        if (o.imagePreview) URL.revokeObjectURL(o.imagePreview);
      });
    };
    // We intentionally only want this to run on unmount, not on every
    // options change - per-upload cleanup is handled inline above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allowed image types (no SVG, no PDF)
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif';

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type explicitly (reject SVG, PDF, etc.)
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(t('polls.onlyJpgPngWebpAnd'));
        // Reset input
        e.target.value = '';
        return;
      }
      handleImageUpload(index, file);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError(t('polls.titleIsRequired'));
      return;
    }

    const validOptions = options.filter(opt =>
      optionType === 'image' ? opt.imageUrl : opt.text.trim()
    );

    if (validOptions.length < 2) {
      setError(t('polls.atLeast2OptionsAre'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        // Send ONLY the field that matches the current optionType.
        // Previously we sent both text and imageUrl whenever either was
        // populated, so a user who typed text then switched to image
        // mode then uploaded would submit options with both fields
        // set. PollCard's `hasImages` check then forced image-mode
        // render and the text payload was wasted DB space.
        options: validOptions.map(opt => ({
          text: optionType === 'text' ? opt.text.trim() || undefined : undefined,
          imageUrl: optionType === 'image' ? opt.imageUrl || undefined : undefined,
        })),
      });

      // Reset form
      setTitle('');
      setDescription('');
      setOptions([
        { id: '1', text: '', imageUrl: '' },
        { id: '2', text: '', imageUrl: '' },
      ]);
      onClose();
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || (t('common.error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    // Reset form state on close so reopening shows a fresh modal
    // instead of leftover text + uploaded images from a half-finished
    // previous session. Also revoke any blob URLs we own to release
    // the browser memory.
    options.forEach((o) => {
      if (o.imagePreview) URL.revokeObjectURL(o.imagePreview);
    });
    setTitle('');
    setDescription('');
    setOptions([
      { id: '1', text: '', imageUrl: '' },
      { id: '2', text: '', imageUrl: '' },
    ]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" preventClose={isSubmitting} showCloseButton>
      <ModalHeader
        title={t('polls.newPoll')}
        description={t('polls.createAPollForClient')}
        variant="accent"
        icon={<ImageIcon className="w-6 h-6 text-[var(--hm-brand-500)]" />}
      />

      <ModalBody className="max-h-[45vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <Alert variant="error" size="sm" showIcon={false}>{error}</Alert>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('polls.title')} *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('polls.egColorPaletteForLiving')}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('common.description')} ({t('common.optional')})
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('polls.additionalInformation')}
              textareaSize="sm"
            />
          </div>

          {/* Option type toggle */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
              {t('polls.optionType')}
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={optionType === 'image' ? 'outline' : 'secondary'}
                onClick={() => {
                  // Switching modes: clear the now-irrelevant field on
                  // each option so what the user sees matches what
                  // will be submitted. Revoke blob URLs we no longer
                  // own to keep memory tidy.
                  if (optionType !== 'image') {
                    setOptions((prev) =>
                      prev.map((o) => ({ ...o, text: '' })),
                    );
                  }
                  setOptionType('image');
                }}
                className={cn(
                  'flex-1',
                  optionType === 'image' && 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/5 text-[var(--hm-brand-500)]'
                )}
                leftIcon={<ImageIcon className="w-4 h-4" />}
              >
                {t('polls.image')}
              </Button>
              <Button
                type="button"
                variant={optionType === 'text' ? 'outline' : 'secondary'}
                onClick={() => {
                  if (optionType !== 'text') {
                    setOptions((prev) =>
                      prev.map((o) => {
                        if (o.imagePreview) URL.revokeObjectURL(o.imagePreview);
                        return { ...o, imageUrl: '', imagePreview: undefined };
                      }),
                    );
                  }
                  setOptionType('text');
                }}
                className={cn(
                  'flex-1',
                  optionType === 'text' && 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/5 text-[var(--hm-brand-500)]'
                )}
                leftIcon={<Type className="w-4 h-4" />}
              >
                {t('polls.text')}
              </Button>
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--hm-fg-secondary)]">
                {t('polls.options')} ({options.length}/6)
              </label>
              {options.length < 6 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleAddOption}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t('common.add')}
                </Button>
              )}
            </div>

            <div className={cn(
              'grid gap-3',
              optionType === 'image' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'
            )}>
              {options.map((option, index) => (
                <div key={option.id} className="relative group">
                  {optionType === 'image' ? (
                    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-[var(--hm-border-strong)] overflow-hidden relative">
                      {option.imageUrl || option.imagePreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-served + onError fallback; next/image conversion deferred until perf audit. */}
                          <img
                            src={option.imagePreview || storage.getFileUrl(option.imageUrl || '')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              const newOptions = [...options];
                              newOptions[index].imageUrl = '';
                              newOptions[index].imagePreview = '';
                              setOptions(newOptions);
                            }}
                            className="absolute top-2 right-2 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-[var(--hm-fg-secondary)]" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="absolute inset-0 flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] h-full w-full rounded-lg"
                        >
                          {uploadingIndex === index ? (
                            <LoadingSpinner size="md" color="currentColor" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mb-1" />
                              <span className="text-xs">
                                {t('polls.upload')}
                              </span>
                            </>
                          )}
                        </Button>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el; }}
                        type="file"
                        accept={ALLOWED_EXTENSIONS}
                        className="hidden"
                        onChange={(e) => handleFileSelect(index, e)}
                      />

                      {/* Label input for image */}
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={t('polls.label')}
                        className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/50 text-white text-xs placeholder:text-white/50 border-0 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={`${t('polls.option')} ${index + 1}`}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Remove button for image options */}
                  {optionType === 'image' && options.length > 2 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleRemoveOption(index)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-6 h-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          leftIcon={!isSubmitting ? <Plus className="w-4 h-4" /> : undefined}
        >
          {isSubmitting
            ? (t('polls.creating'))
            : (t('polls.createPoll'))}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
