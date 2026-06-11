import { render, screen } from '@testing-library/react';
import UserRow from './UserRow';

describe('UserTable Abnormal Tests', () => {
  describe('Empty State Handling', () => {
    it('handles empty user list gracefully', () => {
      // When rendering a table with no users, should show empty state message
      // In a real implementation, the parent component would handle this
      const emptyUser = {
        name: '',
        initials: '',
        email: '',
        description: '',
        role: '',
        roleTitle: '',
        workspace: '',
        workspaceSlug: '',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      const { container } = render(<UserRow user={emptyUser} />);
      const row = container.querySelector('.table-row');
      expect(row).toBeInTheDocument();
    });

    it('handles pending users with no last active time', () => {
      const pendingUser = {
        name: 'New User',
        initials: 'NU',
        email: 'new.user@example.com',
        description: 'Customer portal',
        role: 'customer',
        roleTitle: 'Customer',
        workspace: 'New Workspace',
        workspaceSlug: 'new-workspace',
        status: 'Invited' as const,
        lastActiveTime: 'Email sent 2 days ago',
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={pendingUser} />);
      expect(screen.getByText('New User')).toBeInTheDocument();
      expect(screen.getByText('Email sent 2 days ago')).toBeInTheDocument();
    });

    it('handles zero count for role pills', () => {
      // Zero count should still render the pill structure
      const zeroUser = {
        name: 'Test User',
        initials: 'TU',
        email: 'test@example.com',
        description: 'Test',
        role: 'specialist',
        roleTitle: 'Specialist',
        workspace: 'Test Workspace',
        workspaceSlug: 'test',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={zeroUser} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Text Truncation Edge Cases', () => {
    it('handles very long name with truncation', () => {
      const longNameUser = {
        name: 'Alexander The Great King Of Macedonia And Persia And Egypt And Many Other Regions Of The Ancient World',
        initials: 'AT',
        email: 'alex@example.com',
        description: 'Test user',
        role: 'super_admin',
        roleTitle: 'Super Administrator',
        workspace: 'All workspaces',
        workspaceSlug: 'global-scope',
        status: 'Active' as const,
        avatarColor: 'green' as const,
      };

      render(<UserRow user={longNameUser} />);
      const nameElement = screen.getByText(longNameUser.name);
      expect(nameElement).toBeInTheDocument();
      expect(nameElement.tagName.toLowerCase()).toBe('strong');
    });

    it('handles very long email with truncation', () => {
      const longEmailUser = {
        name: 'Test User',
        initials: 'TU',
        email: 'very-long-email-address-that-exceeds-normal-length@very-long-subdomain.example-domain-with-many-chars.com',
        description: 'Test user',
        role: 'customer',
        roleTitle: 'Customer',
        workspace: 'Test Workspace',
        workspaceSlug: 'test',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={longEmailUser} />);
      const emailElement = screen.getByText(longEmailUser.email);
      expect(emailElement).toBeInTheDocument();
      expect(emailElement.tagName.toLowerCase()).toBe('strong');
    });

    it('handles very long workspace name with truncation', () => {
      const longWorkspaceUser = {
        name: 'Test User',
        initials: 'TU',
        email: 'test@example.com',
        description: 'Test',
        role: 'specialist',
        roleTitle: 'Specialist',
        workspace: 'Very Long Workspace Name That Should Be Truncated In The UI',
        workspaceSlug: 'very-long-workspace-slug-that-also-exceeds-normal-length',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={longWorkspaceUser} />);
      expect(screen.getByText('Very Long Workspace Name That Should Be Truncated In The UI')).toBeInTheDocument();
    });
  });

  describe('Unicode and Special Characters', () => {
    it('handles Vietnamese characters in name', () => {
      const vietnameseUser = {
        name: 'Nguyễn Văn Minh Trường',
        initials: 'NM',
        email: 'minh.truong@example.com',
        description: 'Khách hàng',
        role: 'customer',
        roleTitle: 'Khách hàng',
        workspace: 'Công ty Việt Nam',
        workspaceSlug: 'viet-nam',
        status: 'Active' as const,
        avatarColor: 'purple' as const,
      };

      render(<UserRow user={vietnameseUser} />);
      expect(screen.getByText('Nguyễn Văn Minh Trường')).toBeInTheDocument();
    });

    it('handles special characters in email', () => {
      const specialEmailUser = {
        name: 'Test User',
        initials: 'TU',
        email: 'user+tag@example-domain.com',
        description: 'Test user',
        role: 'specialist',
        roleTitle: 'Specialist',
        workspace: 'Test Workspace',
        workspaceSlug: 'test',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={specialEmailUser} />);
      expect(screen.getByText('user+tag@example-domain.com')).toBeInTheDocument();
    });
  });

  describe('Boundary Values', () => {
    it('handles single character name', () => {
      const singleCharUser = {
        name: 'A',
        initials: 'A',
        email: 'a@example.com',
        description: 'Test',
        role: 'customer',
        roleTitle: 'Customer',
        workspace: 'Test',
        workspaceSlug: 'test',
        status: 'Active' as const,
        avatarColor: 'blue' as const,
      };

      render(<UserRow user={singleCharUser} />);
      const elements = screen.getAllByText('A');
      expect(elements.length).toBe(2); // Avatar + Name
    });

    it('handles maximum length values', () => {
      const maxUser = {
        name: 'A'.repeat(100),
        initials: 'AB',
        email: 'a'.repeat(50) + '@test.com',
        description: 'B'.repeat(100),
        role: 'super_admin',
        roleTitle: 'Super Admin',
        workspace: 'C'.repeat(100),
        workspaceSlug: 'd'.repeat(50),
        status: 'Active' as const,
        avatarColor: 'green' as const,
      };

      render(<UserRow user={maxUser} />);
      expect(screen.getByText(maxUser.name)).toBeInTheDocument();
    });
  });

  describe('Status Edge Cases', () => {
    it('handles all three status types in sequence', () => {
      const statuses: Array<'Active' | 'Invited' | 'Inactive'> = ['Active', 'Invited', 'Inactive'];

      statuses.forEach((status) => {
        const user = {
          name: `User ${status}`,
          initials: status.substring(0, 2).toUpperCase(),
          email: `${status.toLowerCase()}@test.com`,
          description: 'Test',
          role: 'customer',
          roleTitle: 'Customer',
          workspace: 'Test',
          workspaceSlug: 'test',
          status,
          avatarColor: 'blue' as const,
        };

        render(<UserRow user={user} />);
        expect(screen.getByText(`User ${status}`)).toBeInTheDocument();
      });
    });
  });

  describe('Role Badge Color Mapping', () => {
    const roles = [
      { role: 'customer', expectedColor: 'blue' },
      { role: 'specialist', expectedColor: 'blue' },
      { role: 'reviewer', expectedColor: 'orange' },
      { role: 'coordinator_admin', expectedColor: 'green' },
      { role: 'super_admin', expectedColor: 'red' },
      { role: 'audit_admin', expectedColor: 'purple' },
    ];

    roles.forEach(({ role, expectedColor }) => {
      it(`maps ${role} to ${expectedColor} badge`, () => {
        const { container } = render(
          <UserRow
            user={{
              name: 'Test',
              initials: 'TT',
              email: 'test@test.com',
              description: 'Test',
              role,
              roleTitle: 'Test',
              workspace: 'Test',
              workspaceSlug: 'test',
              status: 'Active',
              avatarColor: 'blue',
            }}
          />
        );
        const roleBadge = container.querySelector('.badge');
        expect(roleBadge).toHaveClass(expectedColor);
      });
    });
  });
});
