'use client';

interface AdminBannerProps {
  title?: string;
  description?: string;
}

export default function AdminBanner({
  title = 'Hệ thống đang hoạt động ổn định',
  description = '42 hồ sơ đang mở, 6 hồ sơ sắp quá SLA, 3 cảnh báo audit cần rà soát và 12 workspace đang hoạt động. Các thay đổi quyền, role và workspace đều được ghi nhận trong audit log.',
}: AdminBannerProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
        border: '1px solid var(--border)',
        borderRadius: 15,
        boxShadow: 'var(--soft-shadow)',
        padding: 26,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0b8f86, #087970)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(8, 127, 120, 0.22)',
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div>
          <h2
            style={{
              fontSize: 22,
              marginBottom: 8,
              color: '#0f172a',
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: '#64748b',
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 500,
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          style={{
            height: 45,
            padding: '0 16px',
            border: '1px solid var(--border)',
            background: '#fff',
            borderRadius: 8,
            color: '#1e293b',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Xem audit
        </button>
        <button
          style={{
            height: 45,
            padding: '0 18px',
            border: 'none',
            borderRadius: 8,
            background: 'linear-gradient(180deg, #0b8f86, #087970)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
            cursor: 'pointer',
          }}
        >
          Điều phối workload
        </button>
      </div>
    </div>
  );
}
