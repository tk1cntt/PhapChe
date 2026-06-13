'use client';

import { useState } from 'react';

interface UserToolbarProps {
  searchValue: string;
  selectedRole?: string;
  selectedWorkspace?: string;
  onSearch: (key: string, value: string | null) => void;
  onRoleFilter: (role: string | null) => void;
  onWorkspaceFilter: (workspace: string | null) => void;
  onRefresh: () => void;
  onExport: () => void;
  translations: {
    searchPlaceholder: string;
    filterRole: string;
    filterWorkspace: string;
    refresh: string;
    export: string;
    columns: string;
    allRoles: string;
    allWorkspaces: string;
  };
  workspaceOptions?: { id: string; name: string }[];
}

const ROLES = ['super_admin', 'audit_admin', 'coordinator_admin', 'reviewer', 'specialist', 'customer'] as const;

const toolBtnStyle: React.CSSProperties = {
  height: 44,
  border: '1px solid #dfe7f1',
  background: '#fff',
  borderRadius: 8,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#1e293b',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

export default function UserToolbar({
  searchValue,
  selectedRole,
  selectedWorkspace,
  onSearch,
  onRoleFilter,
  onWorkspaceFilter,
  onRefresh,
  onExport,
  translations,
  workspaceOptions = [],
}: UserToolbarProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: '15px 15px 0 0',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
      padding: 20,
      borderBottom: 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Input */}
          <div style={{
            width: 330,
            height: 44,
            border: '1px solid #dfe7f1',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '0 14px',
            background: '#fff',
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder={translations.searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch('search', e.target.value || null)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              style={{
                ...toolBtnStyle,
                borderColor: selectedRole ? '#087f78' : '#dfe7f1',
                background: selectedRole ? '#f0fdfa' : '#fff',
              }}
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowWorkspaceDropdown(false);
              }}
            >
              {selectedRole || translations.allRoles || 'All Roles'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {showRoleDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                width: 180,
                background: '#fff',
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                zIndex: 50,
              }}>
                <button
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => {
                    onRoleFilter(null);
                    setShowRoleDropdown(false);
                  }}
                >
                  {translations.allRoles || 'All Roles'}
                </button>
                {ROLES.map((role) => (
                  <button
                    key={role}
                    style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                    onClick={() => {
                      onRoleFilter(role);
                      setShowRoleDropdown(false);
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              style={{
                ...toolBtnStyle,
                borderColor: selectedWorkspace ? '#087f78' : '#dfe7f1',
                background: selectedWorkspace ? '#f0fdfa' : '#fff',
              }}
              onClick={() => {
                setShowWorkspaceDropdown(!showWorkspaceDropdown);
                setShowRoleDropdown(false);
              }}
            >
              {selectedWorkspace || translations.allWorkspaces || 'All Workspaces'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {showWorkspaceDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                width: 200,
                background: '#fff',
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                zIndex: 50,
              }}>
                <button
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => {
                    onWorkspaceFilter(null);
                    setShowWorkspaceDropdown(false);
                  }}
                >
                  {translations.allWorkspaces || 'All Workspaces'}
                </button>
                {workspaceOptions.map((ws) => (
                  <button
                    key={ws.id}
                    style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}
                    onClick={() => {
                      onWorkspaceFilter(ws.id);
                      setShowWorkspaceDropdown(false);
                    }}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Refresh Button */}
          <button
            style={{
              width: 52,
              height: 44,
              border: '1px solid #dfe7f1',
              background: '#fff',
              borderRadius: 8,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={onRefresh}
            title={translations.refresh}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 16v5h5"/>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 8V3h-5"/>
            </svg>
          </button>

          {/* Export Button */}
          <button style={toolBtnStyle} onClick={onExport}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M12 15V3"/>
            </svg>
            {translations.export}
          </button>

          {/* Columns Button */}
          <button style={toolBtnStyle}>
            {translations.columns}
          </button>
        </div>
      </div>
    </div>
  );
}
