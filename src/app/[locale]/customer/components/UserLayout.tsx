'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  Folder,
  MessageSquare,
  Users,
  Settings,
  Search,
  HelpCircle,
  ChevronDown,
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

export default function UserLayout({
  children,
  userName,
  userRole,
  workspaceName,
  workspaceSlug,
}: UserLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const tDashboard = useTranslations('UserDashboard');
  const tCommon = useTranslations('Common');

  // Extract locale from pathname (e.g., /vi/customer/cases -> vi)
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'vi';

  const navItems = [
    { href: `/${locale}/customer`, label: t('dashboard'), icon: LayoutDashboard, active: pathname === `/${locale}/customer` || pathname === `/${locale}/customer/` },
    { href: `/${locale}/customer/create`, label: t('intake'), icon: FileText, active: pathname.includes('/customer/create') },
    { href: `/${locale}/customer/cases`, label: t('myCases'), icon: FileText, active: pathname.includes('/customer/cases') },
    { href: `/${locale}/customer/messages`, label: t('messages'), icon: MessageSquare, active: pathname.includes('/customer/messages') },
    { href: `/${locale}/customer/workspace`, label: t('workspace'), icon: Users, active: pathname.includes('/customer/workspace') },
    { href: `/${locale}/customer/settings`, label: t('settings'), icon: Settings, active: pathname.includes('/customer/settings') },
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-mark" />
          <span className="brand-text">GitNexus Legal</span>
        </div>

        {/* Navigation */}
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

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {/* Help card */}
          <div className="help-card">
            <div className="help-icon">
              <HelpCircle size={18} />
            </div>
            <div className="help-text">
              <strong>{tDashboard('needHelp')}</strong>
              <span>{tDashboard('viewGuide')}</span>
            </div>
          </div>

          {/* Profile */}
          <div className="profile">
            <div className="avatar">{getInitials(userName)}</div>
            <div className="profile-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="dashboard-title">
            <strong>{tDashboard('portalTitle')}</strong>
            <span>{workspaceName} · {workspaceSlug}</span>
          </div>

          <div className="top-actions">
            {/* Search */}
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
              EN
            </div>

            {/* Notifications */}
            <div className="icon-btn" style={{ width: 45, border: 'none', background: 'transparent' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>

            {/* User avatar */}
            <div className="circle">{getInitials(userName)}</div>
          </div>
        </header>

        {/* Content area */}
        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}
