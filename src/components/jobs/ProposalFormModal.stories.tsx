import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import ProposalFormModal from './ProposalFormModal';

const meta: Meta<typeof ProposalFormModal> = {
  title: 'Jobs/ProposalFormModal',
  component: ProposalFormModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
    isSubmitting: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProposalFormModal>;

const defaultProposalData = {
  coverLetter: '',
  proposedPrice: '',
  estimatedDuration: '',
  estimatedDurationUnit: 'days',
};

// Interactive wrapper for stories
const ProposalFormModalWrapper = ({
  locale = 'en',
  initialData = defaultProposalData,
  initialError,
}: {
  locale?: string;
  initialData?: typeof defaultProposalData;
  initialError?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [proposalData, setProposalData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsOpen(false);
    alert(
      `Proposal submitted!\nCover Letter: ${proposalData.coverLetter}\nPrice: ${proposalData.proposedPrice}₾\nDuration: ${proposalData.estimatedDuration} ${proposalData.estimatedDurationUnit}`
    );
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setProposalData(defaultProposalData);
            setError(undefined);
          }}
          className="px-4 py-2 bg-[#E07B4F] text-white rounded-lg hover:bg-[#D26B3F] transition-colors"
        >
          Open Proposal Form
        </button>
      )}
      <ProposalFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        locale={locale}
        proposalData={proposalData}
        onDataChange={setProposalData}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <ProposalFormModalWrapper />,
};

export const GeorgianLocale: Story = {
  render: () => <ProposalFormModalWrapper locale="ka" />,
};

export const WithInitialData: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialData={{
        coverLetter:
          'I have 5 years of experience in interior design and have completed similar projects. I specialize in modern minimalist designs and can deliver high-quality work within your timeline.',
        proposedPrice: '2500',
        estimatedDuration: '2',
        estimatedDurationUnit: 'weeks',
      }}
    />
  ),
};

export const WithInitialDataGeorgian: Story = {
  render: () => (
    <ProposalFormModalWrapper
      locale="ka"
      initialData={{
        coverLetter:
          'მე მაქვს 5 წლიანი გამოცდილება ინტერიერის დიზაინში და დასრულებული მაქვს მსგავსი პროექტები. სპეციალიზებული ვარ თანამედროვე მინიმალისტურ დიზაინში.',
        proposedPrice: '3000',
        estimatedDuration: '3',
        estimatedDurationUnit: 'weeks',
      }}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialError="Failed to submit proposal. Please try again."
    />
  ),
};

export const WithErrorGeorgian: Story = {
  render: () => (
    <ProposalFormModalWrapper
      locale="ka"
      initialError="წინადადების გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან."
    />
  ),
};

export const Submitting: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: () => {},
    isSubmitting: true,
    locale: 'en',
    proposalData: {
      coverLetter: 'I would love to work on this project!',
      proposedPrice: '1500',
      estimatedDuration: '5',
      estimatedDurationUnit: 'days',
    },
    onDataChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: () => {},
    isSubmitting: false,
    locale: 'en',
    proposalData: defaultProposalData,
    onDataChange: () => {},
  },
};

export const LargePrice: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialData={{
        coverLetter: 'Premium service package with comprehensive design.',
        proposedPrice: '15000000',
        estimatedDuration: '6',
        estimatedDurationUnit: 'months',
      }}
    />
  ),
};

export const DurationInDays: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialData={{
        ...defaultProposalData,
        estimatedDuration: '3',
        estimatedDurationUnit: 'days',
      }}
    />
  ),
};

export const DurationInWeeks: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialData={{
        ...defaultProposalData,
        estimatedDuration: '2',
        estimatedDurationUnit: 'weeks',
      }}
    />
  ),
};

export const DurationInMonths: Story = {
  render: () => (
    <ProposalFormModalWrapper
      initialData={{
        ...defaultProposalData,
        estimatedDuration: '3',
        estimatedDurationUnit: 'months',
      }}
    />
  ),
};
