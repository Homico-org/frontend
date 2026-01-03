import type { Meta, StoryObj } from '@storybook/react';
import GoogleSignInButton from './GoogleSignInButton';

const meta: Meta<typeof GoogleSignInButton> = {
  title: 'Auth/GoogleSignInButton',
  component: GoogleSignInButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A reusable Google Sign-In button component that handles Google OAuth authentication. The button loads the Google Sign-In SDK and renders the official Google button with customizable options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'select',
      options: ['signin_with', 'signup_with', 'continue_with', 'signin'],
      description: 'The text displayed on the Google button',
    },
    width: {
      control: { type: 'range', min: 200, max: 400, step: 10 },
      description: 'Button width in pixels',
    },
    loadingText: {
      control: 'text',
      description: 'Text shown while the Google SDK is loading',
    },
    isActive: {
      control: 'boolean',
      description: 'Whether the button is active and visible',
    },
    buttonKey: {
      control: 'text',
      description: 'Unique key for multiple button instances on the same page',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GoogleSignInButton>;

// Default story - Sign in variant
export const SignIn: Story = {
  args: {
    text: 'signin_with',
    width: 300,
    loadingText: 'Loading...',
    isActive: true,
    buttonKey: 'signin',
    onSuccess: (userData) => {
      console.log('Google Sign In Success:', userData);
      alert(`Signed in as: ${userData.email}`);
    },
    onError: (error) => {
      console.error('Google Sign In Error:', error);
      alert(`Error: ${error}`);
    },
  },
};

// Sign up variant
export const SignUp: Story = {
  args: {
    ...SignIn.args,
    text: 'signup_with',
    buttonKey: 'signup',
    loadingText: 'Loading...',
  },
};

// Continue with variant
export const ContinueWith: Story = {
  args: {
    ...SignIn.args,
    text: 'continue_with',
    buttonKey: 'continue',
    loadingText: 'Loading...',
  },
};

// Georgian loading text
export const Georgian: Story = {
  args: {
    ...SignIn.args,
    loadingText: 'იტვირთება...',
    buttonKey: 'georgian',
  },
};

// Narrow width
export const Narrow: Story = {
  args: {
    ...SignIn.args,
    width: 220,
    buttonKey: 'narrow',
  },
};

// Wide width
export const Wide: Story = {
  args: {
    ...SignIn.args,
    width: 380,
    buttonKey: 'wide',
  },
};

// Inactive state (shows loading)
export const Inactive: Story = {
  args: {
    ...SignIn.args,
    isActive: false,
    buttonKey: 'inactive',
  },
  parameters: {
    docs: {
      description: {
        story: 'When isActive is false, the button shows the loading state. This is useful for tab-based UIs where the button should re-render when switching tabs.',
      },
    },
  },
};

// Multiple buttons demonstration
export const MultipleButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500 mb-2">Sign In Button:</p>
        <GoogleSignInButton
          buttonKey="multi-signin"
          text="signin_with"
          onSuccess={(data) => console.log('Sign In:', data)}
        />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Sign Up Button:</p>
        <GoogleSignInButton
          buttonKey="multi-signup"
          text="signup_with"
          onSuccess={(data) => console.log('Sign Up:', data)}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple GoogleSignInButton instances on the same page. Each button needs a unique `buttonKey` prop to prevent conflicts.',
      },
    },
  },
};
