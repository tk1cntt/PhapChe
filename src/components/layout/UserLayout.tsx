'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/shared/ui/DropdownMenu';
import type { DropdownItem } from '@/components/shared/ui/DropdownMenu';
import { signOut } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/shared/ui/ThemeToggle';
import '@/styles/layout.css';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Search,
  LogOut,
  X,
  Home,
  PlusCircle,
  Bell,
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
  const tCommon = useTranslations('Common');

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'vi';

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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

  const userMenuItems: DropdownItem[] = [
    {
      key: 'logout',
      label: tCommon('signOut'),
      icon: <LogOut size={16} />,
      onClick: handleLogout,
    },
  ];

  const navItems = [
    { key: 'dashboard', href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard, active: pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/` },
    { key: 'create', href: `/${locale}/create`, label: t('intake'), icon: FileText, active: pathname.includes('/create') },
    { key: 'messages', href: `/${locale}/messages`, label: t('messages'), icon: MessageSquare, active: pathname.includes('/messages') },
    { key: 'workspace', href: `/${locale}/workspace`, label: t('workspace'), icon: Users, active: pathname.includes('/workspace') },
    { key: 'settings', href: `/${locale}/settings`, label: t('settings'), icon: Settings, active: pathname.includes('/settings') },
  ];

  // Bottom nav: primary 3 items shown on mobile
  const bottomNavItems = [
    { key: 'dashboard', href: `/${locale}/dashboard`, label: t('dashboard'), icon: Home, active: pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/` },
    { key: 'create', href: `/${locale}/create`, label: t('intake'), icon: PlusCircle, active: pathname.includes('/create') },
    { key: 'messages', href: `/${locale}/messages`, label: t('messages'), icon: Bell, active: pathname.includes('/messages') },
  ];

  const navDropdownItems: DropdownItem[] = navItems.map((item) => ({
    key: item.href,
    label: item.label,
    icon: <item.icon size={16} />,
    onClick: () => router.push(item.href),
  }));

  return (
    <div className="app app--no-sidebar">
      {/* ═══ Mobile Nav Drawer ═══ */}
      {/* Overlay */}
      <div
        className={`mobile-nav-overlay${drawerOpen ? ' open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={`mobile-nav-drawer${drawerOpen ? ' open' : ''}`} aria-label={tCommon('menu')}>
        <div className="mobile-nav-drawer-header">
          <div className="brand">
            <div className="brand-mark" />
            <span className="brand-text">GitNexus Legal</span>
          </div>
          <button
            className="mobile-nav-drawer-close"
            onClick={closeDrawer}
            type="button"
            aria-label={tCommon('close')}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-nav-drawer-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mobile-nav-item${item.active ? ' active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mobile-nav-drawer-footer">
          <div className="mobile-drawer-user">
            <div className="circle">{getInitials(userName)}</div>
            <div className="mobile-drawer-user-info">
              <strong>{userName}</strong>
              <span>{workspaceName}</span>
            </div>
          </div>

          <div className="mobile-drawer-actions">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="mobile-drawer-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            {tCommon('signOut')}
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="main">
        <header className="topbar">
          {/* Left: Hamburger + Brand */}
          <div className="header-brand">
            {/* Hamburger button (mobile only) */}
            <button
              className="hamburger-btn"
              type="button"
              onClick={openDrawer}
              aria-label={tCommon('menu')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            <div className="brand">
              <div className="brand-mark" />
              <span className="brand-text">GitNexus Legal</span>
            </div>
            <span className="header-workspace">{workspaceName} · {workspaceSlug}</span>
          </div>

          {/* Right: Actions */}
          <div className="top-actions">
            <div className="search-top">
              <Search size={18} />
              <input type="text" placeholder={tCommon('search')} />
            </div>

            {/* Navigation menu — desktop dropdown */}
            <DropdownMenu items={navDropdownItems} trigger={['click']} placement="bottomRight">
              <button className="menu-toggle-btn" type="button" aria-label={tCommon('menu')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </DropdownMenu>

            {/* Language Switcher — hidden on mobile via CSS */}
            <LanguageSwitcher />
            <ThemeToggle />

            {/* User avatar with dropdown */}
            <DropdownMenu items={userMenuItems} trigger={['click']} placement="bottomRight">
              <div className="circle">{getInitials(userName)}</div>
            </DropdownMenu>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>

      {/* ═══ Bottom Navigation Bar (mobile only) ═══ */}
      <nav className="bottom-nav" aria-label={tCommon('menu')}>
        <div className="bottom-nav-inner">
          {bottomNavItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`bottom-nav-item${item.active ? ' active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default UserLayout;
