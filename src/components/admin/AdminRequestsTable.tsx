'use client';

import { useTranslations } from 'next-intl';

export interface RequestRow {
  id: string;
  fullId?: string;
  type: string;
  workspace: string;
  workspaceSlug: string;
  customer: string;
  customerEmail: string;
  status: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'slate' | 'teal';
  statusText: string;
  requestType?: string;
  assignee: string;
  assigneeRole: string;
  sla?: 'red' | 'orange' | 'green' | 'blue';
  slaText?: string;
  action: string;
}

interface AdminRequestsTableProps {
  rows?: RequestRow[];
  translations?: {
    code: string;
    workspace: string;
    customer: string;
    status: string;
    requestType: string;
    assignee: string;
    action: string;
    dispatch?: string;
    view?: string;
    audit?: string;
    emptyTitle?: string;
    emptyDesc?: string;
  };
}

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  blue: { bg: '#dbeafe', color: 'var(--color-info)', dot: '#2563eb' },
  orange: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  green: { bg: '#ccfbf1', color: 'var(--color-primary)', dot: '#10b981' },
  red: { bg: '#ffe4e6', color: 'var(--color-danger)', dot: '#ef4444' },
  purple: { bg: '#ede9fe', color: '#7c3aed', dot: '#7c3aed' },
  slate: { bg: '#f1f5f9', color: 'var(--color-text-muted)', dot: '#64748b' },
  teal: { bg: '#ccfbf1', color: 'var(--color-primary)', dot: '#14b8a6' },
};

function Badge({ variant, text }: { variant: string; text: string }) {
  const style = badgeStyles[variant] || badgeStyles.blue;
  return (
    <span
      className="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          marginRight: 7,
          background: style.dot,
        }}
      />
      {text}
    </span>
  );
}

export default function AdminRequestsTable({ rows = [], translations }: AdminRequestsTableProps) {
  const t = useTranslations('AdminRequests');
  const defaults = {
    code: t('code'),
    workspace: t('workspace'),
    customer: t('customer'),
    status: t('status'),
    requestType: t('requestType'),
    assignee: t('assignee'),
    action: t('action'),
    dispatch: t('dispatch') || 'Dispatch',
    view: t('view') || 'View',
    audit: t('audit') || 'Audit',
    emptyTitle: t('emptyTitle') || 'No requests',
    emptyDesc: t('emptyDesc') || 'Request list is empty.',
  };
  const trans = translations || defaults;
  // IN-01: Empty state when no data
  if (!rows || rows.length === 0) {
function EmptyRequestsState({ title, description }: { title: string; description: string }) {
  return (
    <div
      data-testid="admin-requests-table"
      className="table-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 15,
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}
    >
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
  );
}
  return (
    <div
      data-testid="admin-requests-table"
      className="bg-white border rounded-[15px] overflow-hidden"
      style={{ borderColor: 'var(--color-border)', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}
    >
      <div
        data-testid="admin-requests-table-head"
        className="table-head"
        style={{
          display: 'grid',
const COLUMN_GRID = '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr';

// In header:
          gridTemplateColumns: COLUMN_GRID,
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid var(--color-border)',
          gridTemplateColumns: COLUMN_GRID,
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid var(--color-border)',
          (header, i) => (
            <div
              key={i}
              className="th"
              style={{
                minHeight: 54,
                display: 'flex',
                alignItems: 'center',
                padding: '0 18px',
                color: 'var(--color-text-secondary)',
                fontSize: 14,
                fontWeight: 700,
              borderRight: i === columnHeaders.length - 1 ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {header}
            </div>
          )
        )}
      </div>

      {rows.map((row, rowIndex) => (
        <div
          key={row.id}
          data-testid={`admin-requests-row-${rowIndex}`}
          className="table-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
            minHeight: 68,
            borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            transition: '0.2s',
          }}
          // Define a row class and use CSS :hover, or manage via React state:
          // .table-row:hover { background: #fbfdff; }
        >
const tdBaseStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0 18px',
  fontSize: 14, color: 'var(--color-text)', fontWeight: 500,
  borderRight: '1px solid var(--color-border)', minWidth: 0,
};

// Usage:
<div className="td" style={{ ...tdBaseStyle, /* overrides */ }}>
  fontSize: 14, color: 'var(--color-text)', fontWeight: 500,
  borderRight: '1px solid var(--color-border)', minWidth: 0,
};

// Usage:
<div className="td" style={{ ...tdBaseStyle, /* overrides */ }}>
              </div>
              <strong className="text-sm font-bold text-[#0f172a]">{row.id}</strong>
            </div>
          </div>

          {/* Workspace */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: '1px solid var(--color-border)', minWidth: 0 }}>
            <div className="workspace" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ fontSize: 14, color: 'var(--color-text)' }}>{row.workspace}</strong>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{row.workspaceSlug}</span>
            </div>
          </div>

          {/* Khách hàng */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: '1px solid var(--color-border)', minWidth: 0 }}>
            <div className="customer" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="mini-avatar" style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13, background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                {(row.customer || '—').trim().split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '—'}
              </div>
              <div className="customer-info">
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{row.customer}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{row.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: '1px solid var(--color-border)' }}>
            <Badge variant={row.status} text={row.statusText} />
          </div>

          {/* Loại yêu cầu */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: '1px solid var(--color-border)', minWidth: 0 }}>
            <span>{row.requestType || row.type}</span>
          </div>

          {/* Phụ trách */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: '1px solid var(--color-border)', minWidth: 0 }}>
            <span>{row.assignee || '—'}</span>
          </div>

          {/* Thao tác */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: 'var(--color-text)', fontWeight: 500, borderRight: 'none' }}>
            <a href="#" className="action-link" style={{ color: 'var(--color-primary)', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              {row.action} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
