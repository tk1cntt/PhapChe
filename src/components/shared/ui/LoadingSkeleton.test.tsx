import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  describe('Variant Rendering', () => {
    it('renders card variant correctly', () => {
      render(<LoadingSkeleton variant="card" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();

      // Check for card skeleton structure
      const cardElement = container.querySelector('[class*="rounded"]');
      expect(cardElement).toBeInTheDocument();
    });

    it('renders table-row variant correctly', () => {
      render(<LoadingSkeleton variant="table-row" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();

      // Check for table row structure (should have multiple skeleton elements)
      const skeletonElements = container.querySelectorAll('[class*="rounded"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('renders list-item variant correctly', () => {
      render(<LoadingSkeleton variant="list-item" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();

      // Check for list item structure
      const skeletonElements = container.querySelectorAll('[class*="rounded"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('renders text-line variant correctly', () => {
      render(<LoadingSkeleton variant="text-line" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();

      // Check for text line structure
      const skeletonElements = container.querySelectorAll('[class*="rounded"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('renders empty state when variant is empty array', () => {
      render(<LoadingSkeleton variant={[] as any} />);

      // Should not render anything
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Count Property', () => {
    it('renders single item when count is not specified', () => {
      render(<LoadingSkeleton variant="text-line" />);

      const container = screen.getByRole('status');
      const skeletons = container.querySelectorAll('[class*="h-4"]');
      expect(skeletons.length).toBe(1);
    });

    it('renders multiple items when count is specified', () => {
      render(<LoadingSkeleton variant="text-line" count={5} />);

      const container = screen.getByRole('status');
      const skeletons = container.querySelectorAll('[class*="h-4"]');
      expect(skeletons.length).toBe(5);
    });

    it('handles count of 0 correctly', () => {
      render(<LoadingSkeleton variant="text-line" count={0} />);

      const container = screen.getByRole('status');
      const skeletons = container.querySelectorAll('[class*="h-4"]');
      expect(skeletons.length).toBe(0);
    });

    it('handles large count values', () => {
      render(<LoadingSkeleton variant="text-line" count={20} />);

      const container = screen.getByRole('status');
      const skeletons = container.querySelectorAll('[class*="h-4"]');
      expect(skeletons.length).toBe(20);
    });
  });

  describe('Custom Class Names', () => {
    it('applies custom className to child skeleton elements', () => {
      render(<LoadingSkeleton variant="card" className="custom-class" />);

      const container = screen.getByRole('status');
      const skeletonElement = container.querySelector('[class*="h-[200px]"]') as HTMLElement;
      expect(skeletonElement).toHaveClass('custom-class');
    });

    it('combines custom className with default styles', () => {
      render(<LoadingSkeleton variant="card" className="my-custom-style" />);

      const container = screen.getByRole('status');
      const skeletonElement = container.querySelector('[class*="h-[200px]"]') as HTMLElement;
      expect(skeletonElement).toHaveClass('my-custom-style');
    });

    it('handles empty className gracefully', () => {
      render(<LoadingSkeleton variant="card" className="" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<LoadingSkeleton variant="card" />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('includes sr-only text for screen readers', () => {
      render(<LoadingSkeleton variant="card" />);

      const srText = screen.getByText('Đang tải...');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('sr-only text is not visible to sighted users', () => {
      render(<LoadingSkeleton variant="card" />);

      const srText = screen.getByText('Đang tải...');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Animation Classes', () => {
    it('applies pulse animation to skeleton elements', () => {
      render(<LoadingSkeleton variant="card" />);

      const container = screen.getByRole('status');
      const animatedElement = container.querySelector('[class*="animate-pulse"]');
      expect(animatedElement).toBeInTheDocument();
    });

    it('applies pulse animation to all items when count > 1', () => {
      render(<LoadingSkeleton variant="text-line" count={3} />);

      const container = screen.getByRole('status');
      const animatedElements = container.querySelectorAll('[class*="animate-pulse"]');
      expect(animatedElements.length).toBe(3);
    });
  });
});
