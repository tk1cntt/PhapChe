import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/workspaces', label: 'Workspace' },
  { href: '/admin/requests', label: 'Hồ sơ yêu cầu' },
  { href: '/admin/ops', label: 'Vận hành' },
  { href: '/admin/audit', label: 'Audit' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-[#0F172A]">
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0]/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#0F766E]">GitNexus Legal</p>
            <p className="text-[22px] font-semibold leading-[1.2] tracking-[-0.01em]">Admin foundation</p>
          </div>
          <nav aria-label="Điều hướng admin" className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full border border-transparent px-3 py-2 text-[14px] font-semibold leading-[1.4] text-[#475569] transition hover:border-[#D7DEE8] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <aside className="hidden lg:block">
          <nav aria-label="Điều hướng admin desktop" className="sticky top-24 rounded-2xl border border-[#E2E8F0] bg-white/95 p-3 shadow-sm">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-[14px] font-semibold leading-[1.4] text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 border-t border-[#E2E8F0] pt-3 text-[13px] font-normal leading-[1.5] text-[#64748B]">
              Ẩn mục điều hướng chỉ là UX; server vẫn enforce permissions theo D-07.
            </p>
          </nav>
        </aside>
        <main className="min-w-0 space-y-6 lg:space-y-8">{children}</main>
      </div>
    </div>
  );
}
