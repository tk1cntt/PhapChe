import type { Preview } from '@storybook/react';

// Import global styles
import '../src/app/globals.css';

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
        { name: 'gray', value: '#f5f5f5' },
        { name: 'dark', value: '#262626' },
      ],
    },
    locale: 'vi',
    toolbar: {
      locale: {
        title: 'Language',
        items: [
          { value: 'vi', title: 'Tiếng Việt' },
          { value: 'en', title: 'English' },
        ],
        default: 'vi',
      },
    },
  },
};

export default preview;
