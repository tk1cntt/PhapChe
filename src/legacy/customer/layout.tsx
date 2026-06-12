'use client';

import { usePathname } from 'next/navigation';
import { Layout, Breadcrumb, Typography } from 'antd';
import { getBreadcrumbItems } from '@/lib/navigation/breadcrumb-labels';

const { Content, Header } = Layout;

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
        <Typography.Text style={{ color: '#0F766E', fontWeight: 600, fontSize: 13 }}>
          GitNexus Legal
        </Typography.Text>
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
  );
}
