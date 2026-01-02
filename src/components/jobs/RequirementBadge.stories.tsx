import type { Meta, StoryObj } from '@storybook/nextjs';
import { Armchair, Sparkles, Package, Users, Hammer, Clock } from 'lucide-react';
import RequirementBadge from './RequirementBadge';

const meta: Meta<typeof RequirementBadge> = {
  title: 'Jobs/RequirementBadge',
  component: RequirementBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl min-w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RequirementBadge>;

export const FurnitureSelection: Story = {
  args: {
    icon: <Armchair className="w-4 h-4" />,
    text: 'Furniture Selection',
  },
};

export const Visualization: Story = {
  args: {
    icon: <Sparkles className="w-4 h-4" />,
    text: '3D Visualization',
  },
};

export const MaterialsProvided: Story = {
  args: {
    icon: <Package className="w-4 h-4" />,
    text: 'Materials Provided',
  },
};

export const OccupiedDuringWork: Story = {
  args: {
    icon: <Users className="w-4 h-4" />,
    text: 'Occupied During Work',
  },
};

export const AllRequirements: Story = {
  render: () => (
    <div className="grid sm:grid-cols-2 gap-3">
      <RequirementBadge
        icon={<Armchair className="w-4 h-4" />}
        text="Furniture Selection"
      />
      <RequirementBadge
        icon={<Sparkles className="w-4 h-4" />}
        text="3D Visualization"
      />
      <RequirementBadge
        icon={<Package className="w-4 h-4" />}
        text="Materials Provided"
      />
      <RequirementBadge
        icon={<Users className="w-4 h-4" />}
        text="Occupied During Work"
      />
    </div>
  ),
};

export const GeorgianLabels: Story = {
  render: () => (
    <div className="grid sm:grid-cols-2 gap-3">
      <RequirementBadge
        icon={<Armchair className="w-4 h-4" />}
        text="ავეჯის შერჩევა"
      />
      <RequirementBadge
        icon={<Sparkles className="w-4 h-4" />}
        text="3D ვიზუალიზაცია"
      />
      <RequirementBadge
        icon={<Package className="w-4 h-4" />}
        text="მასალები უზრუნველყოფილია"
      />
      <RequirementBadge
        icon={<Users className="w-4 h-4" />}
        text="დაკავებული სამუშაოს დროს"
      />
    </div>
  ),
};

export const CustomRequirements: Story = {
  render: () => (
    <div className="space-y-3">
      <RequirementBadge
        icon={<Hammer className="w-4 h-4" />}
        text="Demolition required"
      />
      <RequirementBadge
        icon={<Clock className="w-4 h-4" />}
        text="Evening work only"
      />
    </div>
  ),
};
