import type { Meta, StoryObj } from '@storybook/react';
import EmailChangeModal from './EmailChangeModal';
import { useState } from 'react';

const meta: Meta<typeof EmailChangeModal> = {
  title: 'Settings/EmailChangeModal',
  component: EmailChangeModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal for changing/adding email address with OTP verification.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    currentEmail: {
      control: 'text',
      description: 'The current email address (empty for adding new)',
    },
    locale: {
      control: 'radio',
      options: ['en', 'ka'],
      description: 'Language locale',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmailChangeModal>;

// Wrapper to handle state
const EmailChangeModalWrapper = ({ 
  currentEmail = '',
  locale = 'en',
}: { 
  currentEmail?: string;
  locale?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="min-h-[600px] min-w-[500px] flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-8">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#E07B4F] text-white rounded-lg font-medium"
      >
        Open Email Modal
      </button>
      <EmailChangeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentEmail={currentEmail}
        locale={locale}
        onSuccess={(newEmail) => {
          console.log('Email changed to:', newEmail);
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export const AddEmail: Story = {
  render: () => <EmailChangeModalWrapper currentEmail="" locale="en" />,
  parameters: {
    docs: {
      description: {
        story: 'Adding a new email address when none exists.',
      },
    },
  },
};

export const ChangeEmail: Story = {
  render: () => <EmailChangeModalWrapper currentEmail="user@example.com" locale="en" />,
  parameters: {
    docs: {
      description: {
        story: 'Changing an existing email address.',
      },
    },
  },
};

export const GeorgianLocale: Story = {
  render: () => <EmailChangeModalWrapper currentEmail="user@example.com" locale="ka" />,
  parameters: {
    docs: {
      description: {
        story: 'Modal in Georgian language.',
      },
    },
  },
};

export const AddEmailGeorgian: Story = {
  render: () => <EmailChangeModalWrapper currentEmail="" locale="ka" />,
  parameters: {
    docs: {
      description: {
        story: 'Adding a new email in Georgian language.',
      },
    },
  },
};

