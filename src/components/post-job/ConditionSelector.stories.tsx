import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import ConditionSelector, { PropertyCondition } from './ConditionSelector';

const meta: Meta<typeof ConditionSelector> = {
  title: 'PostJob/ConditionSelector',
  component: ConditionSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConditionSelector>;

export const Shell: Story = {
  args: {
    value: 'shell',
    onChange: () => {},
  },
};

export const BlackFrame: Story = {
  args: {
    value: 'black-frame',
    onChange: () => {},
  },
};

export const NeedsRenovation: Story = {
  args: {
    value: 'needs-renovation',
    onChange: () => {},
  },
};

export const PartialRenovation: Story = {
  args: {
    value: 'partial-renovation',
    onChange: () => {},
  },
};

export const GoodCondition: Story = {
  args: {
    value: 'good',
    onChange: () => {},
  },
};

export const GeorgianLocale: Story = {
  args: {
    value: 'shell',
    onChange: () => {},
    locale: 'ka',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<PropertyCondition | ''>('');
    return (
      <div className="space-y-4">
        <ConditionSelector value={value} onChange={setValue} />
        <p className="text-sm text-neutral-500 text-center">
          Selected: <strong>{value || 'none'}</strong>
        </p>
      </div>
    );
  },
};

export const WithCategory: Story = {
  args: {
    value: 'needs-renovation',
    onChange: () => {},
    category: 'interior-design',
  },
};

