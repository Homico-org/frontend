import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProProfile, ProStatus, AccountType, UserRole, VerificationStatus } from '@/types';
import ProCard from './ProCard';

const meta: Meta<typeof ProCard> = {
  title: 'Common/ProCard',
  component: ProCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-[280px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'horizontal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProCard>;

// Create a complete mock profile for stories
const baseProfile: ProProfile = {
  id: '1',
  name: 'Giorgi Kapanadze',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  status: ProStatus.ACTIVE,
  avgRating: 4.9,
  totalReviews: 47,
  yearsExperience: 8,
  completedProjects: 23,
  completedJobs: 23,
  selectedCategories: ['design'],
  selectedSubcategories: ['interior', 'residential', 'commercial'],
  categories: ['design'],
  subcategories: ['interior', 'residential', 'commercial'],
  verificationStatus: VerificationStatus.VERIFIED,
  isPremium: false,
  // Required fields with defaults
  accountType: AccountType.INDIVIDUAL,
  availability: ['weekdays'],
  cadastralVerified: false,
  certifications: [],
  city: 'Tbilisi',
  companies: [],
  createdAt: new Date().toISOString(),
  designStyles: [],
  email: 'giorgi@example.com',
  isActive: true,
  isAvailable: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  languages: ['ka', 'en'],
  lastLoginAt: new Date().toISOString(),
  paymentMethods: [],
  phone: '+995555123456',
  pinterestLinks: [],
  portfolioImages: [],
  portfolioProjects: [],
  premiumTier: '',
  profileType: 'individual',
  role: UserRole.PRO,
  serviceAreas: ['Tbilisi'],
  statusAutoSuggested: false,
  telegram: '',
  whatsapp: '',
};

export const Default: Story = {
  args: {
    profile: baseProfile,
  },
};

export const Premium: Story = {
  args: {
    profile: {
      ...baseProfile,
      isPremium: true,
    },
  },
};

export const TopRated: Story = {
  args: {
    profile: {
      ...baseProfile,
      avgRating: 4.9,
      completedProjects: 50,
    },
  },
};

export const NewProfessional: Story = {
  args: {
    profile: {
      ...baseProfile,
      totalReviews: 0,
      avgRating: 0,
      completedProjects: 0,
      completedJobs: 0,
    },
  },
};

export const BusyStatus: Story = {
  args: {
    profile: {
      ...baseProfile,
      status: ProStatus.BUSY,
    },
  },
};

export const AwayStatus: Story = {
  args: {
    profile: {
      ...baseProfile,
      status: ProStatus.AWAY,
    },
  },
};

export const NoAvatar: Story = {
  args: {
    profile: {
      ...baseProfile,
      avatar: '',
    },
  },
};

export const NotVerified: Story = {
  args: {
    profile: {
      ...baseProfile,
      verificationStatus: VerificationStatus.PENDING,
    },
  },
};

export const HorizontalVariant: Story = {
  args: {
    profile: baseProfile,
    variant: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const HorizontalPremium: Story = {
  args: {
    profile: {
      ...baseProfile,
      isPremium: true,
    },
    variant: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-[600px]">
      <ProCard
        profile={{
          ...baseProfile,
          name: 'Ana Beridze',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
          isPremium: true,
        }}
      />
      <ProCard
        profile={{
          ...baseProfile,
          id: '2',
          name: 'Levan Tsiklauri',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
          status: ProStatus.BUSY,
          selectedCategories: ['craftsmen'],
        }}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};
