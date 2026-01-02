import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import TimingSelector, { Timing } from './TimingSelector';

const meta: Meta<typeof TimingSelector> = {
  title: 'PostJob/TimingSelector',
  component: TimingSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimingSelector>;

export const ASAP: Story = {
  args: {
    value: 'asap',
    onChange: () => {},
  },
};

export const ThisWeek: Story = {
  args: {
    value: 'this_week',
    onChange: () => {},
  },
};

export const ThisMonth: Story = {
  args: {
    value: 'this_month',
    onChange: () => {},
  },
};

export const Flexible: Story = {
  args: {
    value: 'flexible',
    onChange: () => {},
  },
};

export const GeorgianLocale: Story = {
  args: {
    value: 'asap',
    onChange: () => {},
    locale: 'ka',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<Timing>('asap');
    return (
      <div className="space-y-4">
        <TimingSelector value={value} onChange={setValue} />
        <p className="text-sm text-neutral-500 text-center">
          Selected: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};
