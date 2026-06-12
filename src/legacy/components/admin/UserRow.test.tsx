import { render, screen } from '@testing-library/react';
import UserRow from './UserRow';

describe('UserRow', () => {
  const defaultUser = {
    name: 'Alex Nguyen',
    initials: 'A',
    email: 'alex.nguyen@gitnexus.vn',
    description: 'Primary admin',
    role: 'super_admin',
    roleTitle: 'Super Admin',
    workspace: 'All workspaces',
    workspaceSlug: 'global-scope',
    status: 'Active' as const,
    lastActive: '10/06/2026',
    lastActiveTime: '21:42 ICT',
    avatarColor: 'green' as const,
  };

  describe('Column Rendering', () => {
    it('renders all 8 columns correctly', () => {
      render(<UserRow user={defaultUser} />);

      expect(screen.getByText('Alex Nguyen')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('alex.nguyen@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('Primary admin')).toBeInTheDocument();
      expect(screen.getByText('super_admin')).toBeInTheDocument();
      expect(screen.getByText('All workspaces')).toBeInTheDocument();
      expect(screen.getByText('global-scope')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('10/06/2026')).toBeInTheDocument();
      expect(screen.getByText('21:42 ICT')).toBeInTheDocument();
    });

    it('renders checkbox in first column', () => {
      const { container } = render(<UserRow user={defaultUser} />);
      const checkbox = container.querySelector('.checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('displays avatar with initials', () => {
      render(<UserRow user={defaultUser} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('applies correct avatar color class', () => {
      const { container } = render(<UserRow user={defaultUser} />);
      const avatar = container.querySelector('.mini-avatar');
      expect(avatar).toHaveClass('green');
    });

    it('renders different avatar colors correctly', () => {
      const blueUser = { ...defaultUser, initials: 'HL', avatarColor: 'blue' as const };
      const { container } = render(<UserRow user={blueUser} />);
      expect(container.querySelector('.mini-avatar')).toHaveClass('blue');
    });

    it('renders orange avatar color', () => {
      const orangeUser = { ...defaultUser, initials: 'QD', avatarColor: 'orange' as const };
      const { container } = render(<UserRow user={orangeUser} />);
      expect(container.querySelector('.mini-avatar')).toHaveClass('orange');
    });

    it('renders purple avatar color', () => {
      const purpleUser = { ...defaultUser, initials: 'MT', avatarColor: 'purple' as const };
      const { container } = render(<UserRow user={purpleUser} />);
      expect(container.querySelector('.mini-avatar')).toHaveClass('purple');
    });
  });

  describe('Status Badges', () => {
    it('renders active status with green badge', () => {
      const { container } = render(<UserRow user={defaultUser} />);
      const badges = container.querySelectorAll('.badge');
      const statusBadge = badges[1]; // Second badge is status
      expect(statusBadge).toHaveClass('green');
    });

    it('renders invited status with orange badge', () => {
      const invitedUser = { ...defaultUser, status: 'Invited' as const };
      const { container } = render(<UserRow user={invitedUser} />);
      const badges = container.querySelectorAll('.badge');
      const statusBadge = badges[1];
      expect(statusBadge).toHaveClass('orange');
    });

    it('renders inactive status with red badge', () => {
      const inactiveUser = { ...defaultUser, status: 'Inactive' as const };
      const { container } = render(<UserRow user={inactiveUser} />);
      const badges = container.querySelectorAll('.badge');
      const statusBadge = badges[1];
      expect(statusBadge).toHaveClass('red');
    });
  });

  describe('Action Links', () => {
    it('shows Edit link for active users', () => {
      render(<UserRow user={defaultUser} />);
      expect(screen.getByText('Edit →')).toBeInTheDocument();
    });

    it('shows Resend link for invited users', () => {
      const invitedUser = { ...defaultUser, status: 'Invited' as const };
      render(<UserRow user={invitedUser} />);
      expect(screen.getByText('Resend →')).toBeInTheDocument();
    });

    it('shows Activate link for inactive users', () => {
      const inactiveUser = { ...defaultUser, status: 'Inactive' as const };
      render(<UserRow user={inactiveUser} />);
      expect(screen.getByText('Activate →')).toBeInTheDocument();
    });
  });

  describe('Hover Effect', () => {
    it('applies hover class on table row', () => {
      const { container } = render(<UserRow user={defaultUser} />);
      const row = container.querySelector('.table-row');
      expect(row).toBeInTheDocument();
    });
  });
});
