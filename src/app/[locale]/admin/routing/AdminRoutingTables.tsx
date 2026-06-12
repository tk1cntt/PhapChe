'use client';

import { Table, Tag, Flex } from 'antd';
import { useTranslations } from 'next-intl';
import type { ColumnsType } from 'antd/es/table';
import type { AssignmentKind, RequestStatus } from '@/lib/types';

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

type Suggestion = { userId: string; name: string; email: string };

type RequestRow = {
  id: string;
  title: string;
  status: RequestStatus;
  createdBy: { name: string | null; email: string };
  assignedSpecialist: { name: string | null; email: string } | null;
  assignedReviewer: { name: string | null; email: string } | null;
  intakeSubmission: { matterTypeKey: string; matterType: { label: string } | null } | null;
};

type SuggestionRows = { specialists: Suggestion[]; reviewers: Suggestion[] };

type MatterTypeRow = {
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
};

type CapabilityRow = {
  userId: string;
  matterTypeKey: string;
  kind: AssignmentKind;
  user: { name: string | null; email: string };
  matterType: { label: string };
  isActive: boolean;
};

interface RoutingRequestsTableProps {
  requests: RequestRow[];
  suggestionRows: SuggestionRows[];
}

export function RoutingRequestsTable({ requests, suggestionRows }: RoutingRequestsTableProps) {
  const t = useTranslations('AdminRouting');
  const tStatus = useTranslations('RequestStatus');

  const columns: ColumnsType<RequestRow> = [
    {
      title: t('colRequest'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: t('colCustomer'),
      key: 'customer',
      render: (_: unknown, record: RequestRow) => record.createdBy.name || record.createdBy.email,
      width: 180,
    },
    {
      title: t('colMatterType'),
      key: 'matterType',
      render: (_: unknown, record: RequestRow) =>
        record.intakeSubmission?.matterType?.label || record.intakeSubmission?.matterTypeKey || tStatus('statusUncategorized'),
      width: 180,
    },
    {
      title: t('colStatus'),
      key: 'status',
      render: (_: unknown, record: RequestRow) => (
        <Tag color={toneToColor[record.status] ?? 'default'}>{tStatus(record.status)}</Tag>
      ),
      width: 150,
    },
    {
      title: t('colSpecialist'),
      key: 'specialist',
      render: (_: unknown, record: RequestRow) =>
        record.assignedSpecialist?.name || record.assignedSpecialist?.email || '—',
      width: 180,
    },
    {
      title: t('colReviewer'),
      key: 'reviewer',
      render: (_: unknown, record: RequestRow) =>
        record.assignedReviewer?.name || record.assignedReviewer?.email || '—',
      width: 180,
    },
    {
      title: t('colSpecialistSuggestions'),
      key: 'specialistSuggestions',
      render: (_: unknown, _rec: RequestRow, index: number) => {
        const list = suggestionRows[index]?.specialists ?? [];
        if (!list.length) return <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>;
        return (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {list.map((s) => (
              <li key={s.userId} style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 500, color: '#0F172A' }}>{s.name || s.email}</span>
                <br />
                <span style={{ color: '#64748B' }}>{s.email}</span>
              </li>
            ))}
          </ul>
        );
      },
      width: 220,
    },
    {
      title: t('colReviewerSuggestions'),
      key: 'reviewerSuggestions',
      render: (_: unknown, _rec: RequestRow, index: number) => {
        const list = suggestionRows[index]?.reviewers ?? [];
        if (!list.length) return <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>;
        return (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {list.map((s) => (
              <li key={s.userId} style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 500, color: '#0F172A' }}>{s.name || s.email}</span>
                <br />
                <span style={{ color: '#64748B' }}>{s.email}</span>
              </li>
            ))}
          </ul>
        );
      },
      width: 220,
    },
  ];

  return (
    <Table
      dataSource={requests}
      rowKey="id"
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}

interface RoutingMatterTypesTableProps {
  matterTypes: MatterTypeRow[];
}

export function RoutingMatterTypesTable({ matterTypes }: RoutingMatterTypesTableProps) {
  const t = useTranslations('AdminRouting');

  const columns: ColumnsType<MatterTypeRow> = [
    {
      title: t('colMatterTypeName'),
      dataIndex: 'label',
      key: 'label',
      width: 220,
    },
    {
      title: t('colKey'),
      dataIndex: 'key',
      key: 'key',
      width: 180,
    },
    {
      title: t('colDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: t('colIsActive'),
      key: 'isActive',
      render: (_: unknown, record: MatterTypeRow) => (
        <Tag color={record.isActive ? 'cyan' : 'default'}>{record.isActive ? t('active') : t('inactive')}</Tag>
      ),
      width: 120,
    },
  ];

  return (
    <Table
      dataSource={matterTypes}
      rowKey="key"
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}

interface RoutingCapabilitiesTableProps {
  capabilities: CapabilityRow[];
}

export function RoutingCapabilitiesTable({ capabilities }: RoutingCapabilitiesTableProps) {
  const t = useTranslations('AdminRouting');

  const columns: ColumnsType<CapabilityRow> = [
    {
      title: t('colUser'),
      key: 'user',
      render: (_: unknown, record: CapabilityRow) => record.user.name || record.user.email,
      width: 220,
    },
    {
      title: t('colRole'),
      key: 'kind',
      render: (_: unknown, record: CapabilityRow) => (
        <Tag color={record.kind === 'specialist' ? 'cyan' : 'blue'}>
          {record.kind === 'specialist' ? t('roleSpecialist') : t('roleReviewer')}
        </Tag>
      ),
      width: 160,
    },
    {
      title: t('colMatterType'),
      dataIndex: ['matterType', 'label'],
      key: 'matterType',
      width: 220,
    },
    {
      title: t('colIsActive'),
      key: 'isActive',
      render: (_: unknown, record: CapabilityRow) => (
        <Tag color={record.isActive ? 'cyan' : 'default'}>{record.isActive ? t('active') : t('inactive')}</Tag>
      ),
      width: 120,
    },
  ];

  return (
    <Table
      dataSource={capabilities}
      rowKey={(record: CapabilityRow) => `${record.userId}-${record.matterTypeKey}-${record.kind}`}
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}
