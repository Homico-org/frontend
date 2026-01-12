import type { Meta, StoryObj } from '@storybook/nextjs';
import { IconBadge, SocialIconBadge } from './IconBadge';
import {
  Star,
  Heart,
  Check,
  Bell,
  Settings,
  User,
  Mail,
  Phone,
  Camera,
  Share2,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
} from 'lucide-react';

const meta: Meta<typeof IconBadge> = {
  title: 'UI/IconBadge',
  component: IconBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'accent',
        'company',
        'success',
        'warning',
        'error',
        'info',
        'neutral',
        'facebook',
        'instagram',
        'linkedin',
        'whatsapp',
        'telegram',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    filled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconBadge>;

export const Default: Story = {
  args: {
    icon: Star,
    variant: 'accent',
    size: 'md',
  },
};

export const Filled: Story = {
  args: {
    icon: Check,
    variant: 'success',
    size: 'md',
    filled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" />
        <span className="text-xs text-neutral-500">accent</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="company" />
        <span className="text-xs text-neutral-500">company</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Check} variant="success" />
        <span className="text-xs text-neutral-500">success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Bell} variant="warning" />
        <span className="text-xs text-neutral-500">warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Heart} variant="error" />
        <span className="text-xs text-neutral-500">error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Mail} variant="info" />
        <span className="text-xs text-neutral-500">info</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Settings} variant="neutral" />
        <span className="text-xs text-neutral-500">neutral</span>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" size="xs" />
        <span className="text-xs text-neutral-500">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" size="sm" />
        <span className="text-xs text-neutral-500">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" size="md" />
        <span className="text-xs text-neutral-500">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" size="lg" />
        <span className="text-xs text-neutral-500">lg</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconBadge icon={Star} variant="accent" size="xl" />
        <span className="text-xs text-neutral-500">xl</span>
      </div>
    </div>
  ),
};

export const FilledVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconBadge icon={Star} variant="accent" filled />
      <IconBadge icon={Star} variant="company" filled />
      <IconBadge icon={Check} variant="success" filled />
      <IconBadge icon={Bell} variant="warning" filled />
      <IconBadge icon={Heart} variant="error" filled />
      <IconBadge icon={Mail} variant="info" filled />
      <IconBadge icon={Settings} variant="neutral" filled />
    </div>
  ),
};

export const Clickable: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconBadge icon={Heart} variant="error" onClick={() => alert("Liked!")} />
      <IconBadge icon={Share2} variant="info" onClick={() => alert("Shared!")} />
      <IconBadge icon={Settings} variant="neutral" onClick={() => alert("Settings!")} />
    </div>
  ),
};

export const SocialIcons: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconBadge icon={Facebook} variant="facebook" />
      <IconBadge icon={Instagram} variant="instagram" />
      <IconBadge icon={Linkedin} variant="linkedin" />
      <IconBadge icon={MessageCircle} variant="whatsapp" />
      <IconBadge icon={Send} variant="telegram" />
    </div>
  ),
};

export const CustomColor: Story = {
  args: {
    icon: Camera,
    color: '#8B5CF6', // Purple
    size: 'lg',
  },
};

export const InCard: Story = {
  render: () => (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-80">
      <div className="flex items-start gap-4">
        <IconBadge icon={User} variant="company" size="lg" />
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">John Doe</h3>
          <p className="text-sm text-neutral-500">Professional Designer</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
        <IconBadge icon={Phone} variant="success" size="sm" onClick={() => {}} />
        <IconBadge icon={Mail} variant="info" size="sm" onClick={() => {}} />
        <IconBadge icon={Share2} variant="neutral" size="sm" onClick={() => {}} />
      </div>
    </div>
  ),
};

export const NotificationBadge: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <IconBadge icon={Bell} variant="warning" size="lg" />
      <div>
        <h4 className="font-medium text-neutral-900 dark:text-white">New notification</h4>
        <p className="text-sm text-neutral-500">You have 3 unread messages</p>
      </div>
    </div>
  ),
};
