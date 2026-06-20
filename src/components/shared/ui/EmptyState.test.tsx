import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from './EmptyState';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'noData': 'Không có dữ liệu',
      'create': 'Tạo mới',
    };
    return translations[key] || key;
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'noData': 'Không có dữ liệu',
      'create': 'Tạo mới',
    };
    return translations[key] || key;
  },
}));

describe('EmptyState Component', () => {
  describe('Title Rendering', () => {
    it('renders custom title when provided', () => {
      render(<EmptyState title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders default title "Không có dữ liệu" when no title provided', () => {
      render(<EmptyState />);

      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });

    it('renders empty string title when explicitly set', () => {
      render(<EmptyState title="" />);

      // Empty string should still render the heading element
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Description Rendering', () => {
    it('renders description when provided', () => {
      render(
        <EmptyState
          title="Title"
          description="This is a description"
        />
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<EmptyState title="Title" />);

      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });

    it('renders multiline description correctly', () => {
      render(
        <EmptyState
          title="Title"
          description="Line 1\nLine 2\nLine 3"
        />
      );

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders action button when action prop is provided', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="Title"
          action={{ onClick, label: 'Click Me' }}
        />
      );

      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('renders default action label "Tạo mới" when label not provided', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="Title"
          action={{ onClick }}
        />
      );

      expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeInTheDocument();
    });

    it('does not render action button when action prop is not provided', () => {
      render(<EmptyState title="Title" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick handler when button is clicked', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="Title"
          action={{ onClick, label: 'Click' }}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick handler multiple times on multiple clicks', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="Title"
          action={{ onClick, label: 'Click' }}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Icon', () => {
    it('renders custom icon when provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
      render(<EmptyState title="Title" icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders default icon when icon not provided', () => {
      render(<EmptyState title="Title" />);

      // Default icon is an SVG with inbox icon
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('replaces default icon with custom icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      render(<EmptyState title="Title" icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      // Default SVG should not be present
      expect(document.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies flexbox layout classes', () => {
      const { container } = render(<EmptyState title="Title" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex');
      expect(mainDiv).toHaveClass('flex-col');
      expect(mainDiv).toHaveClass('items-center');
      expect(mainDiv).toHaveClass('justify-center');
    });

    it('applies minimum height for visual presence', () => {
      const { container } = render(<EmptyState title="Title" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/min-h-/);
    });

    it('applies padding for spacing', () => {
      const { container } = render(<EmptyState title="Title" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/p-/);
    });

    it('applies appropriate styling to title', () => {
      render(<EmptyState title="Title" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('Combined Props', () => {
    it('renders all props together correctly', () => {
      const onClick = vi.fn();
      const CustomIcon = () => <div data-testid="icon">Icon</div>;

      render(
        <EmptyState
          title="Full Title"
          description="Full Description"
          action={{ onClick, label: 'Full Action' }}
          icon={<CustomIcon />}
        />
      );

      expect(screen.getByText('Full Title')).toBeInTheDocument();
      expect(screen.getByText('Full Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Full Action' })).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('handles all optional props being undefined', () => {
      render(<EmptyState />);

      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic heading for title', () => {
      render(<EmptyState title="Title" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('uses semantic button for action', () => {
      const onClick = vi.fn();
      render(<EmptyState action={{ onClick }} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('button has accessible name from label', () => {
      const onClick = vi.fn();
      render(<EmptyState action={{ onClick, label: 'Accessible Name' }} />);

      const button = screen.getByRole('button', { name: 'Accessible Name' });
      expect(button).toBeInTheDocument();
    });
  });
});
