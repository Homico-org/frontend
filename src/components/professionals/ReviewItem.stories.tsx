import type { Meta, StoryObj } from '@storybook/nextjs';
import ReviewItem, { RatingSummary } from './ReviewItem';

const meta: Meta<typeof ReviewItem> = {
  title: 'Professionals/ReviewItem',
  component: ReviewItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-xl max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReviewItem>;

export const FiveStars: Story = {
  args: {
    review: {
      _id: '1',
      clientId: {
        name: 'John Doe',
        city: 'Tbilisi',
      },
      rating: 5,
      text: 'Excellent work! Very professional and completed the project on time. Highly recommend.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const FourStars: Story = {
  args: {
    review: {
      _id: '2',
      clientId: {
        name: 'Jane Smith',
        city: 'Batumi',
      },
      rating: 4,
      text: 'Good work overall. Some minor delays but the final result was great.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const ThreeStars: Story = {
  args: {
    review: {
      _id: '3',
      clientId: {
        name: 'Mike Johnson',
        city: 'Kutaisi',
      },
      rating: 3,
      text: 'Average experience. The work was done but took longer than expected.',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const Anonymous: Story = {
  args: {
    review: {
      _id: '4',
      clientId: {
        name: 'Hidden',
      },
      rating: 5,
      text: 'Great professional! Did an amazing job with our renovation.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isAnonymous: true,
    },
  },
};

export const WithPhotos: Story = {
  args: {
    review: {
      _id: '5',
      clientId: {
        name: 'Sarah Williams',
      },
      rating: 5,
      text: 'Amazing transformation! Check out the photos.',
      photos: [
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/sample1.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/sample2.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/sample3.jpg',
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    onPhotoClick: (photo) => console.log('Photo clicked:', photo),
  },
};

export const NoText: Story = {
  args: {
    review: {
      _id: '6',
      clientId: {
        name: 'Tom Brown',
      },
      rating: 4,
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    review: {
      _id: '7',
      clientId: {
        name: 'გიორგი მელაძე',
        city: 'თბილისი',
      },
      rating: 5,
      text: 'შესანიშნავი მუშაობა! ძალიან კმაყოფილი ვარ შედეგით.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    locale: 'ka',
  },
};

export const MultipleReviews: Story = {
  render: () => (
    <div className="space-y-4">
      <ReviewItem
        review={{
          _id: '1',
          clientId: { name: 'John Doe' },
          rating: 5,
          text: 'Excellent work!',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ReviewItem
        review={{
          _id: '2',
          clientId: { name: 'Jane Smith' },
          rating: 4,
          text: 'Good service, would recommend.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ReviewItem
        review={{
          _id: '3',
          clientId: { name: 'Anonymous' },
          rating: 5,
          isAnonymous: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
    </div>
  ),
};

// RatingSummary stories
export const RatingSummaryDefault: Story = {
  render: () => <RatingSummary avgRating={4.7} totalReviews={42} />,
};

export const RatingSummaryGeorgian: Story = {
  render: () => <RatingSummary avgRating={4.9} totalReviews={128} locale="ka" />,
};

export const RatingSummaryLowRating: Story = {
  render: () => <RatingSummary avgRating={2.5} totalReviews={8} />,
};

export const RatingSummaryWithReviews: Story = {
  render: () => (
    <div className="space-y-4">
      <RatingSummary avgRating={4.8} totalReviews={3} />
      <ReviewItem
        review={{
          _id: '1',
          clientId: { name: 'John Doe' },
          rating: 5,
          text: 'Perfect renovation!',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ReviewItem
        review={{
          _id: '2',
          clientId: { name: 'Jane Smith' },
          rating: 5,
          text: 'Highly professional.',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
      <ReviewItem
        review={{
          _id: '3',
          clientId: { name: 'Mike Johnson' },
          rating: 4,
          text: 'Good work overall.',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        }}
      />
    </div>
  ),
};
