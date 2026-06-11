'use client';

export interface AuditEntry {
  title: string;
  description: string;
  time: string;
}

interface AuditTimelineProps {
  entries?: AuditEntry[];
}

const defaultEntries: AuditEntry[] = [
  {
    title: 'Alex Nguyen cập nhật role',
    description: 'User MP-1042 được chuyển sang specialist trong workspace An Phát.',
    time: '8 phút trước',
  },
  {
    title: 'Export audit log',
    description: 'Super Admin xuất báo cáo audit 7 ngày, 428 dòng.',
    time: '35 phút trước',
  },
  {
    title: 'Access denied',
    description: 'Reviewer bị chặn khi truy cập vault ngoài workspace scope.',
    time: '1 giờ trước',
  },
];

export default function AuditTimeline({ entries = defaultEntries }: AuditTimelineProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 15,
        boxShadow: 'var(--soft-shadow)',
        padding: 24,
      }}
    >
      {/* Panel Title */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#087f78"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        Timeline audit gần đây
      </div>

      {/* Timeline */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gap: 18,
        }}
      >
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 13,
            top: 8,
            bottom: 8,
            width: 2,
            background: '#e2e8f0',
          }}
        />

        {entries.map((entry, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              paddingLeft: 38,
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#087f78',
                border: '4px solid #d9f8f4',
                zIndex: 2,
              }}
            />

            {/* Content */}
            <strong
              style={{
                display: 'block',
                fontSize: 14,
                marginBottom: 5,
                color: '#0f172a',
              }}
            >
              {entry.title}
            </strong>
            <p
              style={{
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {entry.description}
            </p>
            <div
              style={{
                fontSize: 12,
                color: '#94a3b8',
                marginTop: 5,
                fontWeight: 600,
              }}
            >
              {entry.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
