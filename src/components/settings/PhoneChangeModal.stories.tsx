import type { Meta, StoryObj } from '@storybook/react';
import PhoneChangeModal from './PhoneChangeModal';
import { useState } from 'react';

const meta: Meta<typeof PhoneChangeModal> = {
  title: 'Settings/PhoneChangeModal',
  component: PhoneChangeModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal for changing phone number with OTP verification via SMS.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    currentPhone: {
      control: 'text',
      description: 'The current phone number',
    },
    locale: {
      control: 'radio',
      options: ['en', 'ka'],
      description: 'Language locale',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PhoneChangeModal>;

// Wrapper to handle state
const PhoneChangeModalWrapper = ({ 
  currentPhone = '',
  locale = 'en',
}: { 
  currentPhone?: string;
  locale?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="min-h-[600px] min-w-[500px] flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-8">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#E07B4F] text-white rounded-lg font-medium"
      >
        Open Phone Modal
      </button>
      <PhoneChangeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentPhone={currentPhone}
        locale={locale}
        onSuccess={(newPhone) => {
          console.log('Phone changed to:', newPhone);
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export const ChangePhone: Story = {
  render: () => <PhoneChangeModalWrapper currentPhone="+995 555 123 456" locale="en" />,
  parameters: {
    docs: {
      description: {
        story: 'Changing an existing phone number.',
      },
    },
  },
};

export const AddPhone: Story = {
  render: () => <PhoneChangeModalWrapper currentPhone="" locale="en" />,
  parameters: {
    docs: {
      description: {
        story: 'Adding a phone number when none exists.',
      },
    },
  },
};

export const GeorgianLocale: Story = {
  render: () => <PhoneChangeModalWrapper currentPhone="+995 555 123 456" locale="ka" />,
  parameters: {
    docs: {
      description: {
        story: 'Modal in Georgian language.',
      },
    },
  },
};

export const AddPhoneGeorgian: Story = {
  render: () => <PhoneChangeModalWrapper currentPhone="" locale="ka" />,
  parameters: {
    docs: {
      description: {
        story: 'Adding a phone number in Georgian language.',
      },
    },
  },
};

