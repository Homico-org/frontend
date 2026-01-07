import type { Meta, StoryObj } from '@storybook/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import PaymentSettings from './PaymentSettings';

const meta: Meta<typeof PaymentSettings> = {
  title: 'Settings/PaymentSettings',
  component: PaymentSettings,
  decorators: [
    (Story) => (
      <LanguageProvider>
        <AuthProvider>
          <div className="max-w-2xl mx-auto p-6 bg-neutral-50 dark:bg-neutral-900 min-h-[400px]">
            <Story />
          </div>
        </AuthProvider>
      </LanguageProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Payment settings section for managing payment methods (cards).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PaymentSettings>;

export const Default: Story = {
  args: {
    onOpenAddCardModal: () => console.log('Open add card modal'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default payment settings view. Shows saved payment methods or empty state.',
      },
    },
  },
};

