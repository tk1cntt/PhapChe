import type { Meta, StoryObj } from '@storybook/react';

/**
 * Button Component Stories
 *
 * Demonstrates the Button component with various variants and states.
 * These stories are used for visual regression testing and documentation.
 */

const meta: Meta<typeof Button> = {
  title: 'Shared/UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary action button component with multiple variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'text', 'link'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Button size',
      table: {
        defaultValue: { summary: 'middle' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interactions',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Mock Button component for demonstration
import { Button as AntButton } from 'antd';

// Re-export the actual Button from antd for these stories
const Button = AntButton;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
  render: (args) => <AntButton type="primary">{args.children}</AntButton>,
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
  },
  render: () => <AntButton>Secondary Button</AntButton>,
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
  },
  render: () => <AntButton type="default" ghost>Outline Button</AntButton>,
};

export const Text: Story = {
  args: {
    children: 'Text Button',
  },
  render: () => <AntButton type="text">Text Button</AntButton>,
};

export const Link: Story = {
  args: {
    children: 'Link Button',
  },
  render: () => <AntButton type="link">Link Button</AntButton>,
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
  render: () => <AntButton disabled>Disabled Button</AntButton>,
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
  render: () => <AntButton loading>Loading Button</AntButton>,
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
  render: () => <AntButton size="small">Small Button</AntButton>,
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
  render: () => <AntButton size="large">Large Button</AntButton>,
};
