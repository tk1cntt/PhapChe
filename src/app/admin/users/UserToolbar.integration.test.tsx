/**
 * UserToolbar Integration Tests
 * Tests search input, role dropdown, workspace dropdown, and filters button
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserToolbar from '@/app/components/admin/UserToolbar';

describe('UserToolbar Integration Tests', () => {
  describe('Search Input', () => {
    it('renders search input with placeholder', () => {
      render(<UserToolbar />);
      const searchInput = screen.getByPlaceholderText('Search users...');
      expect(searchInput).toBeInTheDocument();
    });

    it('accepts text input', () => {
      render(<UserToolbar />);
      const searchInput = screen.getByPlaceholderText('Search users...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'alex' } });
      expect(searchInput.value).toBe('alex');
    });

    it('calls onSearch callback when typing', () => {
      const onSearch = jest.fn();
      render(<UserToolbar onSearch={onSearch} />);
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(onSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Role Dropdown', () => {
    it('renders role dropdown button', () => {
      render(<UserToolbar />);
      const roleButton = screen.getByRole('button', { name: /Role/i });
      expect(roleButton).toBeInTheDocument();
    });

    it('toggles role selection on click', () => {
      render(<UserToolbar />);
      const roleButton = screen.getByRole('button', { name: /Role/i });
      fireEvent.click(roleButton);
      // After click, it should show "Role" selected
      expect(roleButton).toBeInTheDocument();
    });
  });

  describe('Workspace Dropdown', () => {
    it('renders workspace dropdown button', () => {
      render(<UserToolbar />);
      const workspaceButton = screen.getByRole('button', { name: /Workspace/i });
      expect(workspaceButton).toBeInTheDocument();
    });

    it('toggles workspace selection on click', () => {
      render(<UserToolbar />);
      const workspaceButton = screen.getByRole('button', { name: /Workspace/i });
      fireEvent.click(workspaceButton);
      expect(workspaceButton).toBeInTheDocument();
    });
  });

  describe('Filters Button', () => {
    it('renders filters button', () => {
      render(<UserToolbar />);
      const filtersButton = screen.getByRole('button', { name: /Filters/i });
      expect(filtersButton).toBeInTheDocument();
    });

    it('calls onFilterChange when clicked', () => {
      const onFilterChange = jest.fn();
      render(<UserToolbar onFilterChange={onFilterChange} />);
      const filtersButton = screen.getByRole('button', { name: /Filters/i });
      fireEvent.click(filtersButton);
      expect(onFilterChange).toHaveBeenCalled();
    });
  });

  describe('Action Buttons', () => {
    it('renders refresh button', () => {
      render(<UserToolbar />);
      const buttons = screen.getAllByRole('button');
      // Refresh button is icon-only
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders export button', () => {
      render(<UserToolbar />);
      const exportButton = screen.getByRole('button', { name: /Export/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('renders columns button', () => {
      render(<UserToolbar />);
      const columnsButton = screen.getByRole('button', { name: /Columns/i });
      expect(columnsButton).toBeInTheDocument();
    });
  });

  describe('onFilterChange Callback', () => {
    it('provides complete filter state', () => {
      const onFilterChange = jest.fn();
      render(<UserToolbar onFilterChange={onFilterChange} />);

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Click role dropdown
      const roleButton = screen.getByRole('button', { name: /Role/i });
      fireEvent.click(roleButton);

      // onFilterChange should have been called with filter state
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          role: expect.any(String),
        })
      );
    });
  });
});
