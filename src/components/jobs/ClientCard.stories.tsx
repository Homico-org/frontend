import type { Meta, StoryObj } from '@storybook/nextjs';
import ClientCard from './ClientCard';

const meta: Meta<typeof ClientCard> = {
  title: 'Jobs/ClientCard',
  component: ClientCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAF8] dark:bg-[#0D0D0C] rounded-xl min-w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClientCard>;

export const Individual: Story = {
  args: {
    client: {
      _id: '1',
      name: 'John Doe',
      city: 'Tbilisi',
      accountType: 'individual',
    },
  },
};

export const IndividualWithAvatar: Story = {
  args: {
    client: {
      _id: '2',
      name: 'Jane Smith',
      avatar: 'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/avatars/sample-avatar.jpg',
      city: 'Batumi',
      accountType: 'individual',
    },
  },
};

export const Organization: Story = {
  args: {
    client: {
      _id: '3',
      name: 'David Johnson',
      companyName: 'Tech Solutions LLC',
      city: 'Tbilisi',
      accountType: 'organization',
    },
  },
};

export const OrganizationWithAvatar: Story = {
  args: {
    client: {
      _id: '4',
      name: 'Sarah Williams',
      companyName: 'Design Studio',
      avatar: 'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/avatars/company-logo.jpg',
      city: 'Kutaisi',
      accountType: 'organization',
    },
  },
};

export const NoCity: Story = {
  args: {
    client: {
      _id: '5',
      name: 'Anonymous Client',
      accountType: 'individual',
    },
  },
};

export const GeorgianLabels: Story = {
  args: {
    client: {
      _id: '6',
      name: 'გიორგი მელაძე',
      companyName: 'სარემონტო კომპანია',
      city: 'თბილისი',
      accountType: 'organization',
    },
    label: 'დამკვეთი',
    organizationLabel: 'ორგანიზაცია',
  },
};

export const LongName: Story = {
  args: {
    client: {
      _id: '7',
      name: 'Very Long Client Name That Should Truncate Properly',
      companyName: 'International Construction and Renovation Services Corporation',
      city: 'Tbilisi, Vake District',
      accountType: 'organization',
    },
  },
};
