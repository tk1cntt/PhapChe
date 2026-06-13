'use client';

export interface RequestRow {
  id: string;
  fullId?: string;
  type: string;
  workspace: string;
  workspaceSlug: string;
  customer: string;
  customerEmail: string;
  status: 'orange' | 'blue' | 'green' | 'red' | 'purple';
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

const badgeStyles: Record<string, { bg: string; color: string }> = {
  green: { bg: '#ccfbf1', color: '#0f766e' },
  orange: { bg: '#ffedd5', color: '#ea580c' },
  blue: { bg: '#dbeafe', color: '#2563eb' },
  red: { bg: '#ffe4e6', color: '#ef4444' },
  purple: { bg: '#ede9fe', color: '#7c3aed' },
};

function Badge({ variant, text }: { variant: string; text: string }) {
  const style = badgeStyles[variant] || badgeStyles.blue;
  return (
    <span
      className="inline-flex items-center h-7 px-3 rounded-full text-[12px] font-extrabold"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: style.color }}
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
        className="bg-white border rounded-[15px] overflow-hidden"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--soft-shadow)' }}
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
      className="bg-white border rounded-[15px] overflow-hidden"
      style={{ borderColor: '#dfe7f1', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid #dfe7f1',
        }}
      >
        {[t.code, t.workspace, t.customer, t.status, t.requestType, t.assignee, t.action].map(
          (header, i) => (
            <div
              key={i}
              className="min-h-[54px] flex items-center px-[18px] text-[#59687e] text-sm font-bold border-r last:border-0"
              style={{ borderColor: '#dfe7f1' }}
            >
              {header}
            </div>
          )
        )}
      </div>

      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid cursor-pointer transition-all"
          style={{
            gridTemplateColumns: '0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr',
            minHeight: 68,
            borderBottom: '1px solid #dfe7f1',
            background: '#fff',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fbfdff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          {/* Mã hồ sơ */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1', minWidth: 0 }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <strong className="text-sm font-bold text-[#0f172a]">{row.id}</strong>
            </div>
          </div>

          {/* Workspace */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1', minWidth: 0 }}>
            <div>
              <strong className="block text-sm font-semibold text-[#0f172a] mb-1">{row.workspace}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.workspaceSlug}</span>
            </div>
          </div>

          {/* Khách hàng */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1', minWidth: 0 }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[13px]" style={{ background: '#eef2f7', color: '#334155' }}>
                {row.customer.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <strong className="block text-sm font-semibold text-[#0f172a] mb-1">{row.customer}</strong>
                <span className="block text-[12px] text-[#64748b]">{row.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1' }}>
            <Badge variant={row.status} text={row.statusText} />
          </div>

          {/* Loại yêu cầu */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1', minWidth: 0 }}>
            <span className="text-sm text-[#0f172a]">{row.requestType || row.type}</span>
          </div>

          {/* Phụ trách */}
          <div className="flex items-center px-[18px] border-r" style={{ borderColor: '#dfe7f1', minWidth: 0 }}>
            <span className="text-sm text-[#0f172a]">{row.assignee || '—'}</span>
          </div>

          {/* Thao tác */}
          <div className="flex items-center px-[18px]">
            <a href="#" className="text-[#087f78] font-extrabold no-underline inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
              {row.action} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}