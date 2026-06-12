'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  userName?: string;
  userRole?: string;
  userInitial?: string;
  onSearch?: (value: string) => void;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  userName = 'Alex Nguyen',
  userRole = 'Super Admin',
  userInitial = 'A',
  onSearch
}: AdminLayoutProps) {
  return (
    <div className="app">
      <Sidebar userName={userName} userRole={userRole} userInitial={userInitial} />
      <main className="main">
        <Topbar
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          userInitial={userInitial}
          onSearch={onSearch}
        />
        <section className="content">
          {children}
        </section>
      </main>
    </div>
  );
}
