'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Video } from 'lucide-react';

interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function MediaUpload({ value, onChange, maxFiles = 5, maxSizeMB = 50 }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const newMedia: MediaItem[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;

    Array.from(files).forEach((file) => {
      // Check total count
      if (value.length + newMedia.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setError(`File "${file.name}" is not a supported format`);
        return;
      }

      const preview = URL.createObjectURL(file);
      newMedia.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: isVideo ? 'video' : 'image',
        preview,
      });
    });

    if (newMedia.length > 0) {
      onChange([...value, ...newMedia]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    const item = value.find((m) => m.id === id);
    if (item) {
      URL.revokeObjectURL(item.preview);
    }
    onChange(value.filter((m) => m.id !== id));
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ease-out ${
          dragActive
            ? 'border-neutral-900 dark:border-primary-400 bg-neutral-50 dark:bg-dark-bg'
            : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-dark-border-subtle hover:bg-neutral-50 dark:hover:bg-dark-bg'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-dark-bg rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-neutral-50">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Photos or videos (max {maxSizeMB}MB each, up to {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-dark-bg group">
              {item.type === 'image' ? (
                <img
                  src={item.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={item.preview}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-neutral-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.id);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 dark:bg-dark-card/80 hover:bg-black/80 dark:hover:bg-dark-card rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out"
              >
                <svg className="w-4 h-4 text-white dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Type badge */}
              {item.type === 'video' && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="ghost" size="xs" icon={<Video className="w-3 h-3" />} className="bg-black/60 text-white">
                    Video
                  </Badge>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          {value.length < maxFiles && (
            <button
              onClick={handleClick}
              className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-dark-border-subtle hover:bg-neutral-50 dark:hover:bg-dark-bg flex items-center justify-center transition-all duration-200 ease-out"
            >
              <svg className="w-6 h-6 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
