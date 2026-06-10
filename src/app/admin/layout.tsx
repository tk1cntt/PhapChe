'use client';

import AdminLayoutShell from '@/app/components/AdminLayout';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({ children, breadcrumbs = [] }: AdminLayoutProps) {
  return (
    <AdminLayoutShell
      breadcrumbs={breadcrumbs}
      title="Dashboard"
      subtitle="GitNexus Legal Admin Panel"
      userName="Alex Nguyen"
      userRole="Super Admin"
      userInitial="A"
    >
      {children}
    </AdminLayoutShell>
  );
}
