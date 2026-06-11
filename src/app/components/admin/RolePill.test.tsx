import { render, screen } from '@testing-library/react';
import RolePill from './RolePill';

describe('RolePill', () => {
  describe('Basic Rendering', () => {
    it('renders role name and count correctly', () => {
      render(<RolePill role="Customer" count={72} variant="blue" />);
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('renders with correct CSS class for variant', () => {
      const { container } = render(<RolePill role="Reviewer" count={14} variant="orange" />);
      const pill = container.querySelector('.role-pill');
      expect(pill).toHaveClass('orange');
    });
  });

  describe('Variant Rendering', () => {
    it('renders with blue variant', () => {
      const { container } = render(<RolePill role="Customer" count={72} variant="blue" />);
      expect(container.querySelector('.role-pill')).toHaveClass('blue');
    });

    it('renders with orange variant', () => {
      const { container } = render(<RolePill role="Reviewer" count={14} variant="orange" />);
      expect(container.querySelector('.role-pill')).toHaveClass('orange');
    });

    it('renders with green variant', () => {
      const { container } = render(<RolePill role="Coordinator Admin" count={10} variant="green" />);
      expect(container.querySelector('.role-pill')).toHaveClass('green');
    });

    it('renders with red variant', () => {
      const { container } = render(<RolePill role="Super Admin" count={4} variant="red" />);
      expect(container.querySelector('.role-pill')).toHaveClass('red');
    });

    it('renders with purple variant', () => {
      const { container } = render(<RolePill role="Pending" count={9} variant="purple" />);
      expect(container.querySelector('.role-pill')).toHaveClass('purple');
    });
  });

  describe('Count Badge', () => {
    it('displays count as badge within pill', () => {
      render(<RolePill role="Specialist" count={18} variant="blue" />);
      const badge = screen.getByText('18');
      expect(badge.tagName.toLowerCase()).toBe('b');
    });

    it('renders different count values correctly', () => {
      render(<RolePill role="Test Role" count={999} variant="blue" />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });
});
