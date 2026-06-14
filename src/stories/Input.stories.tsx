import type { Meta, StoryObj } from '@storybook/react';

/**
 * Input Component Stories
 *
 * Demonstrates the Input component with various states and configurations.
 */

const meta: Meta<typeof Input> = {
  title: 'Shared/UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Text input component with validation states.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel'],
      description: 'Input type',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Input size',
      table: {
        defaultValue: { summary: 'middle' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
    status: {
      control: 'select',
      options: ['', 'error', 'warning'],
      description: 'Validation status',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// Mock Input component for demonstration
import { Input as AntInput } from 'antd';
import { useState } from 'react';

const { TextArea } = AntInput;

// Re-export the actual Input from antd for these stories
const Input = AntInput;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  render: (args) => <AntInput {...args} />,
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter email...',
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 500 }}>{args.label}</label>
      <AntInput placeholder={args.placeholder} />
    </div>
  ),
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Type something...',
  },
  render: () => <AntInput placeholder="Type something..." />,
};

export const Error: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'Enter text...',
    status: 'error',
    error: 'This field is required',
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 500 }}>{args.label}</label>
      <AntInput status="error" placeholder={args.placeholder} />
      <span style={{ color: '#ff4d4f', fontSize: 12 }}>{args.error}</span>
    </div>
  ),
};

export const Warning: Story = {
  args: {
    label: 'Username',
    status: 'warning',
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 500 }}>{args.label}</label>
      <AntInput status="warning" placeholder="Username already taken" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
  render: () => <AntInput disabled placeholder="Disabled input" />,
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
  render: () => <AntInput.Password placeholder="Enter password..." />,
};

export const TextArea: Story = {
  args: {
    rows: 4,
    placeholder: 'Enter description...',
  },
  render: () => <TextArea rows={4} placeholder="Enter description..." />,
};

export const SmallSize: Story = {
  render: () => <AntInput size="small" placeholder="Small input" />,
};

export const LargeSize: Story = {
  render: () => <AntInput size="large" placeholder="Large input" />,
};
