import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { SelectionGroup, SelectionCardGroup } from './SelectionGroup';
import { Zap, Calendar, Clock, DollarSign, Percent, CreditCard } from 'lucide-react';

const meta: Meta<typeof SelectionGroup> = {
  title: 'UI/SelectionGroup',
  component: SelectionGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SelectionGroup>;

const budgetOptions = [
  { value: 'fixed', label: 'Fixed Price', labelKa: 'ფიქსირებული' },
  { value: 'range', label: 'Range', labelKa: 'დიაპაზონი' },
  { value: 'negotiable', label: 'Negotiable', labelKa: 'შეთანხმებით' },
];

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="w-96">
        <SelectionGroup
          options={budgetOptions}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: function WithLabelStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="w-96">
        <SelectionGroup
          label="Budget Type"
          options={budgetOptions}
          value={value}
          onChange={setValue}
          required
        />
      </div>
    );
  },
};

export const Georgian: Story = {
  render: function GeorgianStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="w-96">
        <SelectionGroup
          options={budgetOptions}
          value={value}
          onChange={setValue}
          locale="ka"
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: function SizesStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="space-y-6 w-96">
        <div>
          <p className="text-xs text-neutral-500 mb-2">Small</p>
          <SelectionGroup
            options={budgetOptions}
            value={value}
            onChange={setValue}
            size="sm"
          />
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-2">Medium (default)</p>
          <SelectionGroup
            options={budgetOptions}
            value={value}
            onChange={setValue}
            size="md"
          />
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-2">Large</p>
          <SelectionGroup
            options={budgetOptions}
            value={value}
            onChange={setValue}
            size="lg"
          />
        </div>
      </div>
    );
  },
};

export const PillStyle: Story = {
  render: function PillStyleStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="w-96">
        <SelectionGroup
          options={budgetOptions}
          value={value}
          onChange={setValue}
          pill
        />
      </div>
    );
  },
};

export const VerticalLayout: Story = {
  render: function VerticalLayoutStory() {
    const [value, setValue] = useState('fixed');
    return (
      <div className="w-64">
        <SelectionGroup
          options={budgetOptions}
          value={value}
          onChange={setValue}
          layout="vertical"
        />
      </div>
    );
  },
};

export const GridLayout: Story = {
  render: function GridLayoutStory() {
    const [value, setValue] = useState('option1');
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
      { value: 'option4', label: 'Option 4' },
    ];
    return (
      <div className="w-80">
        <SelectionGroup
          options={options}
          value={value}
          onChange={setValue}
          layout="grid"
          columns={2}
        />
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: function WithIconsStory() {
    const [value, setValue] = useState('card');
    const paymentOptions = [
      { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
      { value: 'cash', label: 'Cash', icon: <DollarSign className="w-4 h-4" /> },
      { value: 'split', label: 'Split', icon: <Percent className="w-4 h-4" /> },
    ];
    return (
      <div className="w-96">
        <SelectionGroup
          options={paymentOptions}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const WithDisabledOption: Story = {
  render: function WithDisabledStory() {
    const [value, setValue] = useState('fixed');
    const options = [
      { value: 'fixed', label: 'Fixed' },
      { value: 'range', label: 'Range' },
      { value: 'premium', label: 'Premium', disabled: true },
    ];
    return (
      <div className="w-96">
        <SelectionGroup
          options={options}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

// SelectionCardGroup stories
export const CardGroup: Story = {
  render: function CardGroupStory() {
    const [value, setValue] = useState('asap');
    const timingOptions = [
      {
        value: 'asap',
        label: 'As soon as possible',
        description: 'Start immediately when available',
        icon: <Zap className="w-5 h-5" />,
      },
      {
        value: 'scheduled',
        label: 'Scheduled',
        description: 'Pick a specific date and time',
        icon: <Calendar className="w-5 h-5" />,
      },
      {
        value: 'flexible',
        label: 'Flexible',
        description: 'No rush, anytime works',
        icon: <Clock className="w-5 h-5" />,
      },
    ];
    return (
      <div className="w-[500px]">
        <SelectionCardGroup
          label="When do you need this done?"
          options={timingOptions}
          value={value}
          onChange={setValue}
          layout="vertical"
        />
      </div>
    );
  },
};

export const CardGroupGrid: Story = {
  render: function CardGroupGridStory() {
    const [value, setValue] = useState('new');
    const conditionOptions = [
      { value: 'new', label: 'New Construction', description: 'Building from scratch' },
      { value: 'renovation', label: 'Renovation', description: 'Updating existing space' },
      { value: 'repair', label: 'Repair', description: 'Fixing specific issues' },
      { value: 'maintenance', label: 'Maintenance', description: 'Regular upkeep' },
    ];
    return (
      <div className="w-[600px]">
        <SelectionCardGroup
          options={conditionOptions}
          value={value}
          onChange={setValue}
          layout="grid"
          columns={2}
        />
      </div>
    );
  },
};

export const CardGroupWithoutDescriptions: Story = {
  render: function CardGroupSimpleStory() {
    const [value, setValue] = useState('small');
    const sizeOptions = [
      { value: 'small', label: 'Small', icon: <span className="text-lg">S</span> },
      { value: 'medium', label: 'Medium', icon: <span className="text-lg">M</span> },
      { value: 'large', label: 'Large', icon: <span className="text-lg">L</span> },
    ];
    return (
      <div className="w-96">
        <SelectionCardGroup
          options={sizeOptions}
          value={value}
          onChange={setValue}
          showDescriptions={false}
        />
      </div>
    );
  },
};
