import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import NotificationSettings from './NotificationSettings';

const meta: Meta<typeof NotificationSettings> = {
  title: 'Settings/NotificationSettings',
  component: NotificationSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
    isLoading: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationSettings>;

interface NotificationData {
  email: string | null;
  isEmailVerified: boolean;
  phone: string | null;
  isPhoneVerified: boolean;
  preferences: {
    email: {
      enabled: boolean;
      newJobs: boolean;
      proposals: boolean;
      messages: boolean;
      marketing: boolean;
    };
    push: {
      enabled: boolean;
      newJobs: boolean;
      proposals: boolean;
      messages: boolean;
    };
    sms: {
      enabled: boolean;
      proposals: boolean;
      messages: boolean;
    };
  };
}

const defaultNotificationData: NotificationData = {
  email: 'user@example.com',
  isEmailVerified: true,
  phone: '+995 555 123 456',
  isPhoneVerified: true,
  preferences: {
    email: {
      enabled: true,
      newJobs: true,
      proposals: true,
      messages: true,
      marketing: false,
    },
    push: {
      enabled: true,
      newJobs: true,
      proposals: true,
      messages: true,
    },
    sms: {
      enabled: false,
      proposals: true,
      messages: true,
    },
  },
};

// Interactive wrapper
const NotificationSettingsWrapper = ({
  locale = 'en',
  initialData = defaultNotificationData,
}: {
  locale?: string;
  initialData?: NotificationData | null;
}) => {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePreference = (
    channel: 'email' | 'push' | 'sms',
    key: string,
    value: boolean
  ) => {
    if (!data) return;

    setData({
      ...data,
      preferences: {
        ...data.preferences,
        [channel]: {
          ...data.preferences[channel],
          [key]: value,
        },
      },
    });

    setMessage({
      type: 'success',
      text: locale === 'ka' ? 'პარამეტრები განახლდა' : 'Preferences updated',
    });

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <NotificationSettings
      locale={locale}
      notificationData={data}
      isLoading={false}
      message={message}
      onUpdatePreference={handleUpdatePreference}
      onAddEmail={() => aler"Add email clicked"}
      onRetry={() => aler"Retry clicked"}
    />
  );
};

export const Default: Story = {
  render: () => <NotificationSettingsWrapper />,
};

export const GeorgianLocale: Story = {
  render: () => <NotificationSettingsWrapper locale="ka" />,
};

export const Loading: Story = {
  args: {
    locale: 'en',
    notificationData: null,
    isLoading: true,
    message: null,
    onUpdatePreference: () => {},
    onAddEmail: () => {},
    onRetry: () => {},
  },
};

export const LoadingGeorgian: Story = {
  args: {
    locale: 'ka',
    notificationData: null,
    isLoading: true,
    message: null,
    onUpdatePreference: () => {},
    onAddEmail: () => {},
    onRetry: () => {},
  },
};

export const FailedToLoad: Story = {
  args: {
    locale: 'en',
    notificationData: null,
    isLoading: false,
    message: null,
    onUpdatePreference: () => {},
    onAddEmail: () => {},
    onRetry: () => aler"Retry clicked",
  },
};

export const NoEmail: Story = {
  render: () => (
    <NotificationSettingsWrapper
      initialData={{
        ...defaultNotificationData,
        email: null,
        isEmailVerified: false,
        preferences: {
          ...defaultNotificationData.preferences,
          email: {
            enabled: false,
            newJobs: false,
            proposals: false,
            messages: false,
            marketing: false,
          },
        },
      }}
    />
  ),
};

export const UnverifiedEmail: Story = {
  render: () => (
    <NotificationSettingsWrapper
      initialData={{
        ...defaultNotificationData,
        isEmailVerified: false,
      }}
    />
  ),
};

export const NoPhone: Story = {
  render: () => (
    <NotificationSettingsWrapper
      initialData={{
        ...defaultNotificationData,
        phone: null,
        isPhoneVerified: false,
        preferences: {
          ...defaultNotificationData.preferences,
          sms: {
            enabled: false,
            proposals: false,
            messages: false,
          },
        },
      }}
    />
  ),
};

export const AllDisabled: Story = {
  render: () => (
    <NotificationSettingsWrapper
      initialData={{
        ...defaultNotificationData,
        preferences: {
          email: {
            enabled: false,
            newJobs: false,
            proposals: false,
            messages: false,
            marketing: false,
          },
          push: {
            enabled: false,
            newJobs: false,
            proposals: false,
            messages: false,
          },
          sms: {
            enabled: false,
            proposals: false,
            messages: false,
          },
        },
      }}
    />
  ),
};

export const AllEnabled: Story = {
  render: () => (
    <NotificationSettingsWrapper
      initialData={{
        ...defaultNotificationData,
        preferences: {
          email: {
            enabled: true,
            newJobs: true,
            proposals: true,
            messages: true,
            marketing: true,
          },
          push: {
            enabled: true,
            newJobs: true,
            proposals: true,
            messages: true,
          },
          sms: {
            enabled: true,
            proposals: true,
            messages: true,
          },
        },
      }}
    />
  ),
};

export const SuccessMessage: Story = {
  args: {
    locale: 'en',
    notificationData: defaultNotificationData,
    isLoading: false,
    message: { type: 'success', text: 'Preferences saved successfully!' },
    onUpdatePreference: () => {},
    onAddEmail: () => {},
    onRetry: () => {},
  },
};

export const ErrorMessage: Story = {
  args: {
    locale: 'en',
    notificationData: defaultNotificationData,
    isLoading: false,
    message: { type: 'error', text: 'Failed to save preferences. Please try again.' },
    onUpdatePreference: () => {},
    onAddEmail: () => {},
    onRetry: () => {},
  },
};
