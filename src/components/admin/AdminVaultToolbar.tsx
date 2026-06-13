'use client';

import { Search, Filter, RefreshCw, Download, SlidersHorizontal } from 'lucide-react';

interface AdminVaultToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function AdminVaultToolbar({ search, onSearchChange, onRefresh, loading }: AdminVaultToolbarProps) {
  return (
    <div className="vault-toolbar">
      <div className="vault-toolbar-content">
        <div className="vault-toolbar-left">
          <div className="vault-search-input">
            <Search size={19} color="#718096" />
            <input
              type="text"
              placeholder="Tìm tệp, thư mục, thẻ, workspace..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <button className="vault-toolbar-btn">
            <Filter size={18} />
            Bộ lọc
          </button>

          <button className="vault-toolbar-btn">
            Thư mục
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button className="vault-toolbar-btn">
            Thẻ
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <div className="vault-toolbar-right">
          <button className="vault-toolbar-btn vault-toolbar-btn-icon" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={19} color={loading ? '#94a3b8' : '#0f172a'} />
          </button>

          <button className="vault-toolbar-btn">
            <Download size={18} />
            Export
          </button>

          <button className="vault-toolbar-btn">
            <SlidersHorizontal size={18} />
            Cột hiển thị
          </button>
        </div>
      </div>
    </div>
  );
}
