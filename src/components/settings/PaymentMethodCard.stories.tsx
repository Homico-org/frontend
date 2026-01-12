import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import PaymentMethodCard, { EmptyPaymentMethods, PaymentMethod } from './PaymentMethodCard';

const meta: Meta<typeof PaymentMethodCard> = {
  title: 'Settings/PaymentMethodCard',
  component: PaymentMethodCard,
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
      <div className="w-full max-w-md p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PaymentMethodCard>;

const sampleCard: PaymentMethod = {
  id: '1',
  type: 'card',
  cardLast4: '4242',
  cardBrand: 'Visa',
  cardExpiry: '12/25',
  cardholderName: 'John Doe',
  isDefault: false,
  createdAt: '2024-01-01',
};

export const Default: Story = {
  args: {
    method: sampleCard,
    onSetDefault: () => aler"Set as default",
    onDelete: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const DefaultCard: Story = {
  args: {
    method: { ...sampleCard, isDefault: true },
    onSetDefault: () => {},
    onDelete: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MastercardBrand: Story = {
  args: {
    method: {
      ...sampleCard,
      id: '2',
      cardLast4: '5555',
      cardBrand: 'Mastercard',
      cardholderName: 'Jane Smith',
    },
    onSetDefault: () => {},
    onDelete: async () => {},
  },
};

export const AmexBrand: Story = {
  args: {
    method: {
      ...sampleCard,
      id: '3',
      cardLast4: '3782',
      cardBrand: 'Amex',
      cardExpiry: '06/26',
    },
    onSetDefault: () => {},
    onDelete: async () => {},
  },
};

export const UnknownBrand: Story = {
  args: {
    method: {
      ...sampleCard,
      id: '4',
      cardLast4: '1234',
      cardBrand: 'Unknown',
    },
    onSetDefault: () => {},
    onDelete: async () => {},
  },
};

export const GeorgianLocale: Story = {
  args: {
    method: { ...sampleCard, isDefault: true },
    locale: 'ka',
    onSetDefault: () => {},
    onDelete: async () => {},
  },
};

export const MultipleCards: Story = {
  render: () => {
    const [cards, setCards] = useState<PaymentMethod[]>([
      {
        id: '1',
        type: 'card',
        cardLast4: '4242',
        cardBrand: 'Visa',
        cardExpiry: '12/25',
        cardholderName: 'John Doe',
        isDefault: true,
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        type: 'card',
        cardLast4: '5555',
        cardBrand: 'Mastercard',
        cardExpiry: '08/26',
        cardholderName: 'John Doe',
        isDefault: false,
        createdAt: '2024-02-01',
      },
      {
        id: '3',
        type: 'card',
        cardLast4: '3782',
        cardBrand: 'Amex',
        cardExpiry: '06/27',
        cardholderName: 'John Doe',
        isDefault: false,
        createdAt: '2024-03-01',
      },
    ]);

    const handleSetDefault = (id: string) => {
      setCards(cards.map((card) => ({
        ...card,
        isDefault: card.id === id,
      })));
    };

    const handleDelete = async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCards(cards.filter((card) => card.id !== id));
    };

    return (
      <div className="space-y-3">
        {cards.map((card) => (
          <PaymentMethodCard
            key={card.id}
            method={card}
            onSetDefault={handleSetDefault}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  },
};

// EmptyPaymentMethods stories
export const Empty: Story = {
  render: () => (
    <EmptyPaymentMethods onAddCard={() => aler"Add card clicked"} />
  ),
};

export const EmptyGeorgian: Story = {
  render: () => (
    <EmptyPaymentMethods onAddCard={() => aler"Add card clicked"} locale="ka" />
  ),
};

export const EmptyWithoutButton: Story = {
  render: () => <EmptyPaymentMethods />,
};
