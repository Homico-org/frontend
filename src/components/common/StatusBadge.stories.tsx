import type { Meta, StoryObj } from '@storybook/nextjs';
import StatusBadge from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Common/StatusBadge',
  component: StatusBadge,
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
    status: {
      control: 'select',
      options: ['active', 'busy', 'away'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Active: Story = {
  args: {
    status: 'active',
  },
};

export const Busy: Story = {
  args: {
    status: 'busy',
  },
};

export const Away: Story = {
  args: {
    status: 'away',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusBadge status="active" />
      <StatusBadge status="busy" />
      <StatusBadge status="away" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusBadge status="active" size="sm" />
      <StatusBadge status="active" size="md" />
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusBadge status="active" variant="minimal" />
      <StatusBadge status="busy" variant="minimal" />
      <StatusBadge status="away" variant="minimal" />
    </div>
  ),
};

export const NoLabel: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusBadge status="active" showLabel={false} />
      <StatusBadge status="busy" showLabel={false} />
      <StatusBadge status="away" showLabel={false} />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">John Doe</p>
            <p className="text-sm text-neutral-500">Interior Designer</p>
          </div>
        </div>
        <StatusBadge status="active" />
      </div>
      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Jane Smith</p>
            <p className="text-sm text-neutral-500">Architect</p>
          </div>
        </div>
        <StatusBadge status="busy" />
      </div>
    </div>
  ),
};
