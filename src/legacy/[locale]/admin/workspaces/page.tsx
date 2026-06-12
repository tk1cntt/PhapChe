'use client';

import { useState, useEffect } from 'react';
import { Table, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { AdminStatGrid } from '../components/AdminStatGrid';
import { AdminToolbar } from '../components/AdminToolbar';
import './workspaces.css';

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  isActive: boolean;
}

export default function WorkspacesPage() {
  const t = useTranslations('AdminWorkspaces');
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data.workspaces || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  const statCards = [
    { title: t('pageTitle'), value: workspaces.length, description: t('statTotalWorkspaces'), variant: 'blue' as const },
    { title: t('activeWorkspaces'), value: workspaces.filter(w => w.isActive).length, description: t('statActive'), variant: 'green' as const },
    { title: t('totalMembers'), value: workspaces.reduce((sum, w) => sum + w.memberCount, 0), description: t('statTotalMembers'), variant: 'orange' as const },
    { title: t('inactiveWorkspaces'), value: workspaces.filter(w => !w.isActive).length, description: t('statInactive'), variant: 'red' as const },
  ];

  const tableHeaderStyle = {
    background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
    borderBottom: '1px solid #dfe7f1',
  };

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (text: string) => (
        <div className="cell-name">
          <div className="name-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7h6v14"/>
              <path d="M13 21V3h6v18"/>
            </svg>
          </div>
          <span className="name-text">{text}</span>
        </div>
      ),
    },
    {
      title: t('slug'),
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (text: string) => <span className="cell-slug">{text}</span>,
    },
    {
      title: t('members'),
      dataIndex: 'memberCount',
      key: 'members',
      width: 200,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (count: number) => <span className="cell-members">{count} {count === 1 ? t('member') : t('members').toLowerCase()}</span>,
    },
    {
      title: t('status'),
      key: 'status',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (_: unknown, record: WorkspaceRow) => (
        <span className={`status-badge ${record.isActive ? 'active' : 'inactive'}`}>
          <span className={`status-dot ${record.isActive ? 'active' : 'inactive'}`} />
          {record.isActive ? t('active') : t('inactive')}
        </span>
      ),
      width: 150,
    },
  ];

  return (
    <div className="workspaces-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
        <p className="subtitle">{t('pageDescription')}</p>
      </div>

      <AdminStatGrid cards={statCards} />

      <AdminToolbar
        searchPlaceholder={t('searchPlaceholder')}
        filterLabel={t('filterStatus')}
        exportLabel={t('export')}
        onExport={() => console.log('export')}
      />

      <div className="permission-card">
        <div className="permission-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <span className="permission-title">
            {t('permissionTitle')}
          </span>
        </div>
        <p className="permission-desc">
          {t('permissionDenied')}
        </p>
      </div>

      <div className="table-card">
        <Table
          dataSource={workspaces}
          rowKey="id"
          columns={columns}
          pagination={false}
          size="middle"
          locale={{ emptyText: t('noData') }}
          style={{ borderRadius: 15, overflow: 'hidden' }}
          onRow={() => ({ style: { minHeight: 72 } })}
        />

        <div className="table-footer">
          <button className="create-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            {t('createButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
