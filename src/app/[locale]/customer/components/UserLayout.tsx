'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
}: UserLayoutProps): JSX.Element {
  const pathname = usePathname();

  const navItems = [
    { href: `/${workspaceSlug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, active: pathname.includes('/dashboard') },
    { href: `/${workspaceSlug}/cases`, label: 'Hồ sơ của tôi', icon: FileText, active: pathname.includes('/cases') },
    { href: `/${workspaceSlug}/documents`, label: 'Tài liệu', icon: Folder, active: pathname.includes('/documents') },
    { href: `/${workspaceSlug}/messages`, label: 'Tin nhắn', icon: MessageSquare, active: pathname.includes('/messages') },
    { href: `/${workspaceSlug}/workspace`, label: 'Workspace', icon: Users, active: pathname.includes('/workspace') },
    { href: `/${workspaceSlug}/settings`, label: 'Cài đặt', icon: Settings, active: pathname.includes('/settings') },
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
              <strong>Need help?</strong>
              <span>View documentation</span>
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
            <strong>Customer Portal</strong>
            <span>{workspaceName} · {workspaceSlug}</span>
          </div>

          <div className="top-actions">
            {/* Search */}
            <div className="search-top">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>

            {/* Language pills */}
            <div className="top-pill">
              <span>EN</span>
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
