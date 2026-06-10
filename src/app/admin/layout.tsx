'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Breadcrumb, Typography, Input } from 'antd';
import {
  UserOutlined, TeamOutlined, FileTextOutlined,
  DashboardOutlined, SafetyOutlined, FolderOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { getBreadcrumbItems } from '@/lib/navigation/breadcrumb-labels';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useState } from 'react';

const { Sider, Content, Header } = Layout;

// By-design: sidebar shows all admin links regardless of user role. Each admin page
// calls requireAppSession() + role check internally and returns 404 for unauthorized
// users (security-through-obscurity). This avoids a client-side session fetch in layout.
// To filter menu by role, refactor layout to a server component that calls requireAppSession()
// and conditionally builds navItems.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AdminNav');
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbItems = getBreadcrumbItems(pathname);

  // Global search state
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);

  // Navigate to requests page with search param when debounced search changes
  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/admin/requests?search=${encodeURIComponent(value)}&page=1`);
    } else {
      router.push('/admin/requests');
    }
  };

  const navItems = [
    { key: '/admin/users', icon: <UserOutlined />, label: <Link href="/admin/users">{t('users')}</Link> },
    { key: '/admin/workspaces', icon: <TeamOutlined />, label: <Link href="/admin/workspaces">{t('workspaces')}</Link> },
    { key: '/admin/requests', icon: <FileTextOutlined />, label: <Link href="/admin/requests">{t('requests')}</Link> },
    { key: '/admin/ops', icon: <DashboardOutlined />, label: <Link href="/admin/ops">{t('ops')}</Link> },
    { key: '/admin/audit', icon: <SafetyOutlined />, label: <Link href="/admin/audit">{t('audit')}</Link> },
    { key: '/admin/vault', icon: <FolderOutlined />, label: <Link href="/admin/vault">{t('vault')}</Link> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={64}
        theme="light"
        style={{ borderRight: '1px solid #E2E8F0' }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography.Text strong style={{ color: '#0F766E', fontSize: 16 }}>
            GitNexus Legal
          </Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={navItems}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
          <Input.Search
            placeholder="Tim kiem..."
            style={{ width: 300 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            allowClear
          />
        </Header>
        <Content
          style={{
            padding: 24,
            background: '#F8FAFC',
            minHeight: 'calc(100vh - 48px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
