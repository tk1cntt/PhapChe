'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/shared/ui/DropdownMenu';
import type { DropdownItem } from '@/components/shared/ui/DropdownMenu';
import { signOut } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/shared/ui/ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import '@/styles/pages/admin/ai-assistant.css';
import { AiProvider } from '@/lib/ai/AiContext';
import { AiStatusBadge } from '@/components/admin/AiStatusBadge';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Handshake,
  Building2,
  Activity,
  Shield,
  Archive,
  Search,
  LogOut,
  Menu,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  userInitial?: string;
  locale?: string;
  userRoles?: string[];
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRoles?: readonly string[];
}

function getInitials(name: string): string {
  if (!name || name.length === 0) return 'A';
  return name.substring(0, 2).toUpperCase();
}

function Topbar({ userName, userRole, userInitial = 'A', userRoles = [], locale = 'vi' }: { userName?: string; userRole?: string; userInitial?: string; userRoles?: string[]; locale?: string }) {
  const router = useRouter();
  const t = useTranslations('AdminNav');
  const tCommon = useTranslations('Common');

  const hasAccess = (roles: readonly string[] | null): boolean => {
    if (roles === null) return true;
    return userRoles.some(r => roles.includes(r));
  };

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(`/${locale}/sign-in`);
            router.refresh();
          },
        },
      });
    } catch (e) {
      // TODO: surface error to user via toast/notification
      console.error('Logout failed:', e);
      router.push(`/${locale}/sign-in`);
    }
    }

  const userMenuItems: DropdownItem[] = [
    {
      key: 'logout',
      label: tCommon('signOut'),
      icon: <LogOut size={16} />,
      onClick: handleLogout,
    },
  ];

function buildNavItems(
  t: ReturnType<typeof useTranslations<'AdminNav'>>,
  locale: string
): NavItem[] {
  return [
    {
      key: 'dashboard',
      label: t('dashboard'),
      href: `/${locale}/admin/dashboard`,
      requiredRoles: undefined,
      icon: <LayoutDashboard size={16} />,
    },
    {
      key: 'requests',
      label: t('requests'),
      href: `/${locale}/admin/requests`,
      requiredRoles: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
      icon: <FileText size={16} />,
    },
    {
      key: 'users',
      label: t('users'),
      href: `/${locale}/admin/users`,
      requiredRoles: ['super_admin', 'coordinator_admin'],
      icon: <Users size={16} />,
    },
    {
      key: 'workspace',
      label: t('workspaces'),
      href: `/${locale}/admin/workspace`,
      requiredRoles: ['super_admin', 'coordinator_admin'],
      icon: <Building size={16} />,
    },
    {
      key: 'partner',
      label: t('partner'),
      href: `/${locale}/admin/partner`,
      requiredRoles: ['super_admin', 'coordinator_admin'],
      icon: <Handshake size={16} />,
    },
    {
      key: 'organizations',
      label: t('organizations'),
      href: `/${locale}/admin/organizations`,
      requiredRoles: ['super_admin'],
      icon: <Building2 size={16} />,
    },
    {
      key: 'operations',
      label: t('ops'),
      href: `/${locale}/admin/operations`,
      requiredRoles: ['super_admin', 'coordinator_admin'],
      icon: <Activity size={16} />,
    },
    {
      key: 'audit',
      label: t('audit'),
      href: `/${locale}/admin/audit`,
      requiredRoles: ['super_admin', 'coordinator_admin', 'audit_admin'],
      icon: <Shield size={16} />,
    },
    {
      key: 'vault',
      label: t('vault'),
      href: `/${locale}/admin/vault`,
      requiredRoles: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
      icon: <Archive size={16} />,
    },
  ];
}
      requiredRoles: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
      icon: <Archive size={16} />,
    },
  ];
}
    label: item.label,
    icon: item.icon,
    onClick: () => router.push(item.href),
  }));

  return (
    <header className="topbar">
      {/* Left: Brand logo + admin label */}
      <div className="header-brand">
        <div className="brand">
          <div className="brand-mark" />
          <span className="brand-text">GitNexus Legal</span>
        </div>
        <span className="header-workspace">Admin · {userRole || 'Admin'}</span>
      </div>

      {/* Right: Actions */}
      <div className="top-actions">
        {/* TODO: implement search functionality with value/onChange */}
        <div className="search-top">
          <Search size={18} />
          <input type="text" placeholder={tCommon('search')} />
        </div>
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

        {/* AI Status */}
        <AiStatusBadge />

        {/* User avatar with dropdown */}
        <DropdownMenu items={userMenuItems} trigger={['click']} placement="bottomRight">
          <div className="circle">{userInitial || getInitials(userName || '')}</div>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AdminLayout({ children, userName, userRole, userInitial, userRoles = [], locale = 'vi' }: AdminLayoutProps) {
  return (
    <AiProvider>
      <div className="app app--no-sidebar">
        <main className="main">
          <Topbar userName={userName} userRole={userRole} userInitial={userInitial} userRoles={userRoles} locale={locale} />
          <section className="content">
            {children}
          </section>
        </main>
      </div>
    </AiProvider>
  );
}
