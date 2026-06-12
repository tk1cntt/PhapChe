import { render, screen } from '@testing-library/react';
import UserStatCard from './UserStatCard';

describe('UserStatCard', () => {
  const defaultProps = {
    title: 'Total Users',
    value: '128',
    description: 'Across all workspaces',
  };

  describe('Variant Rendering', () => {
    it('renders with blue variant', () => {
      render(<UserStatCard {...defaultProps} variant="blue" icon={<span>Icon</span>} />);
      expect(screen.getByText('128')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Across all workspaces')).toBeInTheDocument();
    });

    it('renders with green variant', () => {
      render(
        <UserStatCard
          variant="green"
          title="Active Users"
          value="112"
          description="87.5% of total users"
          icon={<span>Icon</span>}
        />
      );
      expect(screen.getByText('112')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });

    it('renders with orange variant', () => {
      render(
        <UserStatCard
          variant="orange"
          title="Pending Invitations"
          value="9"
          description="Awaiting acceptance"
          icon={<span>Icon</span>}
        />
      );
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
    });

    it('renders with purple variant', () => {
      render(
        <UserStatCard
          variant="purple"
          title="Workspaces"
          value="12"
          description="11 active workspaces"
          icon={<span>Icon</span>}
        />
      );
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Workspaces')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('displays correct icon for blue variant', () => {
      const icon = <svg data-testid="blue-icon" viewBox="0 0 24 24" />;
      render(<UserStatCard {...defaultProps} variant="blue" icon={icon} />);
      expect(screen.getByTestId('blue-icon')).toBeInTheDocument();
    });

    it('displays correct icon for green variant', () => {
      const icon = <svg data-testid="green-icon" viewBox="0 0 24 24" />;
      render(<UserStatCard {...defaultProps} variant="green" icon={icon} />);
      expect(screen.getByTestId('green-icon')).toBeInTheDocument();
    });

    it('displays correct icon for orange variant', () => {
      const icon = <svg data-testid="orange-icon" viewBox="0 0 24 24" />;
      render(<UserStatCard {...defaultProps} variant="orange" icon={icon} />);
      expect(screen.getByTestId('orange-icon')).toBeInTheDocument();
    });

    it('displays correct icon for purple variant', () => {
      const icon = <svg data-testid="purple-icon" viewBox="0 0 24 24" />;
      render(<UserStatCard {...defaultProps} variant="purple" icon={icon} />);
      expect(screen.getByTestId('purple-icon')).toBeInTheDocument();
    });
  });

  describe('Info Dot', () => {
    it('info dot visible in top-right corner', () => {
      render(<UserStatCard {...defaultProps} variant="blue" icon={<span>Icon</span>} />);
      const infoDot = screen.getByTestId('info-dot');
      expect(infoDot).toBeInTheDocument();
      expect(infoDot).toHaveTextContent('i');
    });
  });

  describe('Text Content', () => {
    it('displays correct value text', () => {
      render(<UserStatCard {...defaultProps} variant="blue" icon={<span>Icon</span>} />);
      expect(screen.getByText('128')).toBeInTheDocument();
    });

    it('displays correct title text', () => {
      render(<UserStatCard {...defaultProps} variant="blue" icon={<span>Icon</span>} />);
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('displays correct description text', () => {
      render(<UserStatCard {...defaultProps} variant="blue" icon={<span>Icon</span>} />);
      expect(screen.getByText('Across all workspaces')).toBeInTheDocument();
    });
  });
});
