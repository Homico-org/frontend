import type { Meta, StoryObj } from '@storybook/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ProfileSettings from './ProfileSettings';

const meta: Meta<typeof ProfileSettings> = {
  title: 'Settings/ProfileSettings',
  component: ProfileSettings,
  decorators: [
    (Story) => (
      <LanguageProvider>
        <AuthProvider>
          <div className="max-w-2xl mx-auto p-6 bg-neutral-50 dark:bg-neutral-900 min-h-[600px]">
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
        component: 'Profile settings section with avatar upload, name, email, phone, and city editing.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileSettings>;

export const Default: Story = {
  args: {
    onOpenEmailModal: () => console.log('Open email modal'),
    onOpenPhoneModal: () => console.log('Open phone modal'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default profile settings view. Requires authentication to display user data.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    onOpenEmailModal: () => console.log('Open email modal'),
    onOpenPhoneModal: () => console.log('Open phone modal'),
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile view of profile settings.',
      },
    },
  },
};

