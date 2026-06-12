'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';

export interface ToolbarProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: { status?: string }) => void;
}

export function Toolbar({ onSearch, onFilterChange }: ToolbarProps): React.ReactElement {
  const t = useTranslations('UserDashboard');

  return (
    <div className="toolbar-card">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="request-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          <button className="tool-btn">
            <SlidersHorizontal size={18} />
            {t('filter')}
          </button>
          <button className="tool-btn">
            {t('status')}
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="tool-btn square" title="Refresh">
            <RotateCcw size={18} />
          </button>
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

export default Toolbar;
