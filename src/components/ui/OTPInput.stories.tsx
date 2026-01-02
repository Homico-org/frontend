import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { OTPInput } from './OTPInput';

const meta: Meta<typeof OTPInput> = {
  title: 'UI/OTPInput',
  component: OTPInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    length: {
      control: { type: 'number', min: 3, max: 8 },
    },
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
type Story = StoryObj<typeof OTPInput>;

export const Default: Story = {
  args: {
    length: 4,
  },
};

export const WithLabel: Story = {
  args: {
    length: 4,
    label: 'Enter verification code',
  },
};

export const SixDigits: Story = {
  args: {
    length: 6,
    label: 'Enter 6-digit code',
  },
};

export const WithError: Story = {
  args: {
    length: 4,
    label: 'Verification code',
    error: 'Invalid code. Please try again.',
  },
};

export const SmallSize: Story = {
  args: {
    length: 4,
    size: 'sm',
    label: 'Small OTP input',
  },
};

export const LargeSize: Story = {
  args: {
    length: 4,
    size: 'lg',
    label: 'Large OTP input',
  },
};

export const Disabled: Story = {
  args: {
    length: 4,
    label: 'Disabled input',
    disabled: true,
    value: '12',
  },
};

export const PrefilledValue: Story = {
  args: {
    length: 4,
    label: 'Prefilled code',
    value: '1234',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    return (
      <div className="space-y-4">
        <OTPInput
          length={4}
          label="Enter your code"
          value={value}
          onChange={setValue}
          onComplete={() => setIsComplete(true)}
        />
        <div className="text-center text-sm text-neutral-600">
          <p>Current value: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{value || '(empty)'}</code></p>
          {isComplete && (
            <p className="text-green-600 mt-2">Code complete!</p>
          )}
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <OTPInput size="sm" length={4} label="Small" autoFocus={false} />
      <OTPInput size="md" length={4} label="Medium" autoFocus={false} />
      <OTPInput size="lg" length={4} label="Large" autoFocus={false} />
    </div>
  ),
};

export const AllLengths: Story = {
  render: () => (
    <div className="space-y-6">
      <OTPInput length={3} label="3 digits" autoFocus={false} />
      <OTPInput length={4} label="4 digits" autoFocus={false} />
      <OTPInput length={5} label="5 digits" autoFocus={false} />
      <OTPInput length={6} label="6 digits" autoFocus={false} />
    </div>
  ),
};

export const SuccessState: Story = {
  args: {
    length: 4,
    label: 'Verification successful',
    variant: 'success',
    value: '1234',
  },
};
