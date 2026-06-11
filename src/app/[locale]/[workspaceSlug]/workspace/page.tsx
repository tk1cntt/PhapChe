'use client';

import React from 'react';
import { Building2, Users, FileText, Lock, Plus } from 'lucide-react';
import { Badge } from '../../customer/components/Badge';
import { WorkspaceBanner } from '../../customer/components/Workspace/WorkspaceBanner';
import { StatsGrid } from '../../customer/components/Workspace/StatsGrid';
import { MemberGrid } from '../../customer/components/Workspace/MemberGrid';
import { ResourceTable } from '../../customer/components/Workspace/ResourceTable';

interface WorkspacePageProps {
  params: {
    locale: string;
    workspaceSlug: string;
  };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { locale, workspaceSlug } = params;

  // Mock data - in production, fetch from database via Prisma
  // TODO: Replace with actual Prisma queries when Better Auth session is available
  const workspace = {
    id: 'ws-anphat-001',
    name: 'Cong ty An Phat',
    slug: 'an-phat',
    isActive: true,
  };

  const members = [
    { id: 'user-mp-001', name: 'Mai Phuong', email: 'mai.phuong@anphat.vn', role: 'owner', isActive: true },
    { id: 'user-la-001', name: 'Linh Anh', email: 'linh.anh@anphat.vn', role: 'finance', isActive: true },
    { id: 'user-vt-001', name: 'Van Trang', email: 'trang.van@anphat.vn', role: 'viewer', isActive: true },
    { id: 'user-hn-001', name: 'Nam Hoang', email: 'nam.hoang@anphat.vn', role: 'customer', isActive: false },
  ];

  const stats = {
    isActive: workspace.isActive,
    slug: workspace.slug,
    memberCount: members.length,
    activeMemberCount: members.filter(m => m.isActive).length,
    invitedMemberCount: members.filter(m => !m.isActive).length,
    requestCount: 12,
    processingRequestCount: 3,
    vaultFileCount: 36,
  };

  const resourceData = {
    requestCount: stats.requestCount,
    vaultFileCount: stats.vaultFileCount,
    invitedCount: stats.invitedMemberCount,
    lastRequestUpdate: '2026-06-10T21:15:00.000Z',
    lastVaultUpdate: '2026-06-10T20:48:00.000Z',
    lastInviteUpdate: '2026-06-09T16:00:00.000Z',
  };

  return (
    <div className="workspace-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Workspace</h1>
          <p className="subtitle">
            Xem thanh vien, quyen truy cap, tai nguyen va pham vi du lieu cua workspace {workspace.name}.
          </p>
        </div>
      </div>

      {/* Workspace Banner */}
      <WorkspaceBanner workspaceName={workspace.name} workspaceSlug={workspace.slug} />

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Member Grid */}
      <MemberGrid members={members} />

      {/* Resource Table */}
      <ResourceTable resources={resourceData} />

      {/* Floating Chat Button */}
      <div className="floating-chat">
        <span>N</span>
        <span>2 Tin moi</span>
      </div>
    </div>
  );
}
