import type { Meta, StoryObj } from '@storybook/nextjs';
import SocialLinks from './SocialLinks';

const meta: Meta<typeof SocialLinks> = {
  title: 'Professionals/SocialLinks',
  component: SocialLinks,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-xl min-w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SocialLinks>;

export const AllLinks: Story = {
  args: {
    facebookUrl: 'https://facebook.com/johndoe',
    instagramUrl: 'https://instagram.com/johndoe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    websiteUrl: 'https://johndoe.com',
  },
};

export const FacebookOnly: Story = {
  args: {
    facebookUrl: 'https://facebook.com/johndoe',
  },
};

export const InstagramOnly: Story = {
  args: {
    instagramUrl: 'https://instagram.com/johndoe',
  },
};

export const LinkedinOnly: Story = {
  args: {
    linkedinUrl: 'https://linkedin.com/in/johndoe',
  },
};

export const WebsiteOnly: Story = {
  args: {
    websiteUrl: 'https://johndoe.com',
  },
};

export const FacebookAndInstagram: Story = {
  args: {
    facebookUrl: 'https://facebook.com/johndoe',
    instagramUrl: 'https://instagram.com/johndoe',
  },
};

export const GeorgianLabel: Story = {
  args: {
    facebookUrl: 'https://facebook.com/giorgi',
    instagramUrl: 'https://instagram.com/giorgi',
    websiteUrl: 'https://giorgi.ge',
    label: 'სოციალური',
  },
};

export const NoLinks: Story = {
  args: {},
  render: () => (
    <div className="text-sm text-neutral-500">
      (SocialLinks returns null when no links provided)
    </div>
  ),
};
