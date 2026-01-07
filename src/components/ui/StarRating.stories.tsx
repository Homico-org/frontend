import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { StarRating, StarRatingInput, MultiStarDisplay } from './StarRating';

const meta: Meta<typeof StarRating> = {
  title: 'UI/StarRating',
  component: StarRating,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    showValue: {
      control: 'boolean',
    },
    showCount: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StarRating>;

export const Default: Story = {
  args: {
    rating: 4.8,
    showValue: true,
  },
};

export const WithReviewCount: Story = {
  args: {
    rating: 4.5,
    reviewCount: 128,
    showValue: true,
    showCount: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <StarRating rating={4.8} size="xs" showCount reviewCount={42} />
        <span className="text-xs text-neutral-500">xs</span>
      </div>
      <div className="flex items-center gap-4">
        <StarRating rating={4.8} size="sm" showCount reviewCount={42} />
        <span className="text-xs text-neutral-500">sm</span>
      </div>
      <div className="flex items-center gap-4">
        <StarRating rating={4.8} size="md" showCount reviewCount={42} />
        <span className="text-xs text-neutral-500">md</span>
      </div>
      <div className="flex items-center gap-4">
        <StarRating rating={4.8} size="lg" showCount reviewCount={42} />
        <span className="text-xs text-neutral-500">lg</span>
      </div>
    </div>
  ),
};

export const NoValue: Story = {
  args: {
    rating: 4.2,
    showValue: false,
  },
};

export const NewProfessional: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <StarRating rating={0} showValue={false} />
      <span className="text-xs text-neutral-500">New professional (no reviews)</span>
    </div>
  ),
};

export const CustomColor: Story = {
  args: {
    rating: 4.5,
    starColor: '#E07B4F',
  },
};

// Multi-star display stories
export const MultipleStars: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <MultiStarDisplay rating={5} />
        <span className="text-xs text-neutral-500">5.0</span>
      </div>
      <div className="flex items-center gap-4">
        <MultiStarDisplay rating={4.5} />
        <span className="text-xs text-neutral-500">4.5</span>
      </div>
      <div className="flex items-center gap-4">
        <MultiStarDisplay rating={3} />
        <span className="text-xs text-neutral-500">3.0</span>
      </div>
      <div className="flex items-center gap-4">
        <MultiStarDisplay rating={1.5} />
        <span className="text-xs text-neutral-500">1.5</span>
      </div>
    </div>
  ),
};

// Interactive input story
export const InteractiveInput: Story = {
  render: function RatingInputStory() {
    const [rating, setRating] = useState(3);
    return (
      <div className="flex flex-col gap-4 items-center">
        <StarRatingInput value={rating} onChange={setRating} size="lg" />
        <p className="text-sm text-neutral-500">Selected: {rating} stars</p>
      </div>
    );
  },
};

export const InputSizes: Story = {
  render: function InputSizesStory() {
    const [rating, setRating] = useState(4);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <StarRatingInput value={rating} onChange={setRating} size="xs" />
          <span className="text-xs text-neutral-500">xs</span>
        </div>
        <div className="flex items-center gap-4">
          <StarRatingInput value={rating} onChange={setRating} size="sm" />
          <span className="text-xs text-neutral-500">sm</span>
        </div>
        <div className="flex items-center gap-4">
          <StarRatingInput value={rating} onChange={setRating} size="md" />
          <span className="text-xs text-neutral-500">md</span>
        </div>
        <div className="flex items-center gap-4">
          <StarRatingInput value={rating} onChange={setRating} size="lg" />
          <span className="text-xs text-neutral-500">lg</span>
        </div>
      </div>
    );
  },
};

export const DisabledInput: Story = {
  render: () => (
    <StarRatingInput value={3} onChange={() => {}} disabled size="lg" />
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-64">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-neutral-900 dark:text-white">John Doe</span>
        <StarRating rating={4.9} reviewCount={52} showCount size="sm" />
      </div>
      <p className="text-sm text-neutral-500">Professional Plumber</p>
    </div>
  ),
};
