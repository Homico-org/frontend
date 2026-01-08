import type { Meta, StoryObj } from '@storybook/nextjs';
import ServiceCard from './ServiceCard';

const meta: Meta<typeof ServiceCard> = {
  title: 'Common/ServiceCard',
  component: ServiceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServiceCard>;

const baseService = {
  id: '1',
  title: 'Complete Interior Design Package - Modern Living Space Transformation',
  category: 'design',
  gallery: [
    { type: 'image', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=300&fit=crop' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop' },
  ],
  packages: [
    { name: 'Basic', price: 500, deliveryDays: 7 },
    { name: 'Standard', price: 1200, deliveryDays: 14 },
    { name: 'Premium', price: 2500, deliveryDays: 21 },
  ],
  avgRating: 4.9,
  totalReviews: 47,
  totalOrders: 123,
  proId: {
    id: 'pro1',
    userId: {
      name: 'Ana Beridze',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    title: 'Senior Interior Designer',
    avgRating: 4.9,
    isAvailable: true,
  },
};

export const Default: Story = {
  args: {
    service: baseService,
  },
};

export const TopRatedPro: Story = {
  args: {
    service: {
      ...baseService,
      proId: {
        ...baseService.proId,
        avgRating: 4.9,
      },
    },
  },
};

export const NotAvailable: Story = {
  args: {
    service: {
      ...baseService,
      proId: {
        ...baseService.proId,
        isAvailable: false,
      },
    },
  },
};

export const NoAvatar: Story = {
  args: {
    service: {
      ...baseService,
      proId: {
        ...baseService.proId,
        userId: {
          name: 'John Doe',
          avatar: undefined,
        },
      },
    },
  },
};

export const NoOrders: Story = {
  args: {
    service: {
      ...baseService,
      totalOrders: 0,
    },
  },
};

export const SingleImage: Story = {
  args: {
    service: {
      ...baseService,
      gallery: [baseService.gallery[0]],
    },
  },
};

export const NoImages: Story = {
  args: {
    service: {
      ...baseService,
      gallery: [],
    },
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-[700px]">
      <ServiceCard service={baseService} />
      <ServiceCard
        service={{
          ...baseService,
          id: '2',
          title: 'Professional Kitchen Renovation & Design',
          category: 'craftsmen',
          packages: [
            { name: 'Basic', price: 2000, deliveryDays: 14 },
          ],
          gallery: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
          ],
          proId: {
            id: 'pro2',
            userId: {
              name: 'Giorgi K.',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            },
            title: 'Master Craftsman',
            avgRating: 4.7,
            isAvailable: true,
          },
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
