import type { Preview } from '@storybook/nextjs';
import React from 'react';
import '../src/styles/globals.css';

// Import mock providers directly with relative path
// These will be aliased to the mock versions at build time by webpack
import { LanguageProvider } from '../src/contexts/LanguageContext.mock';
import { CategoriesProvider } from '../src/contexts/CategoriesContext.mock';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#171717' },
        { name: 'neutral', value: '#f5f5f5' },
      ],
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <LanguageProvider>
        <CategoriesProvider>
          <Story />
        </CategoriesProvider>
      </LanguageProvider>
    ),
  ],
};

export default preview;
