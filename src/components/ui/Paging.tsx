'use client';

import { useTranslations } from 'next-intl';

interface PagingProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  totalLabel?: string;
}

const PAGE_ELLIPSIS = '...';

function generatePageNumbers(current: number, totalPages: number): (number | typeof PAGE_ELLIPSIS)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, PAGE_ELLIPSIS, totalPages];
  if (current >= totalPages - 3) return [1, PAGE_ELLIPSIS, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, PAGE_ELLIPSIS, current - 1, current, current + 1, PAGE_ELLIPSIS, totalPages];
}
  return [1, PAGE_ELLIPSIS, current - 1, current, current + 1, PAGE_ELLIPSIS, totalPages];
}
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
    <div
      data-testid="common-paging"
      style={{
        padding: '12px 16px',
        background: 'var(--color-bg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          style={{
        height: CONTROL_HEIGHT,
        border: '1px solid var(--color-border)',
        borderRadius: RADIUS,
        padding: '0 8px',
        fontSize: FONT_SIZE_SM,
            background: 'var(--color-surface)',
            cursor: 'pointer',
          }}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
          {totalLabel ?? t('totalItems', { count: total })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onChange(Math.max(1, current - 1), pageSize)}
          disabled={isFirst}
          style={navButtonStyle(isFirst)}
          aria-label={t('previousPage')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        {generatePageNumbers(current, totalPages).map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} style={{ minWidth: 32, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>...</span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page, pageSize)}
              style={{
                height: 32,
                minWidth: 32,
                padding: '0 8px',
                border: page === current ? 'none' : '1px solid var(--color-border)',
                borderRadius: 6,
                background: page === current ? ACTIVE_BUTTON_BG : '#fff',
                color: page === current ? '#fff' : TEXT_PRIMARY,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: page === current ? 700 : 500,
              }}
              aria-current={page === current ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onChange(Math.min(totalPages, current + 1), pageSize)}
          disabled={isLast}
          style={{
            height: 32,
            width: 32,
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            background: isLast ? '#f1f5f9' : '#fff',
            color: isLast ? '#94a3b8' : '#1e293b',
            cursor: isLast ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
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
