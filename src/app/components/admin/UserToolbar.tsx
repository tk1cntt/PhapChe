'use client';

import React, { useState } from 'react';

interface FilterState {
  search: string;
  role?: string;
  workspace?: string;
}

interface UserToolbarProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
}

export default function UserToolbar({ onSearch, onFilterChange }: UserToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
    onFilterChange?.({ search: query, role: selectedRole, workspace: selectedWorkspace });
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    onFilterChange?.({ search: searchQuery, role, workspace: selectedWorkspace });
  };

  const handleWorkspaceSelect = (workspace: string) => {
    setSelectedWorkspace(workspace);
    onFilterChange?.({ search: searchQuery, role: selectedRole, workspace });
  };

  return (
    <div className="toolbar-card">
      <div className="toolbar">
        {/* Left Tools */}
        <div className="left-tools">
          {/* Search Input */}
          <div className="user-search">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#718096"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filters Button */}
          <button className="tool-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
            </svg>
            Filters
          </button>

          {/* Role Dropdown */}
          <button
            className="tool-btn"
            onClick={() => handleRoleSelect(selectedRole === 'Role' ? '' : 'Role')}
          >
            {selectedRole || 'Role'}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Workspace Dropdown */}
          <button
            className="tool-btn"
            onClick={() => handleWorkspaceSelect(selectedWorkspace === 'Workspace' ? '' : 'Workspace')}
          >
            {selectedWorkspace || 'Workspace'}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Right Tools */}
        <div className="right-tools">
          {/* Refresh Button */}
          <button className="tool-btn icon-only">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 16v5h5" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 8V3h-5" />
            </svg>
          </button>

          {/* Export Button */}
          <button className="tool-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export
          </button>

          {/* Columns Button */}
          <button className="tool-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Columns
          </button>
        </div>
      </div>
    </div>
  );
}
