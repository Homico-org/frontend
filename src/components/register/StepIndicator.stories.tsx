import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import StepIndicator, { StepDots, Step } from './StepIndicator';

const meta: Meta<typeof StepIndicator> = {
  title: 'Register/StepIndicator',
  component: StepIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

const proRegistrationSteps: Step[] = [
  { id: 'account', title: 'Account', subtitle: 'Your basic information' },
  { id: 'category', title: 'Services', subtitle: 'What services do you provide?' },
  { id: 'portfolio', title: 'Portfolio', subtitle: 'Showcase your expertise' },
  { id: 'review', title: 'Review', subtitle: 'Confirm your details' },
];

const simpleSteps: Step[] = [
  { id: 'step1', title: 'Step 1' },
  { id: 'step2', title: 'Step 2' },
  { id: 'step3', title: 'Step 3' },
];

export const Default: Story = {
  args: {
    steps: simpleSteps,
    currentStep: 'step2',
  },
};

export const WithSubtitles: Story = {
  args: {
    steps: proRegistrationSteps,
    currentStep: 'category',
  },
};

export const FirstStep: Story = {
  args: {
    steps: proRegistrationSteps,
    currentStep: 'account',
  },
};

export const LastStep: Story = {
  args: {
    steps: proRegistrationSteps,
    currentStep: 'review',
    completedSteps: ['account', 'category', 'portfolio'],
  },
};

export const AllCompleted: Story = {
  args: {
    steps: proRegistrationSteps,
    currentStep: 'review',
    completedSteps: ['account', 'category', 'portfolio', 'review'],
  },
};

export const Vertical: Story = {
  args: {
    steps: proRegistrationSteps,
    currentStep: 'category',
    orientation: 'vertical',
  },
};

export const SmallSize: Story = {
  args: {
    steps: simpleSteps,
    currentStep: 'step2',
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    steps: simpleSteps,
    currentStep: 'step2',
    size: 'lg',
  },
};

export const Clickable: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState('category');
    const completedSteps = ['account'];

    return (
      <div className="space-y-4">
        <StepIndicator
          steps={proRegistrationSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
        <p className="text-center text-sm text-neutral-500">
          Current step: <strong>{currentStep}</strong>
        </p>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-500 mb-2">Small</p>
        <StepIndicator steps={simpleSteps} currentStep="step2" size="sm" />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-2">Medium</p>
        <StepIndicator steps={simpleSteps} currentStep="step2" size="md" />
      </div>
      <div>
        <p className="text-xs text-neutral-500 mb-2">Large</p>
        <StepIndicator steps={simpleSteps} currentStep="step2" size="lg" />
      </div>
    </div>
  ),
};

// StepDots stories
export const DotsDefault: Story = {
  render: () => (
    <StepDots totalSteps={4} currentStep={1} />
  ),
};

export const DotsAllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500 w-12">Small</span>
        <StepDots totalSteps={5} currentStep={2} size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500 w-12">Medium</span>
        <StepDots totalSteps={5} currentStep={2} size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500 w-12">Large</span>
        <StepDots totalSteps={5} currentStep={2} size="lg" />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 4;

    return (
      <div className="space-y-6">
        <StepDots totalSteps={totalSteps} currentStep={currentStep} />
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
            disabled={currentStep === totalSteps - 1}
            className="px-4 py-2 text-sm rounded-lg bg-[#C4735B] text-white hover:bg-[#B86A52] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  },
};
