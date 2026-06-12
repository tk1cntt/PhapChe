'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Breadcrumb, Typography } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';
import { getBreadcrumbItems } from '@/lib/navigation/breadcrumb-labels';

const { Sider, Content, Header } = Layout;

const navItems = [
  { key: '/reviewer/requests', icon: <OrderedListOutlined />, label: <Link href="/reviewer/requests">Hàng chờ duyet</Link> },
];

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);
  // Match any /reviewer/requests prefix for selected key (detail pages)
  const selectedKey = pathname.startsWith('/reviewer/requests') ? '/reviewer/requests' : pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={64}
        theme="light"
        width={200}
        style={{ borderRight: '1px solid #E2E8F0' }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography.Text strong style={{ color: '#0F766E', fontSize: 14 }}>
            GitNexus Legal
          </Typography.Text>
          <Typography.Paragraph style={{ fontSize: 12, color: '#475569', margin: 0 }}>
            Người duyệt
          </Typography.Paragraph>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
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
            height: 48,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
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
