import type { Meta, StoryObj } from '@storybook/nextjs';
import Card, { CardImage, CardContent, CardHeader, CardFooter, CardBadge, CardTitle, CardDescription, CardTags, CardActions } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-md">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'subtle', 'outlined'],
    },
    hover: {
      control: 'select',
      options: [true, false, 'lift', 'glow', 'scale'],
    },
    padding: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <CardContent>
        <CardTitle>Default Card</CardTitle>
        <CardDescription>This is a default card with standard styling.</CardDescription>
      </CardContent>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <CardContent>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>This card has more prominent shadows and borders.</CardDescription>
      </CardContent>
    ),
  },
};

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: (
      <CardContent>
        <CardTitle>Subtle Card</CardTitle>
        <CardDescription>A more subdued card variant for less emphasis.</CardDescription>
      </CardContent>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <CardContent>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>A transparent card with just a border.</CardDescription>
      </CardContent>
    ),
  },
};

export const WithImage: Story = {
  render: () => (
    <Card>
      <CardImage aspectRatio="16/9" overlay="gradient">
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400"
          alt="Interior"
          className="w-full h-full object-cover"
        />
        <CardBadge position="top-right" variant="solid" color="primary">
          Featured
        </CardBadge>
      </CardImage>
      <CardContent>
        <CardTitle>Modern Interior Design</CardTitle>
        <CardDescription>
          A beautiful modern living room with contemporary furniture and warm lighting.
        </CardDescription>
        <CardTags tags={['Interior', 'Modern', 'Living Room']} className="mt-3" />
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardContent>
        <CardHeader>
          <CardTitle>Project Update</CardTitle>
          <span className="text-xs text-neutral-500">2 hours ago</span>
        </CardHeader>
        <CardDescription className="mt-2">
          The renovation project is progressing well. We've completed the kitchen area.
        </CardDescription>
      </CardContent>
      <CardFooter>
        <CardActions align="between">
          <span className="text-sm text-neutral-500">3 comments</span>
          <button className="text-sm font-medium text-[#C4735B] hover:underline">
            View Details
          </button>
        </CardActions>
      </CardFooter>
    </Card>
  ),
};

export const HoverEffects: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card hover="lift" padding="md">
        <CardTitle size="sm">Lift</CardTitle>
        <CardDescription lines={1}>Hover to lift up</CardDescription>
      </Card>
      <Card hover="glow" padding="md">
        <CardTitle size="sm">Glow</CardTitle>
        <CardDescription lines={1}>Hover to glow</CardDescription>
      </Card>
      <Card hover="scale" padding="md">
        <CardTitle size="sm">Scale</CardTitle>
        <CardDescription lines={1}>Hover to scale</CardDescription>
      </Card>
      <Card hover={false} padding="md">
        <CardTitle size="sm">None</CardTitle>
        <CardDescription lines={1}>No hover effect</CardDescription>
      </Card>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export const BadgeVariants: Story = {
  render: () => (
    <Card className="relative h-48">
      <CardBadge position="top-left" variant="solid" color="primary">Solid Primary</CardBadge>
      <CardBadge position="top-right" variant="glass" color="success">Glass Success</CardBadge>
      <CardBadge position="bottom-left" variant="outline" color="warning">Outline Warning</CardBadge>
      <CardBadge position="bottom-right" variant="solid" color="danger">Solid Danger</CardBadge>
    </Card>
  ),
};

export const AsLink: Story = {
  args: {
    href: '/example',
    children: (
      <CardContent>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>This entire card is a link. Click anywhere to navigate.</CardDescription>
      </CardContent>
    ),
  },
};

export const CompleteExample: Story = {
  render: () => (
    <Card variant="elevated" hover="lift" className="group">
      <CardImage aspectRatio="4/3" overlay="gradient">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
          alt="Architecture"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <CardBadge position="top-left" variant="glass" color="primary">
          New
        </CardBadge>
      </CardImage>
      <CardContent spacing="relaxed">
        <CardHeader>
          <div>
            <CardTitle size="lg">Luxury Villa Renovation</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">Tbilisi, Georgia</p>
          </div>
        </CardHeader>
        <CardDescription className="mt-2">
          Complete renovation of a 300sqm villa including modern kitchen, spa bathroom, and smart home integration.
        </CardDescription>
        <CardTags tags={['Architecture', 'Renovation', 'Luxury', 'Smart Home']} max={3} className="mt-4" />
      </CardContent>
      <CardFooter>
        <CardActions align="between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-sm font-medium">Giorgi K.</span>
          </div>
          <span className="text-sm font-semibold text-[#C4735B]">$45,000</span>
        </CardActions>
      </CardFooter>
    </Card>
  ),
};
