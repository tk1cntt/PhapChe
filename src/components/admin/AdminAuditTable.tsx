'use client';

import { Tag, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';

export interface AuditEventRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: string;
  actor?: { email: string | null; name: string | null } | null;
  workspace: { name: string };
}

interface AdminAuditTableProps {
  events: AuditEventRow[];
  loading?: boolean;
}

function getActionBadgeColor(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('access_denied') || actionLower.includes('unauthorized')) {
    return 'red';
  }
  if (actionLower.includes('role_change') || actionLower.includes('role') || actionLower.includes('updateuserrole')) {
    return 'purple';
  }
  if (actionLower.includes('create') || actionLower.includes('assign') || actionLower.includes('add')) {
    return 'green';
  }
  if (actionLower.includes('export')) {
    return 'orange';
  }
  return 'blue';
}

export function AdminAuditTable({ events, loading }: AdminAuditTableProps) {
  const t = useTranslations('AuditEvents');

  const columns: ColumnsType<AuditEventRow> = [
    {
      title: t('time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) =>
        new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val)),
      width: 180,
    },
    {
      title: t('actor'),
      key: 'actor',
      render: (_: unknown, record: AuditEventRow) => record.actor?.email ?? 'system',
      width: 200,
    },
    {
      title: t('workspace'),
      key: 'workspace',
      render: (_: unknown, record: AuditEventRow) => record.workspace.name,
      width: 180,
    },
    {
      title: t('action'),
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionBadgeColor(action)}>{action}</Tag>
      ),
      width: 150,
    },
    {
      title: t('target'),
      key: 'target',
      render: (_: unknown, record: AuditEventRow) => `${record.targetType}:${record.targetId}`,
      width: 200,
    },
    {
      title: t('correlationId'),
      key: 'correlationId',
      render: (_: unknown, record: AuditEventRow) => record.correlationId ?? '-',
      width: 200,
      renderText: (text: string) =>
        text ? (
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 12,
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '7px 9px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: t('metadataSummary'),
      key: 'metadataSummary',
      render: (_: unknown, record: AuditEventRow) => record.metadataSummary ?? '-',
    },
  ];

  return (
    <div className="audit-table-wrapper">
      <Table
        dataSource={events}
        rowKey="id"
        columns={columns}
        loading={loading}
        pagination={false}
        size="middle"
        bordered
        locale={{ emptyText: t('noData') }}
        style={{
          background: '#fff',
          border: '1px solid #dfe7f1',
          borderRadius: 15,
          boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
        }}
      />
      <style>{`
        .audit-table-wrapper .ant-table {
          border-radius: 15px;
        }
        .audit-table-wrapper .ant-table-thead > tr > th {
          background: linear-gradient(180deg, #f8fafc, #f5f7fb) !important;
          font-weight: 700;
          color: #59687e;
        }
        .audit-table-wrapper .ant-table-tbody > tr:hover > td {
          background: #fbfdff !important;
        }
      `}</style>
    </div>
  );
}
