'use client';

interface AdminBannerProps {
  title?: string;
  description?: string;
  onViewAudit?: () => void;
  onDispatchWorkload?: () => void;
}

export default function AdminBanner({
  title = 'Hệ thống đang hoạt động ổn định',
  description = 'Các thay đổi quyền, role và workspace đều được ghi nhận trong audit log.',
  onViewAudit,
  onDispatchWorkload,
}: AdminBannerProps) {
  return (
    <div
      className="border rounded-[15px] p-6 mb-6 flex items-center justify-between gap-6"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--soft-shadow)',
      }}
    >
      <div className="flex items-center gap-[18px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
          style={{
            background: 'linear-gradient(135deg, #0b8f86, #087970)',
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
          <h2 className="text-[22px] mb-2 text-[#0f172a] font-bold">{title}</h2>
          <p className="text-[14px] text-[#64748b] leading-relaxed font-medium m-0">
            {description}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={onViewAudit}
          className="h-[45px] px-4 border bg-white rounded-lg text-[#1e293b] font-extrabold cursor-pointer"
          style={{ borderColor: 'var(--border)' }}
        >
          Xem audit
        </button>
        <button
          onClick={onDispatchWorkload}
          className="h-[45px] px-[18px] border-0 rounded-lg text-white flex items-center gap-[10px] font-bold cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, #0b8f86, #087970)',
            boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
          }}
        >
          Điều phối workload
        </button>
      </div>
    </div>
  );
}
