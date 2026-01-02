import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import BudgetSelector, { BudgetType } from './BudgetSelector';

const meta: Meta<typeof BudgetSelector> = {
  title: 'PostJob/BudgetSelector',
  component: BudgetSelector,
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
type Story = StoryObj<typeof BudgetSelector>;

export const Fixed: Story = {
  args: {
    budgetType: 'fixed',
    onBudgetTypeChange: () => {},
    budgetMin: '5000',
    onBudgetMinChange: () => {},
    budgetMax: '',
    onBudgetMaxChange: () => {},
  },
};

export const Range: Story = {
  args: {
    budgetType: 'range',
    onBudgetTypeChange: () => {},
    budgetMin: '3000',
    onBudgetMinChange: () => {},
    budgetMax: '8000',
    onBudgetMaxChange: () => {},
  },
};

export const Negotiable: Story = {
  args: {
    budgetType: 'negotiable',
    onBudgetTypeChange: () => {},
    budgetMin: '',
    onBudgetMinChange: () => {},
    budgetMax: '',
    onBudgetMaxChange: () => {},
  },
};

export const GeorgianLocale: Story = {
  args: {
    budgetType: 'fixed',
    onBudgetTypeChange: () => {},
    budgetMin: '5000',
    onBudgetMinChange: () => {},
    budgetMax: '',
    onBudgetMaxChange: () => {},
    locale: 'ka',
  },
};

export const Interactive: Story = {
  render: () => {
    const [budgetType, setBudgetType] = useState<BudgetType>('fixed');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    return (
      <div className="space-y-4">
        <BudgetSelector
          budgetType={budgetType}
          onBudgetTypeChange={setBudgetType}
          budgetMin={budgetMin}
          onBudgetMinChange={setBudgetMin}
          budgetMax={budgetMax}
          onBudgetMaxChange={setBudgetMax}
        />
        <div className="text-sm text-neutral-500 text-center">
          Type: <strong>{budgetType}</strong>
          {budgetType !== 'negotiable' && (
            <>
              {' | '}Budget: <strong>₾{budgetMin || 0}</strong>
              {budgetType === 'range' && budgetMax && (
                <> - <strong>₾{budgetMax}</strong></>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
};

export const DollarCurrency: Story = {
  args: {
    budgetType: 'fixed',
    onBudgetTypeChange: () => {},
    budgetMin: '1500',
    onBudgetMinChange: () => {},
    budgetMax: '',
    onBudgetMaxChange: () => {},
    currency: '$',
  },
};
