import type { ReactNode } from 'react';

const badgeStyles = {
  neutral: 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]',
  info: 'bg-blue-50 text-[#1D4ED8] border-blue-200',
  warning: 'bg-amber-50 text-[#B45309] border-amber-200',
  accent: 'bg-teal-50 text-[#0F766E] border-teal-200',
  destructive: 'bg-red-50 text-[#B91C1C] border-red-200',
  outline: 'bg-white text-[#475569] border-[#CBD5E1]',
} as const;

const buttonStyles = {
  primary: 'bg-[#0F766E] text-white shadow-sm hover:bg-teal-800 hover:shadow',
  secondary: 'bg-white text-[#0F172A] border border-[#CBD5E1] shadow-sm hover:bg-[#F8FAFC] hover:border-[#94A3B8]',
  destructive: 'bg-[#DC2626] text-white shadow-sm hover:bg-red-700 hover:shadow',
  ghost: 'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
} as const;

type ButtonProps = {
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function Button({ children, variant = 'primary', type = 'button', disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-[14px] font-semibold leading-[1.4] transition focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeStyles }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[13px] font-semibold leading-[1.3] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${badgeStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap border-b border-[#E2E8F0] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] leading-[1.4] text-[#64748B]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="space-y-2">
        <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#0F172A]">{title}</h1>
        <p className="max-w-3xl text-[16px] font-normal leading-[1.6] text-[#475569]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
