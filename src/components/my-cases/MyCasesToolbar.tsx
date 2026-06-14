'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
}: MyCasesToolbarProps): React.ReactElement {
  const t = useTranslations('UserCases');
  const [searchValue, setSearchValue] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const statusOptions = [
    { value: 'under_review', label: t('statusUnderReview') },
    { value: 'needs_response', label: t('statusNeedsResponse') },
    { value: 'approved', label: t('statusApproved') },
    { value: 'submitted', label: t('statusSubmitted') },
    { value: 'overdue', label: t('statusOverdue') },
  ];

  const typeOptions = [
    { value: 'contract_review', label: t('typeContractReview') },
    { value: 'legal_amendment', label: t('typeLegalAmendment') },
    { value: 'nda_advisory', label: t('typeNdaAdvisory') },
    { value: 'document_request', label: t('typeDocumentRequest') },
    { value: 'ip_filing', label: t('typeIpFiling') },
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
        <div className="toolbar-left">
          <div className="request-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <button className="tool-btn">
            <SlidersHorizontal size={18} />
            {t('filters')}
          </button>

          {/* Status dropdown */}
          <div className="toolbar-dropdown">
            <button
              className="tool-btn"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              {t('statusLabel')}
              <ChevronDown size={16} />
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${!selectedStatus ? 'active' : ''}`}
                  onClick={() => handleStatusSelect(null)}
                >
                  {t('all')}
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
              {t('typeLabel')}
              <ChevronDown size={16} />
            </button>
            {showTypeDropdown && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${!selectedType ? 'active' : ''}`}
                  onClick={() => handleTypeSelect(null)}
                >
                  {t('all')}
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
            {t('columns')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyCasesToolbar;
