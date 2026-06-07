'use client';

import type { ColumnsType } from 'antd/es/table';
import { Tag, Table } from 'antd';

export type OpsTimelineRow = {
  id: string;
  kind: 'audit' | 'workflow';
  at: string; // ISO string
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  correlationId: string | null;
  metadataSummary: string | null;
};

function formatDateTime(isoStr: string) {
  return isoStr.slice(0, 16).replace('T', ' ');
}

const columns: ColumnsType<OpsTimelineRow> = [
  {
    title: 'Time',
    dataIndex: 'at',
    key: 'at',
    render: (v: string) => formatDateTime(v),
    width: 150,
  },
  {
    title: 'Actor',
    key: 'actor',
    render: (_: unknown, record: OpsTimelineRow) =>
      record.actorName || record.actorEmail || record.actorId || 'system',
    width: 180,
  },
  {
    title: 'Kind',
    key: 'kind',
    render: (v: string) => (
      <Tag color={v === 'audit' ? 'blue' : 'default'}>{v}</Tag>
    ),
    width: 100,
  },
  {
    title: 'Action/status change',
    key: 'action',
    render: (_: unknown, record: OpsTimelineRow) => {
      if (record.fromStatus && record.toStatus) {
        return `${record.fromStatus} → ${record.toStatus}`;
      }
      return record.action;
    },
    width: 200,
  },
  {
    title: 'Target identifier',
    key: 'target',
    render: (_: unknown, record: OpsTimelineRow) => {
      const { targetType, targetId } = record;
      if (!targetType && !targetId) return '—';
      if (!targetType) return targetId!;
      if (!targetId) return targetType;
      return `${targetType}:${targetId}`;
    },
    width: 200,
  },
  {
    title: 'Reason',
    dataIndex: 'reason',
    key: 'reason',
    render: (v: string | null) => v ?? '—',
    width: 180,
  },
  {
    title: 'Correlation ID',
    dataIndex: 'correlationId',
    key: 'correlationId',
    render: (v: string | null) => v ?? '—',
    width: 180,
  },
  {
    title: 'metadataSummary',
    dataIndex: 'metadataSummary',
    key: 'metadataSummary',
    render: (v: string | null) => v ?? '—',
  },
];

export default function OpsTimelineTable({ rows }: { rows: OpsTimelineRow[] }) {
  return (
    <Table
      dataSource={rows}
      rowKey="id"
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}
