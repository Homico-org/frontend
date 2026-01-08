import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import LikeButton from './LikeButton';

const meta: Meta<typeof LikeButton> = {
  title: 'Common/LikeButton',
  component: LikeButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'overlay', 'minimal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LikeButton>;

// Interactive wrapper for stateful stories
const InteractiveLikeButton = (props: Partial<React.ComponentProps<typeof LikeButton>>) => {
  const [isLiked, setIsLiked] = useState(props.isLiked || false);
  const [likeCount, setLikeCount] = useState(props.likeCount || 42);

  const handleToggle = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <LikeButton
      {...props}
      isLiked={isLiked}
      likeCount={likeCount}
      onToggle={handleToggle}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveLikeButton />,
};

export const Liked: Story = {
  render: () => <InteractiveLikeButton isLiked={true} likeCount={43} />,
};

export const Overlay: Story = {
  render: () => (
    <div className="relative w-64 h-48 rounded-xl overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
        alt="Sample"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3">
        <InteractiveLikeButton variant="overlay" likeCount={156} />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const Minimal: Story = {
  render: () => <InteractiveLikeButton variant="minimal" likeCount={24} />,
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500">Small</span>
        <InteractiveLikeButton size="sm" likeCount={12} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500">Medium</span>
        <InteractiveLikeButton size="md" likeCount={42} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500">Large</span>
        <InteractiveLikeButton size="lg" likeCount={99} />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500">Default</span>
        <InteractiveLikeButton variant="default" likeCount={42} />
      </div>
      <div className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-xl">
        <span className="text-xs text-neutral-400">Overlay</span>
        <InteractiveLikeButton variant="overlay" likeCount={156} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-neutral-500">Minimal</span>
        <InteractiveLikeButton variant="minimal" likeCount={24} />
      </div>
    </div>
  ),
};

export const NoCount: Story = {
  render: () => <InteractiveLikeButton showCount={false} />,
};

export const Disabled: Story = {
  args: {
    isLiked: false,
    likeCount: 42,
    onToggle: () => {},
    disabled: true,
  },
};

export const InCard: Story = {
  render: () => (
    <div className="w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400"
          alt="Interior"
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-3 right-3">
          <InteractiveLikeButton variant="overlay" likeCount={89} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Modern Living Room</h3>
        <p className="text-sm text-neutral-500 mt-1">Interior Design Project</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
          <span className="text-sm text-neutral-500">By Ana B.</span>
          <InteractiveLikeButton variant="minimal" size="sm" likeCount={89} />
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};
