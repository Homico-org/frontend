import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import HiringChoiceModal from './HiringChoiceModal';

const meta: Meta<typeof HiringChoiceModal> = {
  title: 'Proposals/HiringChoiceModal',
  component: HiringChoiceModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HiringChoiceModal>;

// Interactive wrapper for stories
const HiringChoiceModalWrapper = ({
  proName = 'John Designer',
  proPhone = '+995 555 123 456',
}: {
  proName?: string;
  proPhone?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChooseHomico = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsOpen(false);
    aler"Hired through Homico!";
  };

  const handleChooseDirect = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    setIsOpen(false);
    alert(`Contact directly at: ${proPhone}`);
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#C4735B] text-white rounded-lg hover:bg-[#B5624A] transition-colors"
        >
          Open Hiring Choice Modal
        </button>
      )}
      <HiringChoiceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onChooseHomico={handleChooseHomico}
        onChooseDirect={handleChooseDirect}
        proName={proName}
        proPhone={proPhone}
        isLoading={isLoading}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <HiringChoiceModalWrapper />,
};

export const LongProName: Story = {
  render: () => (
    <HiringChoiceModalWrapper
      proName="Alexander Konstantinovich Petrovsky"
      proPhone="+995 555 987 654"
    />
  ),
};

export const Loading: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onChooseHomico: () => {},
    onChooseDirect: () => {},
    proName: 'Maria Garcia',
    isLoading: true,
  },
};

export const NoPhone: Story = {
  render: () => (
    <HiringChoiceModalWrapper proName="Jane Smith" proPhone={undefined} />
  ),
};

export const GeorgianName: Story = {
  render: () => (
    <HiringChoiceModalWrapper
      proName="გიორგი მაისურაძე"
      proPhone="+995 555 111 222"
    />
  ),
};
