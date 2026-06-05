import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Breadcrumb, Typography } from 'antd';
import {
  UserOutlined, TeamOutlined, FileTextOutlined,
  DashboardOutlined, SafetyOutlined, FolderOutlined,
} from '@ant-design/icons';
import { getBreadcrumbItems } from '@/lib/navigation/breadcrumb-labels';

const { Sider, Content, Header } = Layout;

const navItems = [
  { key: '/admin/users', icon: <UserOutlined />, label: <Link href="/admin/users">Nguoi dung</Link> },
  { key: '/admin/workspaces', icon: <TeamOutlined />, label: <Link href="/admin/workspaces">Workspace</Link> },
  { key: '/admin/requests', icon: <FileTextOutlined />, label: <Link href="/admin/requests">Ho so yeu cau</Link> },
  { key: '/admin/ops', icon: <DashboardOutlined />, label: <Link href="/admin/ops">Van hanh</Link> },
  { key: '/admin/audit', icon: <SafetyOutlined />, label: <Link href="/admin/audit">Audit</Link> },
  { key: '/admin/vault', icon: <FolderOutlined />, label: <Link href="/admin/vault">Phan loai vault</Link> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);

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
