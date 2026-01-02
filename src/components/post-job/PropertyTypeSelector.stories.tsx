import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import PropertyTypeSelector, { PropertyType } from './PropertyTypeSelector';

const meta: Meta<typeof PropertyTypeSelector> = {
  title: 'PostJob/PropertyTypeSelector',
  component: PropertyTypeSelector,
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
type Story = StoryObj<typeof PropertyTypeSelector>;

export const Apartment: Story = {
  args: {
    value: 'apartment',
    onChange: () => {},
  },
};

export const House: Story = {
  args: {
    value: 'house',
    onChange: () => {},
  },
};

export const Office: Story = {
  args: {
    value: 'office',
    onChange: () => {},
  },
};

export const GeorgianLocale: Story = {
  args: {
    value: 'apartment',
    onChange: () => {},
    locale: 'ka',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<PropertyType>('apartment');
    return (
      <div className="space-y-4">
        <PropertyTypeSelector value={value} onChange={setValue} />
        <p className="text-sm text-neutral-500 text-center">
          Selected: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};
