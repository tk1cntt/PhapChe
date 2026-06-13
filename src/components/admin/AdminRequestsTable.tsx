'use client';

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
  };
}

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  blue: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
  orange: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  green: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  red: { bg: '#ffe4e6', color: '#ef4444', dot: '#ef4444' },
  purple: { bg: '#ede9fe', color: '#7c3aed', dot: '#7c3aed' },
  slate: { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' },
  teal: { bg: '#ccfbf1', color: '#087f78', dot: '#14b8a6' },
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
  const t = translations || {
    code: 'Mã hồ sơ',
    workspace: 'Workspace',
    customer: 'Khách hàng',
    status: 'Trạng thái',
    requestType: 'Loại yêu cầu',
    assignee: 'Phụ trách',
    action: 'Thao tác',
  };
  // IN-01: Empty state when no data
  if (!rows || rows.length === 0) {
    return (
      <div
        data-testid="admin-requests-table"
        className="table-card"
        style={{
          background: '#fff',
          border: '1px solid #dfe7f1',
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
          <h3 className="text-lg font-medium text-slate-700 mb-1">Không có yêu cầu nào</h3>
          <p className="text-sm text-slate-500">Danh sách yêu cầu pháp lý đang trống.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="admin-requests-table"
      className="bg-white border rounded-[15px] overflow-hidden"
      style={{ borderColor: '#dfe7f1', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}
    >
      <div
        data-testid="admin-requests-table-head"
        className="table-head"
        style={{
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid #dfe7f1',
        }}
      >
        {[t.code, t.workspace, t.customer, t.status, t.requestType, t.assignee, t.action].map(
          (header, i) => (
            <div
              key={i}
              className="th"
              style={{
                minHeight: 54,
                display: 'flex',
                alignItems: 'center',
                padding: '0 18px',
                color: '#59687e',
                fontSize: 14,
                fontWeight: 700,
                borderRight: i === 6 ? 'none' : '1px solid #dfe7f1',
              }}
            >
              {header}
            </div>
          )
        )}
      </div>

      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          data-testid={`admin-requests-row-${rowIndex}`}
          className="table-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
            minHeight: 68,
            borderBottom: rowIndex === rows.length - 1 ? 'none' : '1px solid #dfe7f1',
            background: '#fff',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fbfdff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          {/* Mã hồ sơ */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
            <div className="request-code" style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, color: '#0f172a' }}>
              <div className="code-icon" style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <strong className="text-sm font-bold text-[#0f172a]">{row.id}</strong>
            </div>
          </div>

          {/* Workspace */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
            <div className="workspace" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>{row.workspace}</strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>{row.workspaceSlug}</span>
            </div>
          </div>

          {/* Khách hàng */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
            <div className="customer" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="mini-avatar" style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13, background: '#eef2f7', color: '#334155' }}>
                {row.customer.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="customer-info">
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{row.customer}</strong>
                <span style={{ fontSize: 12, color: '#64748b' }}>{row.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1' }}>
            <Badge variant={row.status} text={row.statusText} />
          </div>

          {/* Loại yêu cầu */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
            <span>{row.requestType || row.type}</span>
          </div>

          {/* Phụ trách */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
            <span>{row.assignee || '—'}</span>
          </div>

          {/* Thao tác */}
          <div className="td" style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: 'none' }}>
            <a href="#" className="action-link" style={{ color: '#087f78', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              {row.action} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}