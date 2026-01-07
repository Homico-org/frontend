import type { Meta, StoryObj } from '@storybook/nextjs';
import { StatusPill, VerifiedBadge, TopRatedBadge, NewBadge } from './StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'UI/StatusPill',
  component: StatusPill,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['verified', 'topRated', 'new', 'urgent', 'applied', 'premium', 'featured', 'pending', 'completed', 'homico'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
    },
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const Default: Story = {
  args: {
    variant: 'verified',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill variant="verified" />
      <StatusPill variant="topRated" />
      <StatusPill variant="new" />
      <StatusPill variant="urgent" />
      <StatusPill variant="applied" />
      <StatusPill variant="premium" />
      <StatusPill variant="featured" />
      <StatusPill variant="pending" />
      <StatusPill variant="completed" />
      <StatusPill variant="homico" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <StatusPill variant="verified" size="xs" />
        <span className="text-xs text-neutral-500">xs</span>
      </div>
      <div className="flex items-center gap-4">
        <StatusPill variant="verified" size="sm" />
        <span className="text-xs text-neutral-500">sm</span>
      </div>
      <div className="flex items-center gap-4">
        <StatusPill variant="verified" size="md" />
        <span className="text-xs text-neutral-500">md</span>
      </div>
    </div>
  ),
};

export const GeorgianLocale: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill variant="verified" locale="ka" />
      <StatusPill variant="topRated" locale="ka" />
      <StatusPill variant="new" locale="ka" />
      <StatusPill variant="urgent" locale="ka" />
      <StatusPill variant="pending" locale="ka" />
    </div>
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill variant="verified" showIcon={false} />
      <StatusPill variant="new" showIcon={false} />
      <StatusPill variant="urgent" showIcon={false} />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: {
    variant: 'verified',
    label: 'ID Verified',
  },
};

export const ConvenienceComponents: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <VerifiedBadge />
      <TopRatedBadge />
      <NewBadge />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-72">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <VerifiedBadge size="xs" />
          <TopRatedBadge size="xs" />
        </div>
        <StatusPill variant="new" size="xs" />
      </div>
      <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">John Doe</h3>
      <p className="text-sm text-neutral-500">Professional Plumber</p>
    </div>
  ),
};

export const JobCardBadges: Story = {
  render: () => (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-72">
      <div className="flex items-center gap-1.5 mb-3">
        <StatusPill variant="new" size="xs" />
        <StatusPill variant="urgent" size="xs" />
      </div>
      <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Kitchen Renovation</h3>
      <p className="text-sm text-neutral-500">Vake, Tbilisi</p>
      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <StatusPill variant="applied" size="xs" />
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900 rounded-xl">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill variant="verified" />
        <StatusPill variant="topRated" />
        <StatusPill variant="new" />
        <StatusPill variant="urgent" />
        <StatusPill variant="premium" />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
