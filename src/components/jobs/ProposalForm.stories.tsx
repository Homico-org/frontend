import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import ProposalForm, { ProposalFormData } from './ProposalForm';

const meta: Meta<typeof ProposalForm> = {
  title: 'Jobs/ProposalForm',
  component: ProposalForm,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProposalForm>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async (data: ProposalFormData) => {
      console.log('Submitted:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithError: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    error: 'Failed to submit proposal. Please try again.',
  },
};

export const GeorgianLocale: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async (data: ProposalFormData) => {
      console.log('Submitted:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    locale: 'ka',
  },
};

export const GeorgianWithError: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    error: 'წინადადების გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.',
    locale: 'ka',
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState<ProposalFormData | null>(null);

    return (
      <div className="p-8">
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ backgroundColor: '#C4735B' }}
        >
          Open Proposal Form
        </button>

        {submitted && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
              Proposal Submitted!
            </h3>
            <pre className="text-sm text-emerald-700 dark:text-emerald-400 overflow-auto">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </div>
        )}

        <ProposalForm
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setError('');
          }}
          onSubmit={async (data) => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 20% chance of error for demo
            if (Math.random() < 0.2) {
              setError('Failed to submit proposal. Please try again.');
              throw new Error('Simulated error');
            }

            setSubmitted(data);
            setIsOpen(false);
            setError('');
          }}
          error={error}
        />
      </div>
    );
  },
};
