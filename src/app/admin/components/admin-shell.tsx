import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/workspaces', label: 'Workspace' },
  { href: '/admin/requests', label: 'Hồ sơ yêu cầu' },
  { href: '/admin/audit', label: 'Audit' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[14px] font-semibold leading-[1.4] text-[#0F766E]">GitNexus Legal</p>
            <p className="text-[20px] font-semibold leading-[1.2]">Admin foundation</p>
          </div>
          <nav aria-label="Điều hướng admin" className="flex flex-wrap gap-2 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-[14px] font-semibold leading-[1.4] text-[#475569] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <nav aria-label="Điều hướng admin desktop" className="sticky top-6 rounded-xl border border-[#E2E8F0] bg-white p-3">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-[14px] font-semibold leading-[1.4] text-[#475569] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 border-t border-[#E2E8F0] pt-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              Ẩn mục điều hướng chỉ là UX; server vẫn enforce permissions theo D-07.
            </p>
          </nav>
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
