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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: style.color,
          marginRight: 7,
        }}
      />
      {text}
    </span>
  );
}

export default function AdminRequestsTable({ rows = defaultRows }: AdminRequestsTableProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 15,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid var(--border)',
          minHeight: 54,
        }}
      >
        {['Mã hồ sơ', 'Workspace', 'Khách hàng', 'Trạng thái', 'Người phụ trách', 'SLA', 'Thao tác'].map(
          (header, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 18px',
                color: '#59687e',
                fontSize: 14,
                fontWeight: 700,
                borderRight: i < 6 ? '1px solid var(--border)' : 'none',
              }}
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
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr 1fr 1fr 1fr 0.9fr 0.9fr',
            minHeight: 72,
            borderBottom: '1px solid var(--border)',
            background: '#fff',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fbfdff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
          }}
        >
          {/* Column 1: Mã hồ sơ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 18,
                }}
              >
                📄
              </div>
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: '#0f172a',
                    marginBottom: 4,
                  }}
                >
                  {row.id}
                </strong>
                <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                  {row.type}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Workspace */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: '#0f172a',
                  marginBottom: 4,
                }}
              >
                {row.workspace}
              </strong>
              <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                {row.workspaceSlug}
              </span>
            </div>
          </div>

          {/* Column 3: Khách hàng */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: '#0f172a',
                  marginBottom: 4,
                }}
              >
                {row.customer}
              </strong>
              <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                {row.customerEmail}
              </span>
            </div>
          </div>

          {/* Column 4: Trạng thái */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <Badge variant={row.status} text={row.statusText} />
          </div>

          {/* Column 5: Người phụ trách */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div>
              <strong
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: '#0f172a',
                  marginBottom: 4,
                }}
              >
                {row.assignee}
              </strong>
              <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                {row.assigneeRole}
              </span>
            </div>
          </div>

          {/* Column 6: SLA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <Badge variant={row.sla} text={row.slaText} />
          </div>

          {/* Column 7: Thao tác */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
            }}
          >
            <a
              href="#"
              style={{
                color: '#087f78',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              {row.action} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
