'use client';

interface AdminStatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'red';
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const iconVariantClass = {
  blue: 'blue',
  green: 'green',
  orange: 'orange',
  red: 'red',
};

export default function AdminStatCard({
  variant,
  title,
  value,
  description,
  icon,
}: AdminStatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconVariantClass[variant]}`}>
        {icon}
      </div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}
