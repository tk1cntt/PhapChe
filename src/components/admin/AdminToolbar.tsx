'use client';

interface AdminToolbarProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  translations?: {
    searchPlaceholder?: string;
    filter?: string;
    status?: string;
    workspace?: string;
    export?: string;
    columns?: string;
    refresh?: string;
  };
}

export default function AdminToolbar({
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  translations = {}
}: AdminToolbarProps) {
  const t = {
    searchPlaceholder: translations.searchPlaceholder || 'Tìm hồ sơ, workspace, người phụ trách...',
    filter: translations.filter || 'Bộ lọc',
    status: translations.status || 'Trạng thái',
    workspace: translations.workspace || 'Workspace',
    export: translations.export || 'Export',
    columns: translations.columns || 'Cột hiển thị',
    refresh: translations.refresh || 'Làm mới',
  };

  return (
    <div
      className="bg-white border rounded-[15px] p-5 mb-5"
      style={{
        borderColor: 'var(--border)',
        boxShadow: 'var(--soft-shadow)',
      }}
    >
      <div className="flex justify-between items-center gap-4">
        {/* Left Tools */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div
            className="w-[370px] h-11 border rounded-lg flex items-center gap-[11px] px-3.5 text-[#718096] bg-white"
            style={{ borderColor: 'var(--border)' }}
          >
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
              placeholder={t.searchPlaceholder}
              className="border-0 outline-none flex-1 text-sm bg-transparent text-[#334155]"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={onFilter}
            className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
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
            {t.filter}
          </button>

          {/* Status Dropdown */}
          <button
            className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            {t.status}
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
            className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            {t.workspace}
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
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="w-[52px] h-11 border rounded-lg flex items-center justify-center cursor-pointer bg-white"
            style={{ borderColor: 'var(--border)' }}
            title={t.refresh}
          >
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
          <button
            onClick={onExport}
            className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
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
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.export}
          </button>

          {/* Columns Button */}
          <button
            className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
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
            {t.columns}
          </button>
        </div>
      </div>
    </div>
  );
}
