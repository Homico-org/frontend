import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareMenu, { ShareButtons } from './ShareMenu';

const meta: Meta<typeof ShareMenu> = {
  title: 'Common/ShareMenu',
  component: ShareMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ShareMenu>;

export const Default: Story = {
  args: {
    url: 'https://example.com/page',
    title: 'Check out this page!',
  },
};

export const WithCustomTitle: Story = {
  args: {
    url: 'https://example.com/job/123',
    title: 'Amazing job opportunity - Senior Developer',
    description: 'We are looking for a talented developer to join our team.',
  },
};

export const PositionBottom: Story = {
  args: {
    url: 'https://example.com',
    title: 'Share this',
    position: 'bottom',
  },
  decorators: [
    (Story) => (
      <div className="pt-48">
        <Story />
      </div>
    ),
  ],
};

export const SmallSize: Story = {
  args: {
    url: 'https://example.com',
    title: 'Share',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    url: 'https://example.com',
    title: 'Share',
    size: 'lg',
  },
};

export const GeorgianLocale: Story = {
  args: {
    url: 'https://example.com',
    title: 'სამუშაო შეთავაზება',
    locale: 'ka',
  },
};

export const WithCopyCallback: Story = {
  render: () => {
    const [copied, setCopied] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <ShareMenu
          url="https://example.com"
          title="Share me"
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />
        {copied && (
          <p className="text-sm text-green-600">Link copied to clipboard!</p>
        )}
      </div>
    );
  },
};

export const CustomButton: Story = {
  render: () => (
    <ShareMenu
      url="https://example.com"
      title="Custom button example"
      renderButton={({ onClick, isOpen }) => (
        <button
          onClick={onClick}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isOpen
              ? 'bg-[#C4735B] text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </span>
        </button>
      )}
    />
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-xs text-neutral-500 mb-2">Small</p>
        <ShareMenu url="https://example.com" title="Small" size="sm" />
      </div>
      <div className="text-center">
        <p className="text-xs text-neutral-500 mb-2">Medium</p>
        <ShareMenu url="https://example.com" title="Medium" size="md" />
      </div>
      <div className="text-center">
        <p className="text-xs text-neutral-500 mb-2">Large</p>
        <ShareMenu url="https://example.com" title="Large" size="lg" />
      </div>
    </div>
  ),
};

// ShareButtons variant
export const InlineButtons: Story = {
  render: () => {
    const [copied, setCopied] = useState(false);
    return (
      <div className="space-y-4">
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl">
          <p className="text-sm text-neutral-500 mb-3">Share</p>
          <ShareButtons
            url="https://example.com/job/123"
            title="Job Title"
            onCopy={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          />
        </div>
        {copied && (
          <p className="text-sm text-green-600 text-center">Copied!</p>
        )}
      </div>
    );
  },
};
