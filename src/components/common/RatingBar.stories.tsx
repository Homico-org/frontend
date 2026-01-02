import type { Meta, StoryObj } from '@storybook/nextjs';
import RatingBar from './RatingBar';

const meta: Meta<typeof RatingBar> = {
  title: 'Common/RatingBar',
  component: RatingBar,
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
      options: ['xs', 'sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RatingBar>;

export const Default: Story = {
  args: {
    rating: 4.5,
  },
};

export const Excellent: Story = {
  args: {
    rating: 4.9,
    reviewCount: 156,
  },
};

export const Good: Story = {
  args: {
    rating: 4.2,
    reviewCount: 47,
  },
};

export const Average: Story = {
  args: {
    rating: 3.5,
    reviewCount: 23,
  },
};

export const Poor: Story = {
  args: {
    rating: 2.5,
    reviewCount: 8,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-12">XS:</span>
        <RatingBar rating={4.5} size="xs" reviewCount={100} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-12">SM:</span>
        <RatingBar rating={4.5} size="sm" reviewCount={100} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-12">MD:</span>
        <RatingBar rating={4.5} size="md" reviewCount={100} />
      </div>
    </div>
  ),
};

export const NoValue: Story = {
  args: {
    rating: 4.5,
    showValue: false,
  },
};

export const NoReviewCount: Story = {
  args: {
    rating: 4.8,
  },
};

export const ColorScale: Story = {
  render: () => (
    <div className="space-y-3">
      <RatingBar rating={5.0} reviewCount={50} />
      <RatingBar rating={4.5} reviewCount={40} />
      <RatingBar rating={4.0} reviewCount={30} />
      <RatingBar rating={3.5} reviewCount={20} />
      <RatingBar rating={3.0} reviewCount={15} />
      <RatingBar rating={2.0} reviewCount={5} />
      <RatingBar rating={1.0} reviewCount={2} />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Overall Rating</span>
        <RatingBar rating={4.8} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Communication</span>
        <RatingBar rating={4.9} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Quality</span>
        <RatingBar rating={4.7} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Value</span>
        <RatingBar rating={4.5} size="sm" />
      </div>
    </div>
  ),
};
