import type { Meta, StoryObj } from '@storybook/nextjs';
import { LoadingSpinner, LoadingSpinnerCentered } from './LoadingSpinner';
import { ACCENT_COLOR, COMPANY_ACCENT } from '@/constants/theme';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {},
};

export const ExtraSmall: Story = {
  args: {
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const AccentColor: Story = {
  args: {
    size: 'lg',
    color: ACCENT_COLOR,
  },
};

export const CompanyAccent: Story = {
  args: {
    size: 'lg',
    color: COMPANY_ACCENT,
  },
};

export const CustomColor: Story = {
  args: {
    size: 'lg',
    color: '#3B82F6',
  },
};

export const WhiteOnDark: Story = {
  args: {
    size: 'lg',
    color: '#FFFFFF',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xs" color={ACCENT_COLOR} />
        <span className="text-xs text-neutral-500">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" color={ACCENT_COLOR} />
        <span className="text-xs text-neutral-500">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" color={ACCENT_COLOR} />
        <span className="text-xs text-neutral-500">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" color={ACCENT_COLOR} />
        <span className="text-xs text-neutral-500">lg</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xl" color={ACCENT_COLOR} />
        <span className="text-xs text-neutral-500">xl</span>
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium"
      style={{ backgroundColor: ACCENT_COLOR }}
      disabled
    >
      <LoadingSpinner size="sm" color="#FFFFFF" />
      <span>Loading...</span>
    </button>
  ),
};

export const InButtonVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <button
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium w-40"
        style={{ backgroundColor: ACCENT_COLOR }}
        disabled
      >
        <LoadingSpinner size="sm" color="#FFFFFF" />
        <span>Saving</span>
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-medium w-40"
        style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
        disabled
      >
        <LoadingSpinner size="sm" color={ACCENT_COLOR} />
        <span>Loading</span>
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 text-white font-medium w-40"
        disabled
      >
        <LoadingSpinner size="sm" color="#FFFFFF" />
        <span>Processing</span>
      </button>
    </div>
  ),
};

// LoadingSpinnerCentered Stories
type CenteredStory = StoryObj<typeof LoadingSpinnerCentered>;

export const Centered: CenteredStory = {
  render: () => (
    <div className="w-96 border border-neutral-200 dark:border-neutral-700 rounded-xl">
      <LoadingSpinnerCentered />
    </div>
  ),
};

export const CenteredSmall: CenteredStory = {
  render: () => (
    <div className="w-96 border border-neutral-200 dark:border-neutral-700 rounded-xl">
      <LoadingSpinnerCentered size="md" />
    </div>
  ),
};

export const CenteredCustomColor: CenteredStory = {
  render: () => (
    <div className="w-96 border border-neutral-200 dark:border-neutral-700 rounded-xl">
      <LoadingSpinnerCentered size="xl" color="#3B82F6" />
    </div>
  ),
};

export const CenteredInCard: CenteredStory = {
  render: () => (
    <div className="w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Loading Content</h3>
      </div>
      <LoadingSpinnerCentered />
    </div>
  ),
};

export const FullPageLoading: CenteredStory = {
  render: () => (
    <div className="w-full h-96 bg-neutral-50 dark:bg-neutral-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" color={ACCENT_COLOR} />
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Loading your content...
        </p>
      </div>
    </div>
  ),
};
