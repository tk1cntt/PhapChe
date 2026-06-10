'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Typography, Input, Avatar, Badge, Space, Button } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

const { Sider, Content, Header } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('AdminNav');

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

  // Navigation items from template.png
  const navItems = [
    { key: '/vi/admin', icon: <HomeOutlined />, label: <Link href="/vi/admin">Trang chủ</Link> },
    { key: '/vi/admin/templates', icon: <FileTextOutlined />, label: <Link href="/vi/admin/templates">Biểu mẫu</Link> },
    { key: '/vi/admin/requests', icon: <EyeOutlined />, label: <Link href="/vi/admin/requests">Theo dõi</Link> },
    { key: '/vi/admin/vault', icon: <SearchOutlined />, label: <Link href="/vi/admin/vault">Tra cứu</Link> },
    { key: '/vi/admin/users', icon: <UserOutlined />, label: <Link href="/vi/admin/users">Tài khoản</Link> },
  ];

  // Handle logout
  const handleLogout = () => {
    router.push('/sign-out');
  };

  // Determine selected key based on current path
  const selectedKey = navItems.find(item =>
    pathname === item.key || pathname.startsWith(item.key + '/')
  )?.key || '/vi/admin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR - Gray background from template */}
      <Sider
        breakpoint="lg"
        collapsedWidth={64}
        width={220}
        style={{
          background: '#E8E8E8', // Gray sidebar from template
          borderRight: 'none',
          position: 'relative',
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #D0D0D0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <EnvironmentOutlined style={{ fontSize: '24px', color: '#27AE60' }} />
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#27AE60',
            letterSpacing: '0.5px',
          }}>
            PHÁP CHỂ
          </span>
        </div>

        {/* Navigation - Gray icons, black text from template */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems}
          style={{
            background: 'transparent', // Transparent to show gray bg
            borderRight: 'none',
            marginTop: '8px',
          }}
        />

        {/* Logout at bottom - from template */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: 0,
          right: 0,
          padding: '0 16px',
        }}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              color: '#333',
              fontSize: '14px',
              height: '40px',
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        {/* Header from template - "Quản lý hồ sơ" + bell + avatar */}
        <Header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E0E0E0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0, color: '#0F172A' }}>
            Quản lý hồ sơ
          </Typography.Title>

          <Space size="middle">
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer', color: '#475569' }} />
            </Badge>
            <Avatar style={{ background: '#27AE60', cursor: 'pointer' }}>NV</Avatar>
          </Space>
        </Header>

        {/* Content from template - #F5F5F5 background */}
        <Content
          style={{
            padding: 24,
            background: '#F5F5F5', // Light gray content bg from template
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
