'use client';

import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export interface MyCasesToolbarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: string | null) => void;
  onTypeFilter: (type: string | null) => void;
  selectedStatus: string | null;
  selectedType: string | null;
}

export function MyCasesToolbar({
  onSearch,
  onStatusFilter,
  onTypeFilter,
  selectedStatus,
  selectedType,
}: MyCasesToolbarProps): JSX.Element {
  const [searchValue, setSearchValue] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const statusOptions = [
    { value: 'under_review', label: 'Đang review' },
    { value: 'needs_response', label: 'Cần phản hồi' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'submitted', label: 'Đã nộp' },
    { value: 'overdue', label: 'Quá hạn' },
  ];

  const typeOptions = [
    { value: 'contract_review', label: 'Rà soát hợp đồng' },
    { value: 'legal_amendment', label: 'Soạn phụ lục SLA' },
    { value: 'nda_advisory', label: 'Tư vấn NDA' },
    { value: 'document_request', label: 'Bổ sung giấy phép' },
    { value: 'ip_filing', label: 'Đăng ký nhãn hiệu' },
  ];

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  }, [onSearch]);

  const handleStatusSelect = useCallback((status: string | null) => {
    onStatusFilter(status);
    setShowStatusDropdown(false);
  }, [onStatusFilter]);

  const handleTypeSelect = useCallback((type: string | null) => {
    onTypeFilter(type);
    setShowTypeDropdown(false);
  }, [onTypeFilter]);

  return (
    <div className="toolbar-card">
      <div className="toolbar">
        <div className="toolbar_left">
          <div className="request-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm mã hồ sơ, loại yêu cầu..."
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <button className="tool-btn">
            <SlidersHorizontal size={18} />
            Bộ lọc
          </button>

          {/* Status dropdown */}
          <div className="toolbar-dropdown">
            <button
              className="tool-btn"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              Trạng thái
              <ChevronDown size={16} />
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${!selectedStatus ? 'active' : ''}`}
                  onClick={() => handleStatusSelect(null)}
                >
                  Tất cả
                </button>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`dropdown-item ${selectedStatus === opt.value ? 'active' : ''}`}
                    onClick={() => handleStatusSelect(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type dropdown */}
          <div className="toolbar-dropdown">
            <button
              className="tool-btn"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              Loại yêu cầu
              <ChevronDown size={16} />
            </button>
            {showTypeDropdown && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${!selectedType ? 'active' : ''}`}
                  onClick={() => handleTypeSelect(null)}
                >
                  Tất cả
                </button>
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`dropdown-item ${selectedType === opt.value ? 'active' : ''}`}
                    onClick={() => handleTypeSelect(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <button className="tool-btn">
            Export
          </button>
          <button className="tool-btn">
            Cột hiển thị
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyCasesToolbar;
