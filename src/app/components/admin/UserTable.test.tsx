import { render, screen } from '@testing-library/react';
import UserTable from './UserTable';

describe('UserTable', () => {
  describe('Table Header', () => {
    it('renders table header with 8 columns', () => {
      render(<UserTable />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Active')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders checkboxes in header row', () => {
      const { container } = render(<UserTable />);
      const checkboxes = container.querySelectorAll('.checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Sample Users', () => {
    it('renders 8 sample users', () => {
      render(<UserTable />);

      expect(screen.getByText('Alex Nguyen')).toBeInTheDocument();
      expect(screen.getByText('Hà Linh')).toBeInTheDocument();
      expect(screen.getByText('Quang Dũng')).toBeInTheDocument();
      expect(screen.getByText('Minh Trang')).toBeInTheDocument();
      expect(screen.getByText('Mai Phương')).toBeInTheDocument();
      expect(screen.getByText('Trần Nam')).toBeInTheDocument();
      expect(screen.getByText('Khánh An')).toBeInTheDocument();
      expect(screen.getByText('Linh Anh')).toBeInTheDocument();
    });

    it('renders correct emails for all users', () => {
      render(<UserTable />);

      expect(screen.getByText('alex.nguyen@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('ha.linh@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('dung.quang@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('minh.trang@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('mai.phuong@anphat.vn')).toBeInTheDocument();
      expect(screen.getByText('nam.tran@minhkhang.vn')).toBeInTheDocument();
      expect(screen.getByText('khanh.an@gitnexus.vn')).toBeInTheDocument();
      expect(screen.getByText('linh.anh@anphat.vn')).toBeInTheDocument();
    });
  });

  describe('Role Badges', () => {
    it('renders super_admin role badge', () => {
      render(<UserTable />);
      expect(screen.getByText('super_admin')).toBeInTheDocument();
    });

    it('renders specialist role badge', () => {
      render(<UserTable />);
      expect(screen.getByText('specialist')).toBeInTheDocument();
    });

    it('renders reviewer role badge', () => {
      render(<UserTable />);
      expect(screen.getByText('reviewer')).toBeInTheDocument();
    });

    it('renders customer role badges', () => {
      render(<UserTable />);
      const customers = screen.getAllByText('customer');
      expect(customers.length).toBeGreaterThan(0);
    });
  });

  describe('Status Badges', () => {
    it('renders active status badges', () => {
      render(<UserTable />);
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it('renders invited status badge', () => {
      render(<UserTable />);
      expect(screen.getByText('Invited')).toBeInTheDocument();
    });

    it('renders inactive status badge', () => {
      render(<UserTable />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Workspace Display', () => {
    it('renders All workspaces for super_admin', () => {
      render(<UserTable />);
      const allWorkspaces = screen.getAllByText('All workspaces');
      expect(allWorkspaces.length).toBe(2); // Alex Nguyen and Khanh An
    });

    it('renders workspace names for regular users', () => {
      render(<UserTable />);
      expect(screen.getByText('Công ty An Phát')).toBeInTheDocument();
      expect(screen.getByText('Công ty Minh Khang')).toBeInTheDocument();
    });
  });

  describe('Action Links', () => {
    it('renders Edit links for active users', () => {
      render(<UserTable />);
      const editLinks = screen.getAllByText('Edit →');
      expect(editLinks.length).toBe(6);
    });

    it('renders Resend link for invited user', () => {
      render(<UserTable />);
      expect(screen.getByText('Resend →')).toBeInTheDocument();
    });

    it('renders Activate link for inactive user', () => {
      render(<UserTable />);
      expect(screen.getByText('Activate →')).toBeInTheDocument();
    });
  });

  describe('Avatars', () => {
    it('renders user initials in avatars', () => {
      render(<UserTable />);
      expect(screen.getByText('A')).toBeInTheDocument(); // Alex Nguyen
      expect(screen.getByText('HL')).toBeInTheDocument(); // Ha Linh
      expect(screen.getByText('TN')).toBeInTheDocument(); // Tran Nam
    });
  });

  describe('Table Structure', () => {
    it('renders table card wrapper', () => {
      const { container } = render(<UserTable />);
      const tableCard = container.querySelector('.table-card');
      expect(tableCard).toBeInTheDocument();
    });

    it('renders table head row', () => {
      const { container } = render(<UserTable />);
      const tableHead = container.querySelector('.table-head');
      expect(tableHead).toBeInTheDocument();
    });

    it('renders all user rows', () => {
      const { container } = render(<UserTable />);
      const rows = container.querySelectorAll('.table-row');
      expect(rows.length).toBe(8);
    });
  });
});
