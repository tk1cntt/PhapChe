'use client';

import { useState, useEffect } from 'react';
import { Table, Flex, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { AdminStatGrid } from '../components/AdminStatGrid';
import { AdminToolbar } from '../components/AdminToolbar';

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
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
            color: '#087f78', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7h6v14"/>
              <path d="M13 21V3h6v18"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700 }}>{text}</span>
        </div>
      ),
    },
    {
      title: t('slug'),
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (text: string) => <span style={{ color: '#334155', fontWeight: 600 }}>{text}</span>,
    },
    {
      title: t('members'),
      dataIndex: 'memberCount',
      key: 'members',
      width: 200,
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (count: number) => <span style={{ color: '#334155', fontWeight: 600 }}>{count} {count === 1 ? t('member') : t('members').toLowerCase()}</span>,
    },
    {
      title: t('status'),
      key: 'status',
      onHeaderCell: () => ({ style: tableHeaderStyle }),
      render: (_: unknown, record: WorkspaceRow) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', height: 28,
          padding: '0 11px', borderRadius: 999,
          background: record.isActive ? '#ccfbf1' : '#f1f5f9',
          color: record.isActive ? '#0f766e' : '#64748b',
          fontSize: 12, fontWeight: 700,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: record.isActive ? '#10b981' : '#94a3b8',
            marginRight: 7,
          }} />
          {record.isActive ? t('active') : t('inactive')}
        </span>
      ),
      width: 150,
    },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
      </Flex>

      <AdminStatGrid cards={statCards} />

      <AdminToolbar
        searchPlaceholder={t('searchPlaceholder')}
        filterLabel={t('filterStatus')}
        exportLabel={t('export')}
        onExport={() => console.log('export')}
      />

      <div style={{
        background: '#fff',
        border: '1px solid #dfe7f1',
        borderRadius: 15,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
        padding: '26px 25px',
        marginBottom: 18,
        marginLeft: 24,
        marginRight: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <span style={{ fontSize: 21, fontWeight: 800, color: '#0f172a' }}>
            {t('permissionTitle')}
          </span>
        </div>
        <p style={{ color: '#59687e', fontSize: 14, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>
          {t('permissionDenied')}
        </p>
      </div>

      <div style={{
        marginLeft: 24, marginRight: 24,
        background: '#fff', border: '1px solid #dfe7f1',
        borderRadius: 15, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, marginBottom: 18, marginRight: 18 }}>
        <button style={{
          height: 45, padding: '0 18px', border: 'none', borderRadius: 8,
          background: 'linear-gradient(180deg, #0b8f86, #087970)',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
          {t('createButton')}
        </button>
      </div>
      </div>
    </>
  );
}
