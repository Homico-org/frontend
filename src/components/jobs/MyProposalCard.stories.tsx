import type { Meta, StoryObj } from '@storybook/nextjs';
import MyProposalCard from './MyProposalCard';

const meta: Meta<typeof MyProposalCard> = {
  title: 'Jobs/MyProposalCard',
  component: MyProposalCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MyProposalCard>;

export const Pending: Story = {
  args: {
    proposal: {
      id: '1',
      coverLetter: 'I have 10 years of experience in renovation projects. I specialize in high-quality finishes and attention to detail. I would love to work on your project and can start within the week.',
      proposedPrice: 5000,
      estimatedDuration: 14,
      estimatedDurationUnit: 'days',
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
    },
  },
};

export const Accepted: Story = {
  args: {
    proposal: {
      id: '2',
      coverLetter: 'Thank you for considering my proposal. I have extensive experience with similar projects and can guarantee excellent results.',
      proposedPrice: 3500,
      estimatedDuration: 2,
      estimatedDurationUnit: 'weeks',
      status: 'accepted',
      createdAt: '2024-01-10T10:00:00Z',
    },
  },
};

export const Rejected: Story = {
  args: {
    proposal: {
      id: '3',
      coverLetter: 'I would be happy to complete this project for you. I have all the necessary tools and skills.',
      proposedPrice: 8000,
      estimatedDuration: 1,
      estimatedDurationUnit: 'months',
      status: 'rejected',
      createdAt: '2024-01-08T10:00:00Z',
    },
  },
};

export const WithoutPrice: Story = {
  args: {
    proposal: {
      id: '4',
      coverLetter: 'The exact price will depend on the final requirements. Let me know if you would like to discuss further.',
      estimatedDuration: 3,
      estimatedDurationUnit: 'weeks',
      status: 'pending',
      createdAt: '2024-01-12T10:00:00Z',
    },
  },
};

export const WithoutDuration: Story = {
  args: {
    proposal: {
      id: '5',
      coverLetter: 'I can complete this project at your preferred timeline. Very flexible with scheduling.',
      proposedPrice: 2500,
      status: 'pending',
      createdAt: '2024-01-14T10:00:00Z',
    },
  },
};

export const CoverLetterOnly: Story = {
  args: {
    proposal: {
      id: '6',
      coverLetter: 'I am interested in this project. Let\'s discuss the details - pricing and timeline can be negotiated based on your specific requirements and preferences.',
      status: 'pending',
      createdAt: '2024-01-11T10:00:00Z',
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    proposal: {
      id: '7',
      coverLetter: 'მე მაქვს 10 წლიანი გამოცდილება სარემონტო პროექტებში. სპეციალიზირებული ვარ მაღალხარისხიან მუშაობაში.',
      proposedPrice: 5000,
      estimatedDuration: 14,
      estimatedDurationUnit: 'days',
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
    },
    locale: 'ka',
  },
};

export const LongCoverLetter: Story = {
  args: {
    proposal: {
      id: '8',
      coverLetter: 'I am writing to express my strong interest in your renovation project. With over 15 years of experience in residential and commercial renovations, I bring a comprehensive skill set that includes project management, quality craftsmanship, and excellent client communication. I have successfully completed numerous projects similar to yours, always delivering on time and within budget. My approach focuses on understanding your vision, providing transparent pricing, and ensuring the highest quality results. I use only premium materials and maintain strict quality control throughout the project. I would welcome the opportunity to discuss your project in detail and provide a more tailored proposal.',
      proposedPrice: 12500,
      estimatedDuration: 6,
      estimatedDurationUnit: 'weeks',
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
    },
  },
};
