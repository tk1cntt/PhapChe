'use client';

interface AdminToolbarProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
}

export default function AdminToolbar({ onSearch, onFilter, onExport }: AdminToolbarProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 15,
        boxShadow: 'var(--soft-shadow)',
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Left Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Input */}
          <div
            style={{
              width: 370,
              height: 44,
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '0 14px',
              color: '#718096',
              background: '#fff',
            }}
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
              placeholder="Tìm hồ sơ, workspace, người phụ trách..."
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: 14,
                background: 'transparent',
                color: '#334155',
              }}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={onFilter}
            style={{
              height: 44,
              border: '1px solid var(--border)',
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
            }}
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
            Bộ lọc
          </button>

          {/* Status Dropdown */}
          <button
            style={{
              height: 44,
              border: '1px solid var(--border)',
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
            }}
          >
            Trạng thái
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
            style={{
              height: 44,
              border: '1px solid var(--border)',
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
            }}
          >
            Workspace
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Refresh Button */}
          <button
            style={{
              width: 52,
              height: 44,
              border: '1px solid var(--border)',
              background: '#fff',
              borderRadius: 8,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
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
            style={{
              height: 44,
              border: '1px solid var(--border)',
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
            }}
          >
            Export
          </button>

          {/* Columns Button */}
          <button
            style={{
              height: 44,
              border: '1px solid var(--border)',
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
            }}
          >
            Cột hiển thị
          </button>
        </div>
      </div>
    </div>
  );
}
