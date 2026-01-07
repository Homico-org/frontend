import type { Meta, StoryObj } from '@storybook/react';
import ReviewsTab from './ReviewsTab';

const meta: Meta<typeof ReviewsTab> = {
  title: 'Professionals/ReviewsTab',
  component: ReviewsTab,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Reviews tab for professional profile page. Shows rating summary and list of reviews.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto bg-neutral-50 dark:bg-neutral-950 p-6 min-h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReviewsTab>;

const mockReviews = [
  {
    _id: '1',
    clientId: {
      name: 'John Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    rating: 5,
    text: 'Excellent work! Very professional and completed the job on time. Highly recommend for any renovation project.',
    photos: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400',
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isAnonymous: false,
  },
  {
    _id: '2',
    clientId: {
      name: 'Anonymous',
    },
    rating: 4,
    text: 'Good quality work. Communication could be better but overall satisfied with the result.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isAnonymous: true,
  },
  {
    _id: '3',
    clientId: {
      name: 'Maria Garcia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    rating: 5,
    text: 'Amazing attention to detail. The kitchen renovation exceeded our expectations.',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isAnonymous: false,
  },
  {
    _id: '4',
    clientId: {
      name: 'David Chen',
    },
    rating: 4,
    text: 'Professional service. Would hire again.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isAnonymous: false,
  },
];

export const Default: Story = {
  args: {
    reviews: mockReviews,
    avgRating: 4.5,
    totalReviews: 24,
    onPhotoClick: (photo) => console.log('Photo clicked:', photo),
    locale: 'en',
  },
};

export const SingleReview: Story = {
  args: {
    reviews: [mockReviews[0]],
    avgRating: 5.0,
    totalReviews: 1,
    onPhotoClick: (photo) => console.log('Photo clicked:', photo),
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Reviews tab with only one review.',
      },
    },
  },
};

export const NoReviews: Story = {
  args: {
    reviews: [],
    avgRating: 0,
    totalReviews: 0,
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when there are no reviews.',
      },
    },
  },
};

export const HighRating: Story = {
  args: {
    reviews: mockReviews.filter((r) => r.rating === 5),
    avgRating: 5.0,
    totalReviews: 2,
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Reviews tab with perfect 5-star rating.',
      },
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    reviews: [
      {
        _id: '1',
        clientId: {
          name: 'გიორგი',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        },
        rating: 5,
        text: 'შესანიშნავი სამუშაო! ძალიან პროფესიონალი და სამუშაო დროზე დაასრულა.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isAnonymous: false,
      },
      {
        _id: '2',
        clientId: {
          name: 'ანონიმური',
        },
        rating: 4,
        text: 'კარგი ხარისხის სამუშაო.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isAnonymous: true,
      },
    ],
    avgRating: 4.5,
    totalReviews: 12,
    locale: 'ka',
  },
  parameters: {
    docs: {
      description: {
        story: 'Reviews tab in Georgian language.',
      },
    },
  },
};

export const ManyReviews: Story = {
  args: {
    reviews: [
      ...mockReviews,
      {
        _id: '5',
        clientId: { name: 'Alex Johnson' },
        rating: 5,
        text: 'Best contractor I have ever worked with.',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        isAnonymous: false,
      },
      {
        _id: '6',
        clientId: { name: 'Sarah Williams' },
        rating: 4,
        text: 'Great work on our bathroom renovation.',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        isAnonymous: false,
      },
    ],
    avgRating: 4.7,
    totalReviews: 156,
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Reviews tab with many reviews.',
      },
    },
  },
};

