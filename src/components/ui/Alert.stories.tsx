import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info', 'accent'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: 'This is a default alert message.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'There was an error processing your request. Please try again.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Your subscription is about to expire. Please renew soon.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'A new version is available. Refresh to update.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: 'Complete your profile to get more visibility.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Did you know?',
    children: 'You can customize your notification preferences in settings.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);

    if (!visible) {
      return (
        <div className="w-96">
          <button
            onClick={() => setVisible(true)}
            className="px-4 py-2 bg-[#C4735B] text-white rounded-lg"
          >
            Show Alert
          </button>
        </div>
      );
    }

    return (
      <div className="w-96">
        <Alert
          variant="success"
          dismissible
          onDismiss={() => setVisible(false)}
        >
          This alert can be dismissed by clicking the X button.
        </Alert>
      </div>
    );
  },
};

export const WithCustomIcon: Story = {
  args: {
    variant: 'accent',
    icon: <Bell className="w-5 h-5" />,
    children: 'You have new notifications to review.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const WithoutIcon: Story = {
  args: {
    variant: 'info',
    showIcon: false,
    children: 'This alert has no icon.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const SmallSize: Story = {
  args: {
    variant: 'info',
    size: 'sm',
    children: 'This is a small alert.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const LargeSize: Story = {
  args: {
    variant: 'info',
    size: 'lg',
    title: 'Large Alert',
    children: 'This is a large alert with more prominent styling.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Alert variant="default">Default alert message</Alert>
      <Alert variant="success">Success alert message</Alert>
      <Alert variant="error">Error alert message</Alert>
      <Alert variant="warning">Warning alert message</Alert>
      <Alert variant="info">Info alert message</Alert>
      <Alert variant="accent">Accent alert message</Alert>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Alert variant="info" size="sm">
        Small alert
      </Alert>
      <Alert variant="info" size="md">
        Medium alert (default)
      </Alert>
      <Alert variant="info" size="lg">
        Large alert
      </Alert>
    </div>
  ),
};
