'use client';

import { useTranslations } from 'next-intl';
import { Input, Button, Select } from 'antd';
import { Search, Filter, Download } from 'lucide-react';

interface AdminToolbarProps {
  searchPlaceholder?: string;
  filterLabel?: string;
  exportLabel?: string;
  filters?: Array<{ label: string; value: string }>;
  selectedFilter?: string;
  onSearch?: (value: string) => void;
  onFilterChange?: (value: string) => void;
  onExport?: () => void;
}

export function AdminToolbar({
  searchPlaceholder = '',
  filterLabel = '',
  exportLabel = '',
  filters = [],
  selectedFilter = '',
  onSearch,
  onFilterChange,
  onExport,
}: AdminToolbarProps) {
  const t = useTranslations('AdminCommon');

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      marginBottom: 24,
      maxWidth: 1600,
      margin: '0 auto 24px',
      padding: '0 24px',
    }}>
      <Input
        placeholder={searchPlaceholder || t('search')}
        prefix={<Search size={16} style={{ color: '#94a3b8' }} />}
        onChange={(e) => onSearch?.(e.target.value)}
        style={{ flex: 1, maxWidth: 400 }}
      />
      {filters.length > 0 && (
        <Select
          placeholder={filterLabel || t('filter')}
          value={selectedFilter || undefined}
          onChange={onFilterChange}
          allowClear
          style={{ minWidth: 150 }}
          options={filters.map(f => ({ label: f.label, value: f.value }))}
        />
      )}
      <Button icon={<Download size={16} />} onClick={onExport}>
        {exportLabel || t('export')}
      </Button>
    </div>
  );
}
