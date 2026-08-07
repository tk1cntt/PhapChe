'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export interface ToolbarFilters {
  status: string | null;
  type: string | null;
  onStatusChange: (status: string | null) => void;
  onTypeChange: (type: string | null) => void;
}

export interface MyCasesToolbarProps {
  onSearch: (query: string) => void;
  filters: ToolbarFilters;
}

export function MyCasesToolbar({
  onSearch,
  filters: { status: selectedStatus, type: selectedType, onStatusChange: onStatusFilter, onTypeChange: onTypeFilter },
}: MyCasesToolbarProps): React.ReactElement {
}: MyCasesToolbarProps): React.ReactElement {
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

          <FilterDropdown
            label={t('statusLabel')}
            options={statusOptions}
            selectedValue={selectedStatus}
            onSelect={handleStatusSelect}
          />

          <FilterDropdown
            label={t('typeLabel')}
            options={typeOptions}
            selectedValue={selectedType}
            onSelect={handleTypeSelect}
          />
        </div>

        <div className="toolbar-right">
          <button className="tool-btn">
            {t('export')}
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
