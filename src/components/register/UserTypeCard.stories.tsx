import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import UserTypeCard from './UserTypeCard';

const meta: Meta<typeof UserTypeCard> = {
  title: 'Register/UserTypeCard',
  component: UserTypeCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['client', 'pro'],
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-gradient-to-br from-[#FBF9F7] to-[#F5F0EC] min-h-[600px] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserTypeCard>;

export const ClientCard: Story = {
  args: {
    type: 'client',
    title: 'Client',
    description: 'Find the best professionals for your project',
    ctaText: 'Get Started',
    freeLabel: 'Free',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png',
    onClick: () => alert("Client card clicked!"),
  },
};

export const ProCard: Story = {
  args: {
    type: 'pro',
    title: 'Professional',
    description: 'Create your profile and find new clients',
    ctaText: 'Join Now',
    badge: 'Earn Money',
    freeLabel: 'Free profile',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
    onClick: () => alert("Pro card clicked!"),
  },
};

export const GeorgianClient: Story = {
  args: {
    type: 'client',
    title: 'კლიენტი',
    description: 'იპოვე საუკეთესო პროფესიონალები შენი პროექტისთვის',
    ctaText: 'დაწყება',
    freeLabel: 'უფასო',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png',
    onClick: () => {},
    locale: 'ka',
  },
};

export const GeorgianPro: Story = {
  args: {
    type: 'pro',
    title: 'პროფესიონალი',
    description: 'შექმენი პროფილი და იპოვე ახალი კლიენტები',
    ctaText: 'გაწევრიანება',
    badge: 'გამოიმუშავე',
    freeLabel: 'უფასო პროფილი',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
    onClick: () => {},
    locale: 'ka',
  },
};

export const SideBySide: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 bg-gradient-to-br from-[#FBF9F7] to-[#F5F0EC] min-h-[600px] flex items-center justify-center">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <UserTypeCard
            type="client"
            title="Client"
            description="Find the best professionals for your project"
            ctaText="Get Started"
            freeLabel="Free"
            imageUrl="https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png"
            onClick={() => alert('common.client')}
          />
          <UserTypeCard
            type="pro"
            title="Professional"
            description="Create your profile and find new clients"
            ctaText="Join Now"
            badge="Earn Money"
            freeLabel="Free profile"
            imageUrl="https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png"
            onClick={() => alert("Pro")}
          />
        </div>
      </div>
    ),
  ],
  render: () => <></>,
};

// Compact variant stories
export const CompactClientSelected: Story = {
  args: {
    type: 'client',
    variant: 'compact',
    title: 'Client',
    description: 'Find specialists',
    ctaText: 'Get Started',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png',
    onClick: () => {},
    selected: true,
  },
};

export const CompactClientUnselected: Story = {
  args: {
    type: 'client',
    variant: 'compact',
    title: 'Client',
    description: 'Find specialists',
    ctaText: 'Get Started',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png',
    onClick: () => {},
    selected: false,
  },
};

export const CompactProSelected: Story = {
  args: {
    type: 'pro',
    variant: 'compact',
    title: 'Professional',
    description: 'Get hired',
    ctaText: 'Join Now',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
    onClick: () => {},
    selected: true,
  },
};

export const CompactProUnselected: Story = {
  args: {
    type: 'pro',
    variant: 'compact',
    title: 'Professional',
    description: 'Get hired',
    ctaText: 'Join Now',
    imageUrl: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
    onClick: () => {},
    selected: false,
  },
};

export const CompactInteractive: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 bg-gradient-to-br from-[#FBF9F7] to-[#F5F0EC] min-h-[300px] flex items-center justify-center">
        <div className="w-full max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
  render: () => {
    const [selected, setSelected] = useState<'client' | 'pro'>('client');
    return (
      <div className="bg-neutral-100 p-1.5 rounded-2xl">
        <div className="grid grid-cols-2 gap-1">
          <UserTypeCard
            type="client"
            variant="compact"
            title="Client"
            description="Find specialists"
            ctaText="Get Started"
            imageUrl="https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png"
            onClick={() => setSelected('client')}
            selected={selected === 'client'}
          />
          <UserTypeCard
            type="pro"
            variant="compact"
            title="Professional"
            description="Get hired"
            ctaText="Join Now"
            imageUrl="https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png"
            onClick={() => setSelected('pro')}
            selected={selected === 'pro'}
          />
        </div>
      </div>
    );
  },
};
