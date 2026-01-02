import type { Meta, StoryObj } from '@storybook/nextjs';
import LanguageSelector from './LanguageSelector';

const meta: Meta<typeof LanguageSelector> = {
  title: 'Common/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSelector>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center justify-between w-[600px] px-4 py-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#C4735B] flex items-center justify-center text-white font-bold text-sm">
          H
        </div>
        <span className="font-semibold text-neutral-900 dark:text-white">Homi</span>
      </div>
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white">Browse</a>
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white">Post Job</a>
        </nav>
        <LanguageSelector variant="compact" />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const InSettings: Story = {
  render: () => (
    <div className="w-[400px] p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Language & Region</p>
            <p className="text-sm text-neutral-500">Choose your preferred language</p>
          </div>
          <LanguageSelector variant="default" />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">Notifications</p>
            <p className="text-sm text-neutral-500">Manage notification preferences</p>
          </div>
          <button className="text-sm text-[#C4735B] font-medium">Configure</button>
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-neutral-500">Default</span>
        <LanguageSelector variant="default" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-neutral-500">Compact</span>
        <LanguageSelector variant="compact" />
      </div>
    </div>
  ),
};
