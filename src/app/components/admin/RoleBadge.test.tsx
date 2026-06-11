import { render, screen } from '@testing-library/react';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
  describe('Basic Rendering', () => {
    it('renders role name correctly', () => {
      render(<RoleBadge role="customer" />);
      expect(screen.getByText('customer')).toBeInTheDocument();
    });

    it('renders with correct badge class', () => {
      const { container } = render(<RoleBadge role="customer" />);
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Role Color Variants', () => {
    it('renders customer role with blue badge', () => {
      const { container } = render(<RoleBadge role="customer" />);
      expect(container.querySelector('.badge')).toHaveClass('blue');
    });

    it('renders specialist role with blue badge', () => {
      const { container } = render(<RoleBadge role="specialist" />);
      expect(container.querySelector('.badge')).toHaveClass('blue');
    });

    it('renders reviewer role with orange badge', () => {
      const { container } = render(<RoleBadge role="reviewer" />);
      expect(container.querySelector('.badge')).toHaveClass('orange');
    });

    it('renders coordinator_admin role with green badge', () => {
      const { container } = render(<RoleBadge role="coordinator_admin" />);
      expect(container.querySelector('.badge')).toHaveClass('green');
    });

    it('renders super_admin role with red badge', () => {
      const { container } = render(<RoleBadge role="super_admin" />);
      expect(container.querySelector('.badge')).toHaveClass('red');
    });

    it('renders audit_admin role with purple badge', () => {
      const { container } = render(<RoleBadge role="audit_admin" />);
      expect(container.querySelector('.badge')).toHaveClass('purple');
    });
  });

  describe('Case Insensitivity', () => {
    it('handles uppercase role names', () => {
      const { container } = render(<RoleBadge role="SUPER_ADMIN" />);
      expect(container.querySelector('.badge')).toHaveClass('red');
    });

    it('handles mixed case role names', () => {
      const { container } = render(<RoleBadge role="Reviewer" />);
      expect(container.querySelector('.badge')).toHaveClass('orange');
    });
  });

  describe('Default Behavior', () => {
    it('defaults to blue for unknown roles', () => {
      const { container } = render(<RoleBadge role="unknown_role" />);
      expect(container.querySelector('.badge')).toHaveClass('blue');
    });
  });
});
