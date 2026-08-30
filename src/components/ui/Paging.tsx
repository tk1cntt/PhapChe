'use client';

import { useTranslations } from 'next-intl';
import './paging.css';

interface PagingProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  totalLabel?: string;
}

function generatePageNumbers(current: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
  if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', current - 1, current, current + 1, '...', totalPages];
}

export default function Paging({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 25, 50],
  totalLabel,
}: PagingProps) {
  const t = useTranslations('Common');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirst = current <= 1;
  const isLast = current >= totalPages;

  return (
    <div data-testid="common-paging" className="paging-bar">
      <div className="paging-info">
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          aria-label="Page size"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span className="paging-total">
          {totalLabel ?? t('totalItems', { count: total })}
        </span>
      </div>

      <div className="paging-controls">
        <button
          onClick={() => onChange(Math.max(1, current - 1), pageSize)}
          disabled={isFirst}
          className={`paging-btn${isFirst ? ' disabled' : ''}`}
          aria-label={t('previousPage')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        {generatePageNumbers(current, totalPages).map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="paging-ellipsis">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page, pageSize)}
              className={`paging-btn${page === current ? ' active' : ''}`}
              aria-current={page === current ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onChange(Math.min(totalPages, current + 1), pageSize)}
          disabled={isLast}
          className={`paging-btn${isLast ? ' disabled' : ''}`}
          aria-label={t('nextPage')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
