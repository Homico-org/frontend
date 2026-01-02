import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { PhoneInput, CountryCode } from './PhoneInput';

const meta: Meta<typeof PhoneInput> = {
  title: 'UI/PhoneInput',
  component: PhoneInput,
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
    country: {
      control: 'select',
      options: ['GE', 'IL', 'FR', 'US', 'DE'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PhoneInput>;

export const Default: Story = {
  args: {
    country: 'GE',
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
    label: 'Phone Number',
    country: 'GE',
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
    label: 'Phone Number',
    country: 'GE',
    error: 'Please enter a valid phone number',
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
    label: 'Phone Number',
    country: 'GE',
    hint: 'We will send a verification code to this number',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const DifferentCountries: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <PhoneInput label="Georgia" country="GE" />
      <PhoneInput label="Israel" country="IL" />
      <PhoneInput label="France" country="FR" />
      <PhoneInput label="United States" country="US" />
      <PhoneInput label="Germany" country="DE" />
    </div>
  ),
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
    label: 'Small Input',
    country: 'GE',
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
    label: 'Large Input',
    country: 'GE',
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
    label: 'Phone Number',
    country: 'GE',
    value: '555123456',
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

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [country, setCountry] = useState<CountryCode>('GE');

    return (
      <div className="w-80 space-y-4">
        <PhoneInput
          label="Phone Number"
          value={value}
          onChange={setValue}
          country={country}
          onCountryChange={setCountry}
        />
        <div className="text-sm text-neutral-600 space-y-1">
          <p>Country: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{country}</code></p>
          <p>Value: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{value || '(empty)'}</code></p>
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <PhoneInput size="sm" label="Small" country="GE" />
      <PhoneInput size="md" label="Medium" country="GE" />
      <PhoneInput size="lg" label="Large" country="GE" />
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <PhoneInput label="Default" country="GE" />
      <PhoneInput
        label="With Value"
        country="GE"
        value="555123456"
      />
      <PhoneInput
        label="Error"
        country="GE"
        error="Invalid phone number"
      />
      <PhoneInput
        label="Success"
        country="GE"
        value="555123456"
        variant="success"
      />
      <PhoneInput
        label="Disabled"
        country="GE"
        disabled
      />
    </div>
  ),
};
