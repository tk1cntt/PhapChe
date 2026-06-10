'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Typography, Avatar, Dropdown, Button, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation items - horizontal in header (from template)
  const navItems: MenuProps['items'] = [
    {
      key: '/vi/admin',
      icon: <HomeOutlined />,
      label: <Link href="/vi/admin">Trang chủ</Link>,
    },
    {
      key: '/vi/admin/templates',
      icon: <FileTextOutlined />,
      label: <Link href="/vi/admin/templates">Biểu mẫu</Link>,
    },
    {
      key: '/vi/admin/requests',
      icon: <EyeOutlined />,
      label: <Link href="/vi/admin/requests">Theo dõi</Link>,
    },
    {
      key: '/vi/admin/vault',
      icon: <SearchOutlined />,
      label: <Link href="/vi/admin/vault">Tra cứu</Link>,
    },
    {
      key: '/vi/admin/users',
      icon: <UserOutlined />,
      label: <Link href="/vi/admin/users">Tài khoản</Link>,
    },
  ];

  // User menu dropdown
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      router.push('/sign-out');
    }
  };

  // Determine selected key from pathname
  const selectedKey = navItems.find(item =>
    item && 'key' in item && (
      pathname === item.key || pathname.startsWith(String(item.key) + '/')
    )
  )?.key || '/vi/admin';

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* HEADER - Horizontal layout from template */}
      <Header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ fontSize: 24, color: '#27AE60' }} />
          <Text strong style={{ fontSize: 18, color: '#27AE60', letterSpacing: 1 }}>
            PHÁP CHỂ
          </Text>
        </div>

        {/* Center: Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[String(selectedKey)]}
          items={navItems}
          style={{
            flex: 1,
            maxWidth: 600,
            minWidth: 400,
            borderBottom: 'none',
            background: 'transparent',
          }}
        />

        {/* Right: User dropdown */}
        <Space size="middle">
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                style={{
                  background: '#27AE60',
                  cursor: 'pointer',
                }}
              >
                NV
              </Avatar>
              <Text style={{ color: '#333' }}>Nguyễn Văn</Text>
            </div>
          </Dropdown>
        </Space>
      </Header>

      {/* CONTENT */}
      <Content
        style={{
          padding: 24,
          background: '#F5F5F5',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
}
