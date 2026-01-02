import type { Meta, StoryObj } from '@storybook/nextjs';
import { PasswordInput } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'UI/PasswordInput',
  component: PasswordInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {
  args: {
    placeholder: 'Enter password',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithError: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    hint: 'Must contain at least 8 characters, one uppercase, one lowercase, and one number',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small password input',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const LargeSize: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large password input',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithoutIcon: Story = {
  args: {
    showIcon: false,
    placeholder: 'Password without lock icon',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    label: 'Password',
    placeholder: 'Disabled input',
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <PasswordInput size="sm" placeholder="Small" label="Small" />
      <PasswordInput size="md" placeholder="Medium" label="Medium" />
      <PasswordInput size="lg" placeholder="Large" label="Large" />
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <PasswordInput placeholder="Default state" label="Default" />
      <PasswordInput
        placeholder="Error state"
        label="Error"
        error="This field has an error"
      />
      <PasswordInput
        placeholder="Success state"
        label="Success"
        variant="success"
      />
      <PasswordInput
        placeholder="Disabled state"
        label="Disabled"
        disabled
      />
    </div>
  ),
};
