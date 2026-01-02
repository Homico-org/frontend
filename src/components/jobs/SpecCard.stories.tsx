import type { Meta, StoryObj } from '@storybook/nextjs';
import { Home, Ruler, DoorOpen, Calendar, Map, Layers, Mountain, Zap } from 'lucide-react';
import SpecCard from './SpecCard';

const meta: Meta<typeof SpecCard> = {
  title: 'Jobs/SpecCard',
  component: SpecCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[200px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SpecCard>;

export const PropertyType: Story = {
  args: {
    icon: <Home className="w-5 h-5" />,
    label: 'Type',
    value: 'Apartment',
  },
};

export const Area: Story = {
  args: {
    icon: <Ruler className="w-5 h-5" />,
    label: 'Area',
    value: '120 მ²',
  },
};

export const Rooms: Story = {
  args: {
    icon: <DoorOpen className="w-5 h-5" />,
    label: 'Rooms',
    value: '4',
  },
};

export const Deadline: Story = {
  args: {
    icon: <Calendar className="w-5 h-5" />,
    label: 'Deadline',
    value: 'Jan 15',
  },
};

export const Cadastral: Story = {
  args: {
    icon: <Map className="w-5 h-5" />,
    label: 'Cadastral',
    value: '01.12.15.052.001',
  },
};

export const AllSpecs: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <SpecCard
        icon={<Home className="w-5 h-5" />}
        label="Type"
        value="Apartment"
      />
      <SpecCard
        icon={<Ruler className="w-5 h-5" />}
        label="Area"
        value="120 მ²"
      />
      <SpecCard
        icon={<Mountain className="w-5 h-5" />}
        label="Land Area"
        value="500 მ²"
      />
      <SpecCard
        icon={<DoorOpen className="w-5 h-5" />}
        label="Rooms"
        value="4"
      />
      <SpecCard
        icon={<Layers className="w-5 h-5" />}
        label="Floors"
        value="2"
      />
      <SpecCard
        icon={<Zap className="w-5 h-5" />}
        label="Points"
        value="12"
      />
    </div>
  ),
};

export const GeorgianLabels: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <SpecCard
        icon={<Home className="w-5 h-5" />}
        label="ტიპი"
        value="ბინა"
      />
      <SpecCard
        icon={<Ruler className="w-5 h-5" />}
        label="ფართი"
        value="120 მ²"
      />
      <SpecCard
        icon={<DoorOpen className="w-5 h-5" />}
        label="ოთახები"
        value="4"
      />
      <SpecCard
        icon={<Calendar className="w-5 h-5" />}
        label="ვადა"
        value="15 იან"
      />
    </div>
  ),
};
