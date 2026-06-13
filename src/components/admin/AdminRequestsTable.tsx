'use client';

export interface RequestRow {
  id: string;
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

const defaultRows: RequestRow[] = [
  {
    id: 'REQ-2026-042',
    type: 'Contract Review',
    workspace: 'Công ty An Phát',
    workspaceSlug: 'an-phat',
    customer: 'Mai Phương',
    customerEmail: 'mai.phuong@anphat.vn',
    status: 'orange',
    statusText: 'Chờ xử lý',
    assignee: 'Hà Linh',
    assigneeRole: 'Specialist',
    sla: 'red',
    slaText: 'Còn 4h',
    action: 'Điều phối',
  },
  {
    id: 'REQ-2026-041',
    type: 'NDA Advisory',
    workspace: 'Công ty Minh Khang',
    workspaceSlug: 'minh-khang',
    customer: 'Trần Nam',
    customerEmail: 'nam.tran@minhkhang.vn',
    status: 'blue',
    statusText: 'Đang review',
    assignee: 'Quang Dũng',
    assigneeRole: 'Reviewer',
    sla: 'orange',
    slaText: 'Còn 12h',
    action: 'Xem',
  },
  {
    id: 'REQ-2026-040',
    type: 'Compliance Check',
    workspace: 'Workspace nội bộ',
    workspaceSlug: 'internal',
    customer: 'Hoàng Nam',
    customerEmail: 'nam.hoang@gitnexus.vn',
    status: 'green',
    statusText: 'Đã duyệt',
    assignee: 'Minh Trang',
    assigneeRole: 'Coordinator',
    sla: 'green',
    slaText: 'Đúng hạn',
    action: 'Audit',
  },
  {
    id: 'REQ-2026-039',
    type: 'Access Request',
    workspace: 'Công ty An Phát',
    workspaceSlug: 'an-phat',
    customer: 'Linh Anh',
    customerEmail: 'linh.anh@anphat.vn',
    status: 'red',
    statusText: 'Bị từ chối',
    assignee: 'Khánh An',
    assigneeRole: 'Audit Admin',
    sla: 'blue',
    slaText: 'Closed',
    action: 'Xem log',
  },
  {
    id: 'REQ-2026-038',
    type: 'Legal Amendment',
    workspace: 'Công ty Minh Khang',
    workspaceSlug: 'minh-khang',
    customer: 'Quang Dũng',
    customerEmail: 'dung.quang@minhkhang.vn',
    status: 'purple',
    statusText: 'Đang phân tích',
    assignee: 'Hà Linh',
    assigneeRole: 'Specialist',
    sla: 'orange',
    slaText: 'Còn 20h',
    action: 'Điều phối',
  },
];

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

export default function AdminRequestsTable({ rows = defaultRows }: AdminRequestsTableProps) {
  return (
    <div
      className="bg-white border rounded-[15px] overflow-hidden"
      style={{
        borderColor: 'var(--border)',
        boxShadow: 'var(--soft-shadow)',
      }}
    >
      {/* Table Header */}
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

      {/* Table Rows */}
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid min-h-[72px] border-b last:border-0 bg-white transition-colors cursor-pointer hover:bg-slate-50/50"
          style={{
            gridTemplateColumns: '1.05fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr',
            borderColor: 'var(--border)',
          }}
        >
          {/* Column 1: Mã hồ sơ */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 text-lg"
                style={{
                  background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                  color: '#2563eb',
                }}
              >
                📄
              </div>
              <div>
                <strong className="block text-sm text-[#0f172a] mb-1">{row.id}</strong>
                <span className="block text-[12px] text-[#64748b]">{row.type}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Workspace */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.workspace}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.workspaceSlug}</span>
            </div>
          </div>

          {/* Column 3: Khách hàng */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.customer}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.customerEmail}</span>
            </div>
          </div>

          {/* Column 4: Trạng thái */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <Badge variant={row.status} text={row.statusText} />
          </div>

          {/* Column 5: Người phụ trách */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <strong className="block text-sm text-[#0f172a] mb-1">{row.assignee}</strong>
              <span className="block text-[12px] text-[#64748b]">{row.assigneeRole}</span>
            </div>
          </div>

          {/* Column 6: SLA */}
          <div
            className="flex items-center px-4 border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <Badge variant={row.sla} text={row.slaText} />
          </div>

          {/* Column 7: Thao tác */}
          <div className="flex items-center px-4">
            <a
              href="#"
              className="text-teal-600 font-extrabold no-underline inline-flex items-center gap-1.5 whitespace-nowrap text-sm"
            >
              {row.action} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
