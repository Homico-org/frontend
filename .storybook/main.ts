import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding'
  ],
  framework: '@storybook/nextjs',
  staticDirs: [
    '../public'
  ],
  webpackFinal: async (config) => {
    // Use NormalModuleReplacementPlugin to replace context imports with mocks
    config.plugins = config.plugins || [];

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /contexts\/LanguageContext$/,
        path.resolve(__dirname, '../src/contexts/LanguageContext.mock.tsx')
      )
    );

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /contexts\/CategoriesContext$/,
        path.resolve(__dirname, '../src/contexts/CategoriesContext.mock.tsx')
      )
    );

    return config;
  },
};

export default config;
