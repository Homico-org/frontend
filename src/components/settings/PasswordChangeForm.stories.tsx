import type { Meta, StoryObj } from '@storybook/nextjs';
import PasswordChangeForm from './PasswordChangeForm';

const meta: Meta<typeof PasswordChangeForm> = {
  title: 'Settings/PasswordChangeForm',
  component: PasswordChangeForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PasswordChangeForm>;

// Simulate API call
const mockSubmit = async (currentPassword: string, newPassword: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate wrong password
  if (currentPassword === 'wrong') {
    return { success: false, error: 'Current password is incorrect' };
  }

  return { success: true };
};

export const Default: Story = {
  args: {
    onSubmit: mockSubmit,
  },
};

export const GeorgianLocale: Story = {
  args: {
    onSubmit: mockSubmit,
    locale: 'ka',
  },
};

export const WithError: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: false, error: 'Current password is incorrect' };
    },
  },
};

export const WithSuccess: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
  },
};
