import type { Meta, StoryObj } from '@storybook/nextjs';
import PortfolioCard, { EmptyPortfolio } from './PortfolioCard';

const meta: Meta<typeof PortfolioCard> = {
  title: 'Professionals/PortfolioCard',
  component: PortfolioCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-xl max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PortfolioCard>;

export const SingleImage: Story = {
  args: {
    project: {
      id: '1',
      title: 'Modern Kitchen Renovation',
      description: 'Complete kitchen remodel with custom cabinetry and marble countertops.',
      location: 'Tbilisi, Vake',
      images: ['https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/kitchen1.jpg'],
    },
    onClick: (idx) => console.log('Clicked image:', idx),
  },
};

export const MultipleImages: Story = {
  args: {
    project: {
      id: '2',
      title: 'Bathroom Remodel',
      description: 'Luxury bathroom with walk-in shower and freestanding tub.',
      location: 'Batumi',
      images: [
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/bath1.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/bath2.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/bath3.jpg',
      ],
    },
    onClick: (idx) => console.log('Clicked image:', idx),
  },
};

export const ManyImages: Story = {
  args: {
    project: {
      id: '3',
      title: 'Full Apartment Renovation',
      description: 'Complete transformation of a 120sqm apartment.',
      location: 'Tbilisi, Saburtalo',
      images: [
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt1.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt2.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt3.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt4.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt5.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt6.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/apt7.jpg',
      ],
    },
    onClick: (idx) => console.log('Clicked image:', idx),
  },
};

export const NoDescription: Story = {
  args: {
    project: {
      id: '4',
      title: 'Office Space Design',
      location: 'Tbilisi',
      images: [
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/office1.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/office2.jpg',
      ],
    },
  },
};

export const NoLocation: Story = {
  args: {
    project: {
      id: '5',
      title: 'Living Room Makeover',
      description: 'Cozy living space with custom built-ins.',
      images: ['https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/living1.jpg'],
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    project: {
      id: '6',
      title: 'სამზარეულოს რემონტი',
      description: 'თანამედროვე სამზარეულო მაღალი ხარისხის მასალებით.',
      location: 'თბილისი, ვაკე',
      images: [
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/kitchen2.jpg',
        'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/kitchen3.jpg',
      ],
    },
    locale: 'ka',
  },
};

export const PortfolioGrid: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-xl max-w-4xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <PortfolioCard
        project={{
          id: '1',
          title: 'Kitchen Renovation',
          description: 'Modern kitchen with island.',
          images: ['https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/k1.jpg'],
        }}
      />
      <PortfolioCard
        project={{
          id: '2',
          title: 'Bathroom Remodel',
          images: [
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/b1.jpg',
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/b2.jpg',
          ],
        }}
      />
      <PortfolioCard
        project={{
          id: '3',
          title: 'Living Room',
          description: 'Complete redesign.',
          location: 'Tbilisi',
          images: [
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/l1.jpg',
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/l2.jpg',
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/l3.jpg',
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/l4.jpg',
            'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/portfolio/l5.jpg',
          ],
        }}
      />
    </div>
  ),
};

// Empty state
export const Empty: Story = {
  render: () => <EmptyPortfolio />,
};

export const EmptyGeorgian: Story = {
  render: () => <EmptyPortfolio locale="ka" />,
};
