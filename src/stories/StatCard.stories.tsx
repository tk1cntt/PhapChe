import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from '@/components/shared/ui/StatCard';

/**
 * StatCard Component Stories
 *
 * Demonstrates the unified StatCard with all 5 color variants and states.
 */

const meta: Meta<typeof StatCard> = {
  title: 'Shared/UI/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Unified metrics display component with 5 color variants.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Label displayed above the value',
    },
    value: {
      control: 'number',
      description: 'Numeric or string value to display',
    },
    icon: {
      control: 'select',
      options: ['file', 'check', 'clock', 'warning', 'done', 'money', 'users', 'folder', 'message', 'shield'],
      description: 'Icon identifier',
    },
    variant: {
      control: 'select',
      options: ['blue', 'green', 'orange', 'purple', 'red'],
      description: 'Color variant',
      table: {
        defaultValue: { summary: 'blue' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    suffix: {
      control: 'text',
      description: 'Suffix displayed after value',
    },
    precision: {
      control: 'number',
      description: 'Decimal precision for numeric values',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Blue: Story = {
  args: {
    title: 'Tổng yêu cầu',
    value: 42,
    icon: 'file',
    variant: 'blue',
  },
};

export const Green: Story = {
  args: {
    title: 'Đã hoàn thành',
    value: 28,
    icon: 'check',
    variant: 'green',
  },
};

export const Orange: Story = {
  args: {
    title: 'Đang xử lý',
    value: 12,
    icon: 'clock',
    variant: 'orange',
  },
};

export const Purple: Story = {
  args: {
    title: 'Đã phê duyệt',
    value: 35,
    icon: 'done',
    variant: 'purple',
  },
};

export const Red: Story = {
  args: {
    title: 'Quá hạn',
    value: 3,
    icon: 'warning',
    variant: 'red',
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading State',
    value: 0,
    variant: 'blue',
    loading: true,
  },
};

export const WithSuffix: Story = {
  args: {
    title: 'Tỷ lệ hoàn thành',
    value: 85.5,
    suffix: '%',
    precision: 1,
    variant: 'green',
    icon: 'check',
  },
};

export const Money: Story = {
  args: {
    title: 'Tổng doanh thu',
    value: 125000000,
    suffix: 'VNĐ',
    variant: 'blue',
    icon: 'money',
  },
};

export const Users: Story = {
  args: {
    title: 'Người dùng',
    value: 156,
    variant: 'purple',
    icon: 'users',
  },
};

export const Messages: Story = {
  args: {
    title: 'Tin nhắn mới',
    value: 23,
    variant: 'orange',
    icon: 'message',
  },
};

export const Folder: Story = {
  args: {
    title: 'Tài liệu',
    value: 89,
    variant: 'blue',
    icon: 'folder',
  },
};

export const Shield: Story = {
  args: {
    title: 'Đã phê duyệt',
    value: 45,
    variant: 'green',
    icon: 'shield',
  },
};

// Dashboard layout story
export const Dashboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      <StatCard title="Tổng yêu cầu" value={42} icon="file" variant="blue" />
      <StatCard title="Đang xử lý" value={12} icon="clock" variant="orange" />
      <StatCard title="Đã hoàn thành" value={28} icon="check" variant="green" />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
