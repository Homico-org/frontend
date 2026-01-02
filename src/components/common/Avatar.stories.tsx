import type { Meta, StoryObj } from '@storybook/nextjs';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Common/Avatar',
  component: Avatar,
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
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    rounded: {
      control: 'select',
      options: ['full', 'xl', 'lg', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    name: 'John Doe',
    size: 'md',
  },
};

export const WithInitials: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const SingleLetter: Story = {
  args: {
    name: 'Alex',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar name="XS" size="xs" />
      <Avatar name="SM" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
      <Avatar name="2XL" size="2xl" />
    </div>
  ),
};

export const AllRoundedVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Full" size="lg" rounded="full" />
      <Avatar name="XL" size="lg" rounded="xl" />
      <Avatar name="LG" size="lg" rounded="lg" />
      <Avatar name="MD" size="lg" rounded="md" />
    </div>
  ),
};

export const WithBorder: Story = {
  args: {
    name: 'John Doe',
    size: 'lg',
    showBorder: true,
  },
};

export const DifferentColors: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Alice" size="lg" />
      <Avatar name="Bob" size="lg" />
      <Avatar name="Carol" size="lg" />
      <Avatar name="David" size="lg" />
      <Avatar name="Eve" size="lg" />
      <Avatar name="Frank" size="lg" />
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    name: 'Click Me',
    size: 'lg',
    onClick: () => alert('Avatar clicked!'),
  },
};
