import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import ReviewModal from './ReviewModal';

const meta: Meta<typeof ReviewModal> = {
  title: 'Jobs/ReviewModal',
  component: ReviewModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'ka'],
    },
    rating: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
    },
    isSubmitting: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReviewModal>;

const samplePro = {
  avatar: '',
  userId: {
    name: 'John Designer',
    avatar: '',
  },
  title: 'Interior Designer',
};

// Interactive wrapper for stories
const ReviewModalWrapper = ({
  locale = 'en',
  initialRating = 0,
  initialText = '',
  pro = samplePro,
}: {
  locale?: string;
  initialRating?: number;
  initialText?: string;
  pro?: typeof samplePro;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsOpen(false);
    alert(`Review submitted!\nRating: ${rating} stars\nComment: ${text || '(no comment)'}`);
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setRating(0);
            setText('');
          }}
          className="px-4 py-2 bg-[#E07B4F] text-white rounded-lg hover:bg-[#D26B3F] transition-colors"
        >
          Open Review Modal
        </button>
      )}
      <ReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        locale={locale}
        rating={rating}
        onRatingChange={setRating}
        text={text}
        onTextChange={setText}
        pro={pro}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <ReviewModalWrapper />,
};

export const WithInitialRating: Story = {
  render: () => <ReviewModalWrapper initialRating={4} />,
};

export const WithInitialText: Story = {
  render: () => (
    <ReviewModalWrapper
      initialRating={5}
      initialText="Amazing work! Very professional and delivered on time."
    />
  ),
};

export const GeorgianLocale: Story = {
  render: () => <ReviewModalWrapper locale="ka" />,
};

export const Submitting: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: () => {},
    isSubmitting: true,
    locale: 'en',
    rating: 5,
    onRatingChange: () => {},
    text: 'Great work!',
    onTextChange: () => {},
    pro: samplePro,
  },
};

export const NoRating: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: () => {},
    isSubmitting: false,
    locale: 'en',
    rating: 0,
    onRatingChange: () => {},
    text: '',
    onTextChange: () => {},
    pro: samplePro,
  },
};

export const WithProAvatar: Story = {
  render: () => (
    <ReviewModalWrapper
      pro={{
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        userId: {
          name: 'Maria Designer',
          avatar: '',
        },
        title: 'Senior Interior Designer',
      }}
    />
  ),
};

export const LongProTitle: Story = {
  render: () => (
    <ReviewModalWrapper
      pro={{
        avatar: '',
        userId: {
          name: 'Alexander Konstantinovich',
          avatar: '',
        },
        title: 'Professional Interior & Exterior Design Specialist',
      }}
    />
  ),
};

export const GeorgianWithContent: Story = {
  render: () => (
    <ReviewModalWrapper
      locale="ka"
      initialRating={5}
      initialText="შესანიშნავი მუშაობა! ძალიან პროფესიონალური მიდგომა."
      pro={{
        avatar: '',
        userId: {
          name: 'გიორგი დიზაინერი',
          avatar: '',
        },
        title: 'ინტერიერის დიზაინერი',
      }}
    />
  ),
};
