import type { Meta, StoryObj } from '@storybook/nextjs';
import { Plus, ArrowRight, Download, Trash2, Heart, Settings } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
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
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'premium', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
      <Button variant="premium">Premium</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button leftIcon={<Plus />}>Add New</Button>
      <Button rightIcon={<ArrowRight />}>Continue</Button>
      <Button leftIcon={<Download />} variant="outline">Download</Button>
      <Button leftIcon={<Trash2 />} variant="destructive">Delete</Button>
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="icon-sm" variant="ghost">
        <Heart className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="outline">
        <Settings className="w-4 h-4" />
      </Button>
      <Button size="icon-lg" variant="default">
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: 'Submitting...',
    loading: true,
  },
};

export const LoadingVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button loading>Default</Button>
      <Button loading variant="outline">Outline</Button>
      <Button loading variant="secondary">Secondary</Button>
      <Button loading variant="destructive">Destructive</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <Button className="w-full">Full Width Button</Button>
    </div>
  ),
};

export const Premium: Story = {
  args: {
    children: 'Upgrade to Pro',
    variant: 'premium',
    size: 'lg',
  },
};
