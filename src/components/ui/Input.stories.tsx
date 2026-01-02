import type { Meta, StoryObj } from '@storybook/nextjs';
import { Search, Mail, Lock, User, Check, AlertCircle } from 'lucide-react';
import { Input, Textarea, Label, FormGroup } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[320px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'ghost', 'premium'],
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text...',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Input variant="default" placeholder="Default variant" />
      <Input variant="filled" placeholder="Filled variant" />
      <Input variant="ghost" placeholder="Ghost variant" />
      <Input variant="premium" placeholder="Premium variant" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input inputSize="sm" placeholder="Small input" />
      <Input inputSize="default" placeholder="Default input" />
      <Input inputSize="lg" placeholder="Large input" />
      <Input inputSize="xl" placeholder="Extra large input" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Input leftIcon={<Search className="w-4 h-4" />} placeholder="Search..." />
      <Input leftIcon={<Mail className="w-4 h-4" />} placeholder="Email address" />
      <Input leftIcon={<Lock className="w-4 h-4" />} placeholder="Password" type="password" />
      <Input rightIcon={<Check className="w-4 h-4 text-emerald-500" />} placeholder="Verified input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Input placeholder="Normal state" />
      <Input placeholder="Error state" error />
      <Input placeholder="Success state" success />
      <Input placeholder="Disabled state" disabled />
    </div>
  ),
};

export const TextareaVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea variant="default" placeholder="Default textarea..." />
      <Textarea variant="filled" placeholder="Filled textarea..." />
      <Textarea variant="premium" placeholder="Premium textarea..." />
    </div>
  ),
};

export const TextareaSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea textareaSize="sm" placeholder="Small textarea..." />
      <Textarea textareaSize="default" placeholder="Default textarea..." />
      <Textarea textareaSize="lg" placeholder="Large textarea..." />
    </div>
  ),
};

export const Labels: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <Label>Standard Label</Label>
        <Input placeholder="Standard input" />
      </div>
      <div>
        <Label required>Required Field</Label>
        <Input placeholder="This field is required" />
      </div>
      <div>
        <Label optional>Optional Field</Label>
        <Input placeholder="This field is optional" />
      </div>
      <div>
        <Label hint="Max 100 characters">With Hint</Label>
        <Input placeholder="Enter text..." />
      </div>
    </div>
  ),
};

export const FormGroups: Story = {
  render: () => (
    <div className="space-y-6">
      <FormGroup
        label="Email Address"
        required
        helperText="We'll never share your email"
      >
        <Input
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />
      </FormGroup>

      <FormGroup
        label="Username"
        error="Username is already taken"
      >
        <Input
          placeholder="johndoe"
          leftIcon={<User className="w-4 h-4" />}
          error
        />
      </FormGroup>

      <FormGroup
        label="Password"
        success="Strong password!"
      >
        <Input
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          success
        />
      </FormGroup>

      <FormGroup
        label="Bio"
        optional
        hint="Max 500 characters"
      >
        <Textarea placeholder="Tell us about yourself..." />
      </FormGroup>
    </div>
  ),
};

export const CompleteForm: Story = {
  render: () => (
    <div className="space-y-4 min-w-[400px]">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create Account</h3>

      <FormGroup label="Full Name" required>
        <Input
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
        />
      </FormGroup>

      <FormGroup label="Email" required>
        <Input
          type="email"
          placeholder="john@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />
      </FormGroup>

      <FormGroup label="Password" required helperText="At least 8 characters">
        <Input
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
        />
      </FormGroup>

      <FormGroup label="About You" optional>
        <Textarea placeholder="Tell us a bit about yourself..." />
      </FormGroup>
    </div>
  ),
};
