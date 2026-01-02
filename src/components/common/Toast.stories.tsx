import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState, useEffect } from 'react';

// Icons for the stories
const icons = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M15 9l-6 6m0-6l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L2 21h20L12 3z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12 9v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M12 16v-4m0-4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const colorSchemes = {
  success: {
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/80 dark:to-green-950/60',
    border: 'border-emerald-200/80 dark:border-emerald-700/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    title: 'text-emerald-900 dark:text-emerald-100',
    desc: 'text-emerald-700 dark:text-emerald-300',
    progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/20 dark:shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  error: {
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/80 dark:to-rose-950/60',
    border: 'border-red-200/80 dark:border-red-700/50',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    title: 'text-red-900 dark:text-red-100',
    desc: 'text-red-700 dark:text-red-300',
    progress: 'bg-gradient-to-r from-red-500 to-rose-500',
    glow: 'shadow-red-500/20 dark:shadow-red-500/10',
    ring: 'ring-red-500/20',
  },
  warning: {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/80 dark:to-orange-950/60',
    border: 'border-amber-200/80 dark:border-amber-700/50',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    title: 'text-amber-900 dark:text-amber-100',
    desc: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20 dark:shadow-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  info: {
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/60',
    border: 'border-blue-200/80 dark:border-blue-700/50',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    title: 'text-blue-900 dark:text-blue-100',
    desc: 'text-blue-700 dark:text-blue-300',
    progress: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/20 dark:shadow-blue-500/10',
    ring: 'ring-blue-500/20',
  },
};

// Static Toast Preview Component
function ToastPreview({
  type,
  message,
  description,
  showProgress = false,
  progress = 100,
}: {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
}) {
  const scheme = colorSchemes[type];

  return (
    <div
      className={`
        relative overflow-hidden
        w-full max-w-[380px]
        ${scheme.bg}
        border ${scheme.border}
        rounded-2xl
        shadow-xl ${scheme.glow}
        ring-1 ${scheme.ring}
        backdrop-blur-xl
      `}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.gradient} opacity-80`} />

      <div className="flex items-start gap-3.5 p-4 pt-5">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${scheme.iconBg} flex items-center justify-center`}>
          <div className={scheme.icon}>
            {icons[type]}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-semibold ${scheme.title} leading-tight`}>
            {message}
          </p>
          {description && (
            <p className={`mt-1.5 text-sm ${scheme.desc} leading-relaxed opacity-90`}>
              {description}
            </p>
          )}
        </div>

        <button
          className={`
            flex-shrink-0 w-8 h-8 rounded-xl
            flex items-center justify-center
            ${scheme.iconBg} ${scheme.icon}
            opacity-70 hover:opacity-100
            transition-all duration-200
          `}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden rounded-b-2xl">
          <div
            className={`h-full ${scheme.progress} transition-all duration-100 ease-linear rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof ToastPreview> = {
  title: 'Common/Toast',
  component: ToastPreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToastPreview>;

export const Success: Story = {
  args: {
    type: 'success',
    message: 'Changes saved successfully!',
    description: 'Your profile has been updated.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    message: 'Something went wrong',
    description: 'Please try again later or contact support.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    message: 'Session expiring soon',
    description: 'Your session will expire in 5 minutes.',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    message: 'New update available',
    description: 'A new version of the app is ready to install.',
  },
};

export const WithProgress: Story = {
  args: {
    type: 'success',
    message: 'Upload complete',
    showProgress: true,
    progress: 75,
  },
};

export const TitleOnly: Story = {
  args: {
    type: 'success',
    message: 'Copied to clipboard!',
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4 max-w-[400px]">
      <ToastPreview
        type="success"
        message="Project published!"
        description="Your job is now visible to professionals."
      />
      <ToastPreview
        type="error"
        message="Failed to save"
        description="Check your connection and try again."
      />
      <ToastPreview
        type="warning"
        message="Low balance"
        description="Add funds to continue receiving proposals."
      />
      <ToastPreview
        type="info"
        message="3 new proposals"
        description="Check your inbox for new offers."
      />
    </div>
  ),
};

export const AnimatedProgress: Story = {
  render: () => {
    const AnimatedToast = () => {
      const [progress, setProgress] = useState(100);

      useEffect(() => {
        const interval = setInterval(() => {
          setProgress((p) => (p <= 0 ? 100 : p - 1));
        }, 40);
        return () => clearInterval(interval);
      }, []);

      return (
        <ToastPreview
          type="success"
          message="Auto-dismissing toast"
          description="This toast will disappear when progress reaches 0"
          showProgress
          progress={progress}
        />
      );
    };

    return <AnimatedToast />;
  },
};
