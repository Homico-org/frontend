import type { Job } from '@/types/shared';
import type { Meta, StoryObj } from '@storybook/nextjs';
import JobCard from './JobCard';

const meta: Meta<typeof JobCard> = {
  title: 'Common/JobCard',
  component: JobCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-[380px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobCard>;

const baseJob: Job = {
  id: '1',
  title: 'Kitchen Renovation Project',
  description: 'Looking for an experienced contractor to renovate our kitchen. Need new cabinets, countertops, and flooring.',
  category: 'craftsmen',
  subcategory: 'renovation',
  skills: ['renovation', 'carpentry'],
  location: 'Tbilisi, Vake',
  propertyType: 'apartment',
  budgetType: 'fixed',
  budgetAmount: 5000,
  status: 'open' as const,
  images: [],
  media: [],
  proposalCount: 8,
  viewCount: 156,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  clientId: {
    id: 'client1',
    name: 'John Smith',
    city: 'Tbilisi',
  },
};

export const Default: Story = {
  args: {
    job: baseJob,
  },
};

export const WithImages: Story = {
  args: {
    job: {
      ...baseJob,
      images: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop',
      ],
    },
  },
};

export const NewJob: Story = {
  args: {
    job: {
      ...baseJob,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    },
  },
};

export const UrgentJob: Story = {
  args: {
    job: {
      ...baseJob,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    },
  },
};

export const RangeBudget: Story = {
  args: {
    job: {
      ...baseJob,
      budgetType: 'range',
      budgetMin: 3000,
      budgetMax: 8000,
      budgetAmount: undefined,
    },
  },
};

export const NegotiableBudget: Story = {
  args: {
    job: {
      ...baseJob,
      budgetType: 'negotiable',
      budgetAmount: undefined,
    },
  },
};

export const Saved: Story = {
  args: {
    job: baseJob,
    isSaved: true,
    onSave: () => aler"Toggle save",
  },
};

export const Applied: Story = {
  args: {
    job: baseJob,
    hasApplied: true,
  },
};

export const NoProposals: Story = {
  args: {
    job: {
      ...baseJob,
      proposalCount: 0,
      viewCount: 12,
    },
  },
};

export const WithClientAvatar: Story = {
  args: {
    job: {
      ...baseJob,
      clientId: {
        id: 'client1',
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        city: 'Batumi',
      },
    },
  },
};

export const OrganizationClient: Story = {
  args: {
    job: {
      ...baseJob,
      clientId: {
        id: 'client1',
        name: 'Acme Corp',
        accountType: 'organization' as const,
        companyName: 'Acme Corporation',
        city: 'Tbilisi',
      },
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid gap-4 max-w-[800px]" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      <JobCard
        job={{
          ...baseJob,
          title: 'Bathroom Plumbing Repair',
          category: 'craftsmen',
          budgetAmount: 800,
          proposalCount: 3,
        }}
      />
      <JobCard
        job={{
          ...baseJob,
          id: '2',
          title: 'Interior Design Consultation',
          category: 'design',
          budgetType: 'range',
          budgetMin: 2000,
          budgetMax: 5000,
          images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=300&fit=crop'],
        }}
      />
    </div>
  ),
};
