import type { Meta, StoryObj } from '@storybook/nextjs';
import { Send, Edit3, Trash2 } from 'lucide-react';
import JobStatsBar from './JobStatsBar';

const meta: Meta<typeof JobStatsBar> = {
  title: 'Jobs/JobStatsBar',
  component: JobStatsBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAF8] dark:bg-[#0D0D0C] rounded-xl min-w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobStatsBar>;

export const Default: Story = {
  args: {
    budget: '₾5,000',
    viewCount: 124,
    proposalCount: 8,
  },
};

export const RangeBudget: Story = {
  args: {
    budget: '₾1,000 - ₾5,000',
    viewCount: 89,
    proposalCount: 12,
  },
};

export const NegotiableBudget: Story = {
  args: {
    budget: 'Negotiable',
    viewCount: 56,
    proposalCount: 4,
  },
};

export const NoBudget: Story = {
  args: {
    viewCount: 34,
    proposalCount: 2,
  },
};

export const WithSubmitAction: Story = {
  args: {
    budget: '₾3,500',
    viewCount: 78,
    proposalCount: 6,
    actions: (
      <button
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
        style={{
          backgroundColor: '#C4735B',
          boxShadow: '0 4px 20px #C4735B40',
        }}
      >
        <Send className="w-4 h-4" />
        Submit Proposal
      </button>
    ),
  },
};

export const WithOwnerActions: Story = {
  args: {
    budget: '₾2,000',
    viewCount: 156,
    proposalCount: 15,
    actions: (
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  },
};

export const GeorgianLabels: Story = {
  args: {
    budget: '₾5,000',
    viewCount: 124,
    proposalCount: 8,
    budgetLabel: 'ბიუჯეტი',
    viewsLabel: 'ნახვა',
    proposalsLabel: 'შეთავაზება',
    actions: (
      <button
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:scale-105"
        style={{ backgroundColor: '#C4735B' }}
      >
        <Send className="w-4 h-4" />
        შეთავაზების გაგზავნა
      </button>
    ),
  },
};

export const HighStats: Story = {
  args: {
    budget: '₾25,000',
    viewCount: 1234,
    proposalCount: 45,
  },
};

export const PerSqmBudget: Story = {
  args: {
    budget: '₾150/მ²',
    viewCount: 67,
    proposalCount: 9,
  },
};
