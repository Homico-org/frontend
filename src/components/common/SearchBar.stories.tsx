import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import SearchBar from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Common/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-xl min-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  args: {
    onSearch: (query) => alert(`Searching for: ${query}`),
  },
};

export const CustomPlaceholder: Story = {
  args: {
    onSearch: (query) => alert(`Searching for: ${query}`),
    placeholder: 'Find a professional...',
  },
};

export const Interactive: Story = {
  render: () => {
    const [lastSearch, setLastSearch] = useState<string>('');
    return (
      <div className="space-y-4">
        <SearchBar onSearch={setLastSearch} />
        {lastSearch && (
          <p className="text-sm text-neutral-500 text-center">
            Last search: <strong>{lastSearch}</strong>
          </p>
        )}
      </div>
    );
  },
};

export const InHeroSection: Story = {
  render: () => (
    <div className="text-center space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Find the Perfect Professional
        </h1>
        <p className="text-neutral-500">
          Search for designers, architects, and craftsmen
        </p>
      </div>
      <SearchBar
        onSearch={(query) => console.log(query)}
        placeholder="What service do you need?"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-12 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 rounded-xl min-w-[600px]">
        <Story />
      </div>
    ),
  ],
};
