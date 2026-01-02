import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import MediaLightbox, { useLightbox, MediaItem } from './MediaLightbox';

const meta: Meta<typeof MediaLightbox> = {
  title: 'Common/MediaLightbox',
  component: MediaLightbox,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MediaLightbox>;

// Sample images (using placeholder images)
const sampleImages: MediaItem[] = [
  {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    title: 'Kitchen Renovation',
    description: 'Modern kitchen with marble countertops',
  },
  {
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    title: 'Bathroom Remodel',
    description: 'Luxury bathroom with walk-in shower',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    title: 'Living Room',
    description: 'Spacious living area with natural light',
  },
  {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    title: 'Bedroom Design',
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    title: 'Exterior View',
  },
];

// Interactive demo wrapper
function LightboxDemo({
  images,
  ...props
}: {
  images: MediaItem[];
} & Partial<React.ComponentProps<typeof MediaLightbox>>) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div>
      {/* Gallery Grid */}
      <div className="p-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
          Click an image to open lightbox
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsOpen(true);
              }}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800"
            >
              <img
                src={img.url}
                alt={img.title || `Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-sm font-medium truncate">{img.title}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <MediaLightbox
        items={images}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onIndexChange={setCurrentIndex}
        {...props}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <LightboxDemo images={sampleImages} />,
};

export const SingleImage: Story = {
  render: () => (
    <LightboxDemo images={[sampleImages[0]]} />
  ),
};

export const WithoutThumbnails: Story = {
  render: () => (
    <LightboxDemo images={sampleImages} showThumbnails={false} />
  ),
};

export const WithoutInfo: Story = {
  render: () => (
    <LightboxDemo images={sampleImages} showInfo={false} />
  ),
};

export const WithoutCounter: Story = {
  render: () => (
    <LightboxDemo images={sampleImages} showCounter={false} />
  ),
};

export const MinimalMode: Story = {
  render: () => (
    <LightboxDemo
      images={sampleImages}
      showThumbnails={false}
      showInfo={false}
      showCounter={false}
    />
  ),
};

export const GeorgianLocale: Story = {
  render: () => (
    <LightboxDemo images={sampleImages} locale="ka" />
  ),
};

export const WithHook: Story = {
  render: () => {
    const { open, lightboxProps } = useLightbox(sampleImages);

    return (
      <div>
        <div className="p-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
            Using useLightbox hook
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {sampleImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => open(idx)}
                className="aspect-square rounded-xl overflow-hidden bg-neutral-200"
              >
                <img
                  src={img.url}
                  alt={img.title || ''}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>
        <MediaLightbox {...lightboxProps} />
      </div>
    );
  },
};

export const ManyImages: Story = {
  render: () => {
    const manyImages: MediaItem[] = Array.from({ length: 12 }, (_, i) => ({
      url: `https://images.unsplash.com/photo-${1560448204 + i * 1000}-e02f11c3d0e2?w=800&h=600&fit=crop`,
      title: `Image ${i + 1}`,
    }));
    return <LightboxDemo images={manyImages} />;
  },
};
