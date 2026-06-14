'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { signOut } from '@/lib/auth-client';
import LanguageSwitcher from './LanguageSwitcher';

interface AdminLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  userInitial?: string;
  locale?: string;
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

function Sidebar({ userName, userRole, userInitial = 'A' }: { userName?: string; userRole?: string; userInitial?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('AdminNav');
  const tCommon = useTranslations('Common');

  const navItems: NavItem[] = [
    {
      key: 'users',
      label: t('users'),
      href: '/vi/admin/users',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      key: 'workspace',
      label: t('workspaces'),
      href: '/vi/admin/workspace',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      key: 'requests',
      label: t('requests'),
      href: '/vi/admin/requests',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M9 13h6"/>
          <path d="M9 17h6"/>
          <path d="M9 9h1"/>
        </svg>
      ),
    },
    {
      key: 'ops',
      label: t('ops'),
      href: '/vi/admin/operations',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
          <path d="M4.9 4.9l2.8 2.8"/>
          <path d="M19.1 4.9l-2.8 2.8"/>
        </svg>
      ),
    },
    {
      key: 'audit',
      label: t('audit'),
      href: '/vi/admin/audit',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      ),
    },
    {
      key: 'vault',
      label: t('vault'),
      href: '/vi/admin/vault',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18v13H3z"/>
          <path d="M3 7l3-4h12l3 4"/>
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

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
      // Fallback: redirect anyway
      router.push('/vi/sign-in');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Brand */}
        <div className="brand">
          <div className="brand-mark"></div>
          <div className="brand-text">GitNexus Legal</div>
        </div>

        {/* Navigation */}
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {/* Help Card */}
        <div className="help-card">
          <div className="help-icon">?</div>
          <div className="help-text">
            <strong>Need help?</strong>
            <span>View docs & guides →</span>
          </div>
        </div>

        {/* User Profile with Dropdown */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
          <div className="profile">
            <div className="avatar">{userInitial}</div>
            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </Dropdown>
      </div>
    </aside>
  );
}

function Topbar() {
  const t = useTranslations('Common');

  return (
    <header className="topbar">
      {/* Left: Placeholder for breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#152238' }}>Admin Dashboard</h1>
        </div>
      </div>

      {/* Right: Search, Language, Bell, Avatar */}
      <div className="top-actions">
        {/* Search */}
        <div className="search-top">
          <input
            type="text"
            placeholder={t('search')}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Avatar */}
        <div className="circle">A</div>
      </div>
    </header>
  );
}

export function AdminLayout({ children, userName, userRole, userInitial }: AdminLayoutProps) {
  return (
    <div className="app">
      <Sidebar userName={userName} userRole={userRole} userInitial={userInitial} />
      <main className="main">
        <Topbar />
        <section className="content">
          {children}
        </section>
      </main>
    </div>
  );
}
