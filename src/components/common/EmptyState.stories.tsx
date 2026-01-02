import type { Meta, StoryObj } from '@storybook/nextjs';
import { Search, Inbox, FileText, Users, Heart, Bell } from 'lucide-react';
import EmptyState from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[400px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['simple', 'illustrated'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    titleKa: 'შედეგები ვერ მოიძებნა',
    description: 'Try adjusting your search or filter to find what you\'re looking for.',
    descriptionKa: 'სცადეთ ძებნის ან ფილტრის შეცვლა.',
  },
};

export const EmptyInbox: Story = {
  args: {
    icon: Inbox,
    title: 'Your inbox is empty',
    description: 'Messages from professionals will appear here.',
    actionLabel: 'Browse Professionals',
    actionHref: '/professionals',
  },
};

export const NoDocuments: Story = {
  args: {
    icon: FileText,
    title: 'No documents yet',
    description: 'Upload your first document to get started.',
    actionLabel: 'Upload Document',
    onAction: () => alert('Upload clicked'),
  },
};

export const SimpleVariant: Story = {
  args: {
    icon: Users,
    title: 'No team members',
    description: 'Add team members to collaborate on projects.',
    variant: 'simple',
    actionLabel: 'Invite Members',
    onAction: () => {},
  },
};

export const SmallSize: Story = {
  args: {
    icon: Heart,
    title: 'No favorites',
    description: 'Save your favorite professionals here.',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    icon: Bell,
    title: 'No notifications',
    description: 'You\'re all caught up! New notifications will appear here.',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border-b pb-4">
        <p className="text-sm text-neutral-500 mb-4">Small</p>
        <EmptyState
          icon={Search}
          title="Small Empty State"
          description="This is a small variant"
          size="sm"
        />
      </div>
      <div className="border-b pb-4">
        <p className="text-sm text-neutral-500 mb-4">Medium (default)</p>
        <EmptyState
          icon={Search}
          title="Medium Empty State"
          description="This is the default medium variant"
          size="md"
        />
      </div>
      <div>
        <p className="text-sm text-neutral-500 mb-4">Large</p>
        <EmptyState
          icon={Search}
          title="Large Empty State"
          description="This is a large variant for prominent empty states"
          size="lg"
        />
      </div>
    </div>
  ),
};

export const BothVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-500 mb-4">Illustrated (default)</p>
        <EmptyState
          icon={Inbox}
          title="Illustrated Variant"
          description="With floating decorative elements"
          variant="illustrated"
        />
      </div>
      <div>
        <p className="text-sm text-neutral-500 mb-4">Simple</p>
        <EmptyState
          icon={Inbox}
          title="Simple Variant"
          description="Clean and minimal design"
          variant="simple"
        />
      </div>
    </div>
  ),
};
