import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonCard,
  SkeletonCardGrid,
  SkeletonProCard,
  SkeletonProCardGrid,
  SkeletonListItem,
  SkeletonTableRow,
} from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    className: 'h-4 w-48',
  },
};

export const Text: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonText lines={3} />
    </div>
  ),
};

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <SkeletonAvatar size="sm" />
      <SkeletonAvatar size="md" />
      <SkeletonAvatar size="lg" />
      <SkeletonAvatar size="xl" />
    </div>
  ),
};

export const Image: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonImage aspect="16/9" />
    </div>
  ),
};

export const CardDefault: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonCard />
    </div>
  ),
};

export const CardHorizontal: Story = {
  render: () => (
    <div className="w-96">
      <SkeletonCard variant="horizontal" />
    </div>
  ),
};

export const CardCompact: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonCard variant="compact" />
    </div>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="w-[900px]">
      <SkeletonCardGrid count={6} columns={3} />
    </div>
  ),
};

export const ProCard: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonProCard />
    </div>
  ),
};

export const ProCardGrid: Story = {
  render: () => (
    <div className="w-[900px]">
      <SkeletonProCardGrid count={8} columns={4} />
    </div>
  ),
};

export const ListItem: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </div>
  ),
};

export const TableRows: Story = {
  render: () => (
    <table className="w-full">
      <tbody>
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
      </tbody>
    </table>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Text Skeleton</h3>
        <SkeletonText lines={3} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Avatar Sizes</h3>
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="sm" />
          <SkeletonAvatar size="md" />
          <SkeletonAvatar size="lg" />
          <SkeletonAvatar size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Card Variants</h3>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard variant="compact" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Pro Card</h3>
        <div className="w-72">
          <SkeletonProCard />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-3">List Items</h3>
        <div className="space-y-3">
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    </div>
  ),
};
