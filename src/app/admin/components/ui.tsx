import type { ReactNode } from 'react';

const badgeStyles = {
  neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  info: 'bg-blue-50 text-[#2563EB] border-blue-100',
  warning: 'bg-amber-50 text-[#D97706] border-amber-100',
  accent: 'bg-teal-50 text-[#0F766E] border-teal-100',
  destructive: 'bg-red-50 text-[#DC2626] border-red-100',
  outline: 'bg-white text-[#475569] border-[#E2E8F0]',
} as const;

const buttonStyles = {
  primary: 'bg-[#0F766E] text-white hover:bg-teal-800',
  secondary: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F1F5F9]',
  destructive: 'bg-[#DC2626] text-white hover:bg-red-700',
  ghost: 'bg-transparent text-[#475569] hover:bg-[#F1F5F9]',
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
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-[14px] font-semibold leading-[1.4] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeStyles }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[14px] font-semibold leading-[1.4] ${badgeStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-6 ${className}`}>{children}</section>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[#F1F5F9]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 text-[14px] font-semibold leading-[1.4] text-[#475569]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">{children}</tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-[#0F172A]">{title}</h1>
        <p className="max-w-3xl text-[16px] font-normal leading-[1.5] text-[#475569]">{description}</p>
      </div>
      {action}
    </div>
  );
}
