import type { Meta, StoryObj } from '@storybook/react';
import AboutTab from './AboutTab';

const meta: Meta<typeof AboutTab> = {
  title: 'Professionals/AboutTab',
  component: AboutTab,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'About tab for professional profile page. Shows description, services, skills, and social links.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto bg-neutral-50 dark:bg-neutral-950 p-6 min-h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AboutTab>;

const mockGroupedServices = {
  renovation: ['painting', 'flooring', 'tiling'],
  plumbing: ['pipe_repair', 'installation'],
};

const mockGetCategoryLabel = (key: string) => {
  const labels: Record<string, string> = {
    renovation: 'Renovation',
    plumbing: 'Plumbing',
  };
  return labels[key] || key;
};

const mockGetSubcategoryLabel = (key: string) => {
  const labels: Record<string, string> = {
    painting: 'Painting',
    flooring: 'Flooring',
    tiling: 'Tiling',
    pipe_repair: 'Pipe Repair',
    installation: 'Installation',
  };
  return labels[key] || key;
};

export const Default: Story = {
  args: {
    bio: 'Experienced professional with over 10 years in home renovation. Specializing in kitchen and bathroom remodeling, I take pride in delivering high-quality work that exceeds client expectations. Every project is treated with care and attention to detail.',
    customServices: ['Kitchen Remodeling', 'Bathroom Renovation', 'Custom Cabinetry', 'Tile Work'],
    groupedServices: mockGroupedServices,
    getCategoryLabel: mockGetCategoryLabel,
    getSubcategoryLabel: mockGetSubcategoryLabel,
    whatsapp: '+995555123456',
    telegram: '@professional',
    facebookUrl: 'https://facebook.com/professional',
    instagramUrl: 'https://instagram.com/professional',
    linkedinUrl: 'https://linkedin.com/in/professional',
    websiteUrl: 'https://professional.com',
    locale: 'en',
  },
};

export const MinimalInfo: Story = {
  args: {
    bio: 'Professional handyman offering various home repair services.',
    groupedServices: {},
    getCategoryLabel: mockGetCategoryLabel,
    getSubcategoryLabel: mockGetSubcategoryLabel,
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'About tab with only a description, no services or social links.',
      },
    },
  },
};

export const WithServicesOnly: Story = {
  args: {
    bio: 'Expert electrician with 15 years of experience.',
    customServices: ['Electrical Wiring', 'Panel Upgrades', 'Smart Home Installation'],
    groupedServices: mockGroupedServices,
    getCategoryLabel: mockGetCategoryLabel,
    getSubcategoryLabel: mockGetSubcategoryLabel,
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'About tab with description and custom services, no social links.',
      },
    },
  },
};

export const GeorgianLocale: Story = {
  args: {
    bio: 'გამოცდილი პროფესიონალი 10 წელზე მეტი გამოცდილებით სახლის რემონტში. სპეციალიზირებული სამზარეულოს და აბაზანის რემონტში.',
    customServices: ['სამზარეულოს რემონტი', 'აბაზანის რემონტი', 'ფილების დაგება'],
    groupedServices: {
      renovation: ['painting', 'flooring'],
    },
    getCategoryLabel: (key: string) => key === 'renovation' ? 'რემონტი' : key,
    getSubcategoryLabel: (key: string) => {
      const labels: Record<string, string> = {
        painting: 'შეღებვა',
        flooring: 'იატაკის დაგება',
      };
      return labels[key] || key;
    },
    whatsapp: '+995555123456',
    telegram: '@professional',
    locale: 'ka',
  },
  parameters: {
    docs: {
      description: {
        story: 'About tab in Georgian language.',
      },
    },
  },
};

export const NoDescription: Story = {
  args: {
    customServices: ['Service 1', 'Service 2'],
    groupedServices: mockGroupedServices,
    getCategoryLabel: mockGetCategoryLabel,
    getSubcategoryLabel: mockGetSubcategoryLabel,
    whatsapp: '+995555123456',
    locale: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'About tab without a description.',
      },
    },
  },
};

