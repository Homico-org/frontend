import type { Meta, StoryObj } from '@storybook/nextjs';
import BackButton from './BackButton';

const meta: Meta<typeof BackButton> = {
  title: 'Common/BackButton',
  component: BackButton,
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
      options: ['default', 'minimal', 'filled'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof BackButton>;

export const Default: Story = {
  args: {},
};

export const Minimal: Story = {
  args: {
    variant: 'minimal',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
  },
};

export const CustomLabel: Story = {
  args: {
    label: 'Go Home',
  },
};

export const NoLabel: Story = {
  args: {
    showLabel: false,
  },
};

export const WithHref: Story = {
  args: {
    href: '/dashboard',
    label: 'Dashboard',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-20">Default:</span>
        <BackButton variant="default" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-20">Minimal:</span>
        <BackButton variant="minimal" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 w-20">Filled:</span>
        <BackButton variant="filled" />
      </div>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <BackButton variant="default" showLabel={false} />
      <BackButton variant="minimal" showLabel={false} />
      <BackButton variant="filled" showLabel={false} />
    </div>
  ),
};
