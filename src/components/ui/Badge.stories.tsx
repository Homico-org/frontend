import type { Meta, StoryObj } from '@storybook/nextjs';
import { Star, Zap, Crown, Check } from 'lucide-react';
import { Badge, StatusBadge, CountBadge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
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
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'warning', 'danger', 'info', 'outline', 'premium', 'ghost', 'pulse'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="premium">Premium</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="pulse">Pulse</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="xs">XS</Badge>
      <Badge size="sm">SM</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
      <Badge size="xl">XL</Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge icon={<Star className="w-3 h-3" />}>Featured</Badge>
      <Badge icon={<Zap className="w-3 h-3" />} variant="warning">Fast</Badge>
      <Badge icon={<Crown className="w-3 h-3" />} variant="premium">Pro</Badge>
      <Badge icon={<Check className="w-3 h-3" />} variant="success">Verified</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge dot dotColor="default">Online</Badge>
      <Badge dot dotColor="success" variant="success">Active</Badge>
      <Badge dot dotColor="warning" variant="warning">Pending</Badge>
      <Badge dot dotColor="danger" variant="danger">Error</Badge>
    </div>
  ),
};

export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge removable onRemove={() => alert("Removed!")}>Removable</Badge>
      <Badge removable variant="success" onRemove={() => {}}>Tag</Badge>
      <Badge removable variant="info" onRemove={() => {}}>Filter</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="active">Active</StatusBadge>
      <StatusBadge status="inactive">Inactive</StatusBadge>
      <StatusBadge status="pending">Pending</StatusBadge>
      <StatusBadge status="success">Success</StatusBadge>
      <StatusBadge status="error">Error</StatusBadge>
      <StatusBadge status="warning">Warning</StatusBadge>
      <StatusBadge status="expired">Expired</StatusBadge>
    </div>
  ),
};

export const CountBadges: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="relative">
        <span className="text-neutral-600">Messages</span>
        <CountBadge count={5} className="absolute -top-1 -right-4" />
      </div>
      <div className="relative">
        <span className="text-neutral-600">Notifications</span>
        <CountBadge count={42} className="absolute -top-1 -right-6" />
      </div>
      <div className="relative">
        <span className="text-neutral-600">Many</span>
        <CountBadge count={150} max={99} className="absolute -top-1 -right-8" />
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4 min-w-[300px]">
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
        <span className="font-medium">Professional</span>
        <Badge variant="premium" icon={<Crown className="w-3 h-3" />}>Pro</Badge>
      </div>
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
        <span className="font-medium">Status</span>
        <StatusBadge status="active">Online</StatusBadge>
      </div>
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
        <span className="font-medium">Verification</span>
        <Badge variant="success" icon={<Check className="w-3 h-3" />}>Verified</Badge>
      </div>
    </div>
  ),
};
