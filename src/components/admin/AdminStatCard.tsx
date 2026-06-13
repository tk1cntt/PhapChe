'use client';

interface AdminStatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'red';
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const variantStyles = {
  blue: {
    iconColor: '#2563eb',
    background: 'linear-gradient(135deg, #dfe8ff, #eef4ff)',
  },
  green: {
    iconColor: '#0f766e',
    background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
  },
  orange: {
    iconColor: '#f97316',
    background: 'linear-gradient(135deg, #ffe2bf, #fff1df)',
  },
  red: {
    iconColor: '#ef4444',
    background: 'linear-gradient(135deg, #ffe4e6, #fff1f2)',
  },
};

export default function AdminStatCard({
  variant,
  title,
  value,
  description,
  icon,
}: AdminStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className="h-[126px] bg-white border border-gray-200 rounded-[15px] shadow-md flex items-center p-6"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--soft-shadow)' }}
    >
      <div
        className="w-[62px] h-[62px] rounded-[13px] flex items-center justify-center mr-[18px]"
        style={{
          color: styles.iconColor,
          background: styles.background,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-[#566579] mb-2">{title}</div>
        <div className="text-[30px] font-extrabold leading-none mb-[10px] text-[#0f172a]">
          {value}
        </div>
        <div className="text-[13px] font-medium text-[#64748b]">{description}</div>
      </div>
    </div>
  );
}
