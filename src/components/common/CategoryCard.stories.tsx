import type { Meta, StoryObj } from '@storybook/nextjs';
import CategoryCard from './CategoryCard';

const meta: Meta<typeof CategoryCard> = {
  title: 'Common/CategoryCard',
  component: CategoryCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl min-w-[200px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CategoryCard>;

export const Design: Story = {
  args: {
    name: 'Interior Design',
    icon: 'design',
    slug: 'design',
    count: '150+ pros',
  },
};

export const Architecture: Story = {
  args: {
    name: 'Architecture',
    icon: 'architecture',
    slug: 'architecture',
    count: '85 pros',
  },
};

export const Craftsmen: Story = {
  args: {
    name: 'Craftsmen',
    icon: 'craftsmen',
    slug: 'craftsmen',
    count: '320+ pros',
  },
};

export const HomeCare: Story = {
  args: {
    name: 'Home Care',
    icon: 'homecare',
    slug: 'homecare',
    count: '200+ pros',
  },
};

export const Landscaping: Story = {
  args: {
    name: 'Landscaping',
    icon: 'landscaping',
    slug: 'landscaping',
    count: '75 pros',
  },
};

export const Electrical: Story = {
  args: {
    name: 'Electrical',
    icon: 'electrical',
    slug: 'electrical',
    count: '120+ pros',
  },
};

export const Plumbing: Story = {
  args: {
    name: 'Plumbing',
    icon: 'plumbing',
    slug: 'plumbing',
    count: '95 pros',
  },
};

export const Painting: Story = {
  args: {
    name: 'Painting',
    icon: 'painting',
    slug: 'painting',
    count: '180+ pros',
  },
};

export const NoCount: Story = {
  args: {
    name: 'Other Services',
    icon: 'other',
    slug: 'other',
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
      <CategoryCard name="Design" icon="design" slug="design" count="150+" />
      <CategoryCard name="Architecture" icon="architecture" slug="architecture" count="85" />
      <CategoryCard name="Craftsmen" icon="craftsmen" slug="craftsmen" count="320+" />
      <CategoryCard name="Home Care" icon="homecare" slug="homecare" count="200+" />
      <CategoryCard name="Landscaping" icon="landscaping" slug="landscaping" count="75" />
      <CategoryCard name="Electrical" icon="electrical" slug="electrical" count="120+" />
      <CategoryCard name="Plumbing" icon="plumbing" slug="plumbing" count="95" />
      <CategoryCard name="Painting" icon="painting" slug="painting" count="180+" />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};
