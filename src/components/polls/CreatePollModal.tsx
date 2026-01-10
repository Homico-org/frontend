'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { storage } from '@/services/storage';
import { Image, Plus, Trash2, Type, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const newOptions = [...options];
      newOptions[index].imageUrl = data.url || data.path;
      newOptions[index].imagePreview = URL.createObjectURL(file);
      setOptions(newOptions);
    } catch (err) {
      setError(locale === 'ka' ? 'სურათის ატვირთვა ვერ მოხერხდა' : 'Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Allowed image types (no SVG, no PDF)
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif';

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type explicitly (reject SVG, PDF, etc.)
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(locale === 'ka'
          ? 'მხოლოდ JPG, PNG, WebP და GIF ფორმატებია დაშვებული'
          : 'Only JPG, PNG, WebP and GIF formats are allowed');
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
      setError(locale === 'ka' ? 'სათაური აუცილებელია' : 'Title is required');
      return;
    }

    const validOptions = options.filter(opt =>
      optionType === 'image' ? opt.imageUrl : opt.text.trim()
    );

    if (validOptions.length < 2) {
      setError(locale === 'ka' ? 'მინიმუმ 2 ვარიანტი საჭიროა' : 'At least 2 options are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions.map(opt => ({
          text: opt.text.trim() || undefined,
          imageUrl: opt.imageUrl || undefined,
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
      setError(error.message || (locale === 'ka' ? 'შეცდომა' : 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" preventClose={isSubmitting} showCloseButton>
      <ModalHeader
        title={locale === 'ka' ? 'ახალი გამოკითხვა' : 'New Poll'}
        description={locale === 'ka'
          ? 'შექმენით გამოკითხვა კლიენტის არჩევანისთვის'
          : 'Create a poll for client to choose from'}
        variant="accent"
        icon={<Image className="w-6 h-6 text-[#C4735B]" />}
      />

      <ModalBody className="max-h-[60vh] overflow-y-auto">
        <div className="space-y-5">
          {/* Error message */}
          {error && (
            <Alert variant="error" size="sm" showIcon={false}>{error}</Alert>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {locale === 'ka' ? 'სათაური' : 'Title'} *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ka' ? 'მაგ: ფერთა პალიტრა მისაღებისთვის' : 'e.g. Color Palette for Living Room'}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {locale === 'ka' ? 'აღწერა' : 'Description'} ({locale === 'ka' ? 'არასავალდებულო' : 'optional'})
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === 'ka' ? 'დამატებითი ინფორმაცია...' : 'Additional information...'}
              textareaSize="sm"
            />
          </div>

          {/* Option type toggle */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {locale === 'ka' ? 'ვარიანტების ტიპი' : 'Option Type'}
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={optionType === 'image' ? 'outline' : 'secondary'}
                onClick={() => setOptionType('image')}
                className={cn(
                  'flex-1',
                  optionType === 'image' && 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                )}
                leftIcon={<Image className="w-4 h-4" />}
              >
                {locale === 'ka' ? 'სურათი' : 'Image'}
              </Button>
              <Button
                type="button"
                variant={optionType === 'text' ? 'outline' : 'secondary'}
                onClick={() => setOptionType('text')}
                className={cn(
                  'flex-1',
                  optionType === 'text' && 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                )}
                leftIcon={<Type className="w-4 h-4" />}
              >
                {locale === 'ka' ? 'ტექსტი' : 'Text'}
              </Button>
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {locale === 'ka' ? 'ვარიანტები' : 'Options'} ({options.length}/6)
              </label>
              {options.length < 6 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleAddOption}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {locale === 'ka' ? 'დამატება' : 'Add'}
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
                    <div className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 overflow-hidden relative">
                      {option.imageUrl || option.imagePreview ? (
                        <>
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
                            className="absolute top-2 right-2 bg-white/90 dark:bg-neutral-900/90 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-neutral-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 hover:text-[#C4735B] h-full w-full rounded-xl"
                        >
                          {uploadingIndex === index ? (
                            <LoadingSpinner size="md" color="currentColor" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mb-1" />
                              <span className="text-xs">
                                {locale === 'ka' ? 'ატვირთვა' : 'Upload'}
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
                        placeholder={locale === 'ka' ? 'იარლიყი' : 'Label'}
                        className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/50 text-white text-xs placeholder:text-white/50 border-0 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={`${locale === 'ka' ? 'ვარიანტი' : 'Option'} ${index + 1}`}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-neutral-400 hover:text-red-500"
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
          {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          leftIcon={!isSubmitting ? <Plus className="w-4 h-4" /> : undefined}
        >
          {isSubmitting
            ? (locale === 'ka' ? 'იქმნება...' : 'Creating...')
            : (locale === 'ka' ? 'შექმნა' : 'Create Poll')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
