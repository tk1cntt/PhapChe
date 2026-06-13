'use client';

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
  };
}

const toolBtnStyle = 'h-11 border border-gray-200 bg-white rounded-lg px-4 flex items-center gap-[10px] text-[14px] font-bold text-[#1e293b] cursor-pointer';

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
}: UserToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-t-[15px] shadow-sm p-5 border-b-0">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="w-[330px] h-11 border border-gray-200 rounded-lg flex items-center gap-[11px] px-[14px] bg-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder={translations.searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch('search', e.target.value || null)}
              className="border-none outline-none flex-1 text-[14px] bg-transparent"
            />
          </div>

          {/* Filter Button */}
          <button className={toolBtnStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
            </svg>
            {translations.filterRole}
          </button>

          {/* Role Dropdown */}
          <button
            className={toolBtnStyle}
            onClick={() => onRoleFilter(selectedRole ? null : 'specialist')}
            style={{
              borderColor: selectedRole ? '#087f78' : '#dfe7f1',
              background: selectedRole ? '#f0fdfa' : '#fff',
            }}
          >
            {translations.filterRole}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Workspace Dropdown */}
          <button
            className={toolBtnStyle}
            onClick={() => onWorkspaceFilter(selectedWorkspace ? null : null)}
            style={{
              borderColor: selectedWorkspace ? '#087f78' : '#dfe7f1',
              background: selectedWorkspace ? '#f0fdfa' : '#fff',
            }}
          >
            {translations.filterWorkspace}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            className="w-[52px] h-11 border border-gray-200 bg-white rounded-lg flex items-center justify-center cursor-pointer"
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
          <button className={toolBtnStyle} onClick={onExport}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M12 15V3"/>
            </svg>
            {translations.export}
          </button>

          {/* Columns Button */}
          <button className={toolBtnStyle}>
            {translations.columns}
          </button>
        </div>
      </div>
    </div>
  );
}
