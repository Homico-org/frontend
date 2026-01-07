import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import PortfolioCompletionModal from './PortfolioCompletionModal';

const meta: Meta<typeof PortfolioCompletionModal> = {
  title: 'Projects/PortfolioCompletionModal',
  component: PortfolioCompletionModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
    isLoading: {
      control: 'boolean',
    },
    isUploading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PortfolioCompletionModal>;

// Interactive wrapper for stories
const PortfolioCompletionModalWrapper = ({
  locale = 'en',
  initialImages = [] as string[],
}: {
  locale?: string;
  initialImages?: string[];
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [images, setImages] = useState<string[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsOpen(false);
    alert(`Project completed!\nPortfolio images: ${images.length}`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate adding mock image URLs
    const newImages = Array.from(files).map(
      (_, i) => `mock-image-${Date.now()}-${i}.jpg`
    );
    setImages((prev) => [...prev, ...newImages]);
    setIsUploading(false);
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setImages([]);
          }}
          className="px-4 py-2 bg-[#C4735B] text-white rounded-lg hover:bg-[#B5624A] transition-colors"
        >
          Open Portfolio Completion Modal
        </button>
      )}
      <PortfolioCompletionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
        isLoading={isLoading}
        locale={locale}
        portfolioImages={images}
        onImagesChange={setImages}
        isUploading={isUploading}
        onUpload={handleUpload}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <PortfolioCompletionModalWrapper />,
};

export const GeorgianLocale: Story = {
  render: () => <PortfolioCompletionModalWrapper locale="ka" />,
};

export const WithImages: Story = {
  render: () => (
    <PortfolioCompletionModalWrapper
      initialImages={[
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600573472591-ee6e1e51b0e3?w=300&h=300&fit=crop',
      ]}
    />
  ),
};

export const Uploading: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onComplete: () => {},
    isLoading: false,
    locale: 'en',
    portfolioImages: [],
    onImagesChange: () => {},
    isUploading: true,
    onUpload: () => {},
  },
};

export const Completing: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onComplete: () => {},
    isLoading: true,
    locale: 'en',
    portfolioImages: ['image1.jpg', 'image2.jpg'],
    onImagesChange: () => {},
    isUploading: false,
    onUpload: () => {},
  },
};

export const Empty: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onComplete: () => {},
    isLoading: false,
    locale: 'en',
    portfolioImages: [],
    onImagesChange: () => {},
    isUploading: false,
    onUpload: () => {},
  },
};

export const ManyImages: Story = {
  render: () => (
    <PortfolioCompletionModalWrapper
      initialImages={[
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600573472591-ee6e1e51b0e3?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=300&h=300&fit=crop',
      ]}
    />
  ),
};

export const GeorgianWithImages: Story = {
  render: () => (
    <PortfolioCompletionModalWrapper
      locale="ka"
      initialImages={[
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=300&fit=crop',
      ]}
    />
  ),
};
