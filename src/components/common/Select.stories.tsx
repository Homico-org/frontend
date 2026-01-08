import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import Select, { SelectOption } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Common/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[300px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const basicOptions = [
  { value: 'design', label: 'Interior Design' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'craftsmen', label: 'Craftsmen' },
  { value: 'homecare', label: 'Home Care' },
];

// Interactive wrapper
const InteractiveSelect = (props: Omit<Partial<React.ComponentProps<typeof Select>>, 'options'> & { options: SelectOption[] }) => {
  const [value, setValue] = useState(props.value || '');
  return <Select {...props} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: () => (
    <InteractiveSelect
      options={basicOptions}
      placeholder="Select a category"
    />
  ),
};

export const WithValue: Story = {
  render: () => (
    <InteractiveSelect
      options={basicOptions}
      value="design"
      placeholder="Select a category"
    />
  ),
};

export const Searchable: Story = {
  render: () => (
    <InteractiveSelect
      options={[
        { value: 'design', label: 'Interior Design' },
        { value: 'architecture', label: 'Architecture' },
        { value: 'craftsmen', label: 'Craftsmen' },
        { value: 'homecare', label: 'Home Care' },
        { value: 'landscaping', label: 'Landscaping' },
        { value: 'electrical', label: 'Electrical' },
        { value: 'plumbing', label: 'Plumbing' },
        { value: 'painting', label: 'Painting' },
        { value: 'flooring', label: 'Flooring' },
        { value: 'roofing', label: 'Roofing' },
      ]}
      placeholder="Search categories..."
      searchable
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <InteractiveSelect
      options={[
        {
          value: 'design',
          label: 'Interior Design',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          ),
        },
        {
          value: 'architecture',
          label: 'Architecture',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          value: 'craftsmen',
          label: 'Craftsmen',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          ),
        },
      ]}
      placeholder="Select service type"
    />
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <InteractiveSelect
      options={[
        {
          value: 'basic',
          label: 'Basic Plan',
          description: 'Perfect for small projects',
        },
        {
          value: 'standard',
          label: 'Standard Plan',
          description: 'Most popular choice',
        },
        {
          value: 'premium',
          label: 'Premium Plan',
          description: 'Full-featured experience',
        },
      ]}
      placeholder="Select a plan"
    />
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Small</label>
        <InteractiveSelect options={basicOptions} placeholder="Small select" size="sm" />
      </div>
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Medium</label>
        <InteractiveSelect options={basicOptions} placeholder="Medium select" size="md" />
      </div>
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Large</label>
        <InteractiveSelect options={basicOptions} placeholder="Large select" size="lg" />
      </div>
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <InteractiveSelect
      options={basicOptions}
      placeholder="Select category"
      variant="minimal"
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="space-y-2">
      <InteractiveSelect
        options={basicOptions}
        placeholder="Select a category"
        error
      />
      <p className="text-sm text-red-500">Please select a category</p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select
      options={basicOptions}
      value="design"
      onChange={() => {}}
      placeholder="Select a category"
      disabled
    />
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <InteractiveSelect
      options={[
        { value: 'design', label: 'Interior Design' },
        { value: 'architecture', label: 'Architecture', disabled: true },
        { value: 'craftsmen', label: 'Craftsmen' },
        { value: 'homecare', label: 'Home Care', disabled: true },
      ]}
      placeholder="Select a category"
    />
  ),
};

export const InForm: Story = {
  render: () => (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Category
        </label>
        <InteractiveSelect options={basicOptions} placeholder="Select a category" />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Location
        </label>
        <InteractiveSelect
          options={[
            { value: 'tbilisi', label: 'Tbilisi' },
            { value: 'batumi', label: 'Batumi' },
            { value: 'kutaisi', label: 'Kutaisi' },
          ]}
          placeholder="Select a city"
          searchable
        />
      </div>
      <button
        type="button"
        className="w-full py-2.5 px-4 bg-[#C4735B] text-white font-medium rounded-xl hover:bg-[#B5664E] transition-colors"
      >
        Submit
      </button>
    </form>
  ),
};
