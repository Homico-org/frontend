import type { Meta, StoryObj } from '@storybook/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AccountSettings from './AccountSettings';

const meta: Meta<typeof AccountSettings> = {
  title: 'Settings/AccountSettings',
  component: AccountSettings,
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
        component: 'Account settings section with profile deactivation (for pros) and account deletion options.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AccountSettings>;

export const Default: Story = {
  args: {
    onOpenDeleteModal: () => console.log('Open delete modal'),
    onOpenDeactivateModal: () => console.log('Open deactivate modal'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default account settings view. Shows deactivation options for pro users.',
      },
    },
  },
};

