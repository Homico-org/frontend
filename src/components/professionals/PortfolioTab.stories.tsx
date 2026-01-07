import type { Meta, StoryObj } from '@storybook/react';
import PortfolioTab from './PortfolioTab';

const meta: Meta<typeof PortfolioTab> = {
  title: 'Professionals/PortfolioTab',
  component: PortfolioTab,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Portfolio tab for professional profile page. Displays a grid of portfolio projects with images and videos.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-5xl mx-auto bg-neutral-50 dark:bg-neutral-950 p-6 min-h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PortfolioTab>;

const mockProjects = [
  {
    id: '1',
    title: 'Modern Kitchen Renovation',
    description: 'Complete kitchen remodel with custom cabinetry and marble countertops.',
    location: 'Tbilisi, Georgia',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
      'https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=800',
    ],
  },
  {
    id: '2',
    title: 'Bathroom Makeover',
    description: 'Luxury bathroom renovation with walk-in shower.',
    location: 'Batumi, Georgia',
    images: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800',
    ],
  },
  {
    id: '3',
    title: 'Living Room Redesign',
    description: 'Open concept living space with custom built-ins.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
  },
  {
    id: '4',
    title: 'Outdoor Deck Installation',
    description: 'Composite deck with pergola and outdoor kitchen.',
    location: 'Kutaisi, Georgia',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    ],
  },
];

export const Default: Story = {
  args: {
    projects: mockProjects,
    onProjectClick: (project) => console.log('Project clicked:', project),
    locale: 'en',
  },
};

export const SingleProject: Story = {
  args: {
    projects: [mockProjects[0]],
    onProjectClick: (project) => console.log('Project clicked:', project),
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Portfolio with only one project.',
      },
    },
  },
};

export const EmptyPortfolio: Story = {
  args: {
    projects: [],
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when there are no portfolio projects.',
      },
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    projects: [
      {
        id: '1',
        title: 'თანამედროვე სამზარეულოს რემონტი',
        description: 'სრული სამზარეულოს რემონტი მორგებული კარადებით.',
        location: 'თბილისი',
        images: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
          'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
        ],
      },
      {
        id: '2',
        title: 'აბაზანის რემონტი',
        description: 'ლუქს აბაზანის რემონტი.',
        images: [
          'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
        ],
      },
    ],
    onProjectClick: (project) => console.log('Project clicked:', project),
    locale: 'ka',
  },
  parameters: {
    docs: {
      description: {
        story: 'Portfolio tab in Georgian language.',
      },
    },
  },
};

export const ManyProjects: Story = {
  args: {
    projects: [
      ...mockProjects,
      {
        id: '5',
        title: 'Master Bedroom Suite',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
      },
      {
        id: '6',
        title: 'Home Office',
        images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'],
      },
    ],
    onProjectClick: (project) => console.log('Project clicked:', project),
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Portfolio with many projects to test grid layout.',
      },
    },
  },
};

