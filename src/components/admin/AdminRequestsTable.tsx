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
  assignee: string;
  assigneeRole: string;
  sla: 'red' | 'orange' | 'green' | 'blue';
  slaText: string;
  action: string;
}

interface AdminRequestsTableProps {
  rows?: RequestRow[];
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

export default function AdminRequestsTable({ rows = [] }: AdminRequestsTableProps) {
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
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--soft-shadow)' }}
    >
      <div
        className="grid border-b"
        style={{
          gridTemplateColumns: '1.05fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderColor: 'var(--border)',
        }}
      >
        {['Mã hồ sơ', 'Workspace', 'Khách hàng', 'Trạng thái', 'Người phụ trách', 'SLA', 'Thao tác'].map(
          (header, i) => (
            <div
              key={i}
              className="flex items-center px-4 text-[#59687e] text-sm font-bold border-r last:border-0 min-h-[54px]"
              style={{ borderColor: 'var(--border)' }}
            >
              {header}
            </div>
          )
        )}
      </div>

      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid min-h-[72px] border-b last:border-0 bg-white transition-colors cursor-pointer hover:bg-slate-50/50"
          style={{
            gridTemplateColumns: '1.05fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 text-lg" style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' }}>
                📄
              </div>
              <div>
                <strong className="block text-sm text-[#0f172a] mb-1">{row.id}</strong>
                <span className="block text-[12px] text-[#64748b]">{row.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.workspace}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.workspaceSlug}</span>
            </div>
          </div>

          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.customer}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.customerEmail}</span>
            </div>
          </div>

          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <Badge variant={row.status} text={row.statusText} />
          </div>

          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.assignee}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.assigneeRole}</span>
            </div>
          </div>

          <div className="flex items-center px-4 border-r" style={{ borderColor: 'var(--border)' }}>
            <Badge variant={row.sla} text={row.slaText} />
          </div>

          <div className="flex items-center px-4">
            <button type="button" className="text-teal-600 font-extrabold bg-transparent border-0 inline-flex items-center gap-1.5 whitespace-nowrap text-sm cursor-pointer">
              {row.action} →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}