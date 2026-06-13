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
      className="bg-white border rounded-[15px] p-6"
      style={{
        borderColor: 'var(--border)',
        boxShadow: 'var(--soft-shadow)',
      }}
    >
      {/* Panel Title */}
      <div className="flex items-center gap-3 text-xl font-bold text-[#0f172a] mb-[18px]">
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
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-gray-200"
          style={{ background: '#e2e8f0' }}
        />

        {entries.map((entry, index) => (
          <div
            key={index}
            className="relative pl-10 pb-5 last:pb-0"
          >
            {/* Timeline dot */}
            <div
              className="absolute left-[5px] top-1 w-[18px] h-[18px] rounded-full border-4 z-10"
              style={{
                background: '#087f78',
                borderColor: '#d9f8f4',
              }}
            />

            {/* Content */}
            <strong className="block text-sm font-semibold mb-1 text-[#0f172a]">
              {entry.title}
            </strong>
            <p className="text-[13px] text-[#64748b] leading-relaxed m-0">
              {entry.description}
            </p>
            <div className="text-[12px] text-[#94a3b8] mt-1 font-semibold">
              {entry.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
