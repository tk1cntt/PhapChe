'use client';

import React from 'react';
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
  Menu,
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

  const userMenuItems: DropdownItem[] = [
    {
      key: 'logout',
      label: tCommon('signOut'),
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

  const navDropdownItems: DropdownItem[] = navItems.map((item) => ({
    key: item.href,
    label: item.label,
    icon: <item.icon size={16} />,
    onClick: () => router.push(item.href),
  }));

  return (
    <div className="app app--no-sidebar">
      <main className="main">
        <header className="topbar">
          {/* Left: Brand logo + workspace info */}
          <div className="header-brand">
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

            {/* Navigation menu dropdown */}
            <DropdownMenu items={navDropdownItems} trigger={['click']} placement="bottomRight">
              <button className="menu-toggle-btn" type="button" aria-label={tCommon('menu')}>
                <Menu size={20} />
              </button>
            </DropdownMenu>

            {/* Language Switcher */}
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
    </div>
  );
}

export default UserLayout;
