import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import ContactModal from './ContactModal';

const meta: Meta<typeof ContactModal> = {
  title: 'Professionals/ContactModal',
  component: ContactModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContactModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSend: async (message) => {
      console.log('Message sent:', message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    name: 'John Doe',
    title: 'Interior Designer',
  },
};

export const WithAvatar: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSend: async (message) => {
      console.log('Message sent:', message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    name: 'Jane Smith',
    title: 'Renovation Specialist',
    avatar: 'https://res.cloudinary.com/dakcvkodo/image/upload/v1/homico/avatars/pro-avatar.jpg',
  },
};

export const GeorgianLocale: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSend: async (message) => {
      console.log('Message sent:', message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    name: 'გიორგი მელაძე',
    title: 'ინტერიერის დიზაინერი',
    locale: 'ka',
  },
};

export const LongTitle: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSend: async () => {},
    name: 'Alexander Maximilian Johnson III',
    title: 'Senior Interior Design Consultant & Project Manager',
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sentMessages, setSentMessages] = useState<string[]>([]);

    return (
      <div className="p-8">
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ backgroundColor: '#C4735B' }}
        >
          Open Contact Modal
        </button>

        {sentMessages.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Sent messages:
            </p>
            {sentMessages.map((msg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm"
              >
                {msg}
              </div>
            ))}
          </div>
        )}

        <ContactModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSend={async (message) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSentMessages((prev) => [...prev, message]);
          }}
          name="John Doe"
          title="Interior Designer"
        />
      </div>
    );
  },
};
