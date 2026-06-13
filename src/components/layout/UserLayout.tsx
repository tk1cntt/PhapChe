'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Search,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export interface UserLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  workspaceName: string;
  workspaceSlug: string;
}

function getInitials(name: string): string {
  if (!name || name.length === 0) return 'U';
  return name.substring(0, 2).toUpperCase();
}

export function UserLayout({
  children,
  userName,
  userRole,
  workspaceName,
  workspaceSlug,
}: UserLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Nav');
  const tDashboard = useTranslations('UserDashboard');
  const tCommon = useTranslations('Common');

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'vi';

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/vi/sign-in');
            router.refresh();
          },
        },
      });
    } catch (e) {
      console.error('Logout error:', e);
      router.push('/vi/sign-in');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogOut size={16} />,
      onClick: handleLogout,
    },
  ];

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard, active: pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/` },
    { href: `/${locale}/create`, label: t('intake'), icon: FileText, active: pathname.includes('/create') },
    { href: `/${locale}/cases`, label: t('myCases'), icon: FileText, active: pathname.includes('/cases') },
    { href: `/${locale}/messages`, label: t('messages'), icon: MessageSquare, active: pathname.includes('/messages') },
    { href: `/${locale}/workspace`, label: t('workspace'), icon: Users, active: pathname.includes('/workspace') },
    { href: `/${locale}/settings`, label: t('settings'), icon: Settings, active: pathname.includes('/settings') },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <span className="brand-text">GitNexus Legal</span>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <HelpCircle size={18} />
            </div>
            <div className="help-text">
              <strong>{tDashboard('needHelp')}</strong>
              <span>{tDashboard('viewGuide')}</span>
            </div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
            <div className="profile">
              <div className="avatar">{getInitials(userName)}</div>
              <div className="profile-info">
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="dashboard-title">
            <strong>{tDashboard('portalTitle')}</strong>
            <span>{workspaceName} · {workspaceSlug}</span>
          </div>

          <div className="top-actions">
            <div className="search-top">
              <Search size={18} />
              <input type="text" placeholder={tCommon('search')} />
            </div>

            {/* Language */}
          <div className="lang">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            vi Tiếng Việt
          </div>

            <div className="circle">{getInitials(userName)}</div>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default UserLayout;
