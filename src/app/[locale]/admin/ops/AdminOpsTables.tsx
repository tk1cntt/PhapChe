'use client';

import Link from 'next/link';
import { Table, Tag, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RequestStatus } from '@/lib/types';

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ review', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa', tone: 'destructive' },
  approved: { label: 'Đã duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao', tone: 'outline' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

export type OpsRequestRow = {
  id: string;
  title: string;
  status: RequestStatus;
  workspaceId: string;
  matterTypeKey: string | null;
  matterTypeLabel: string | null;
  customerName: string;
  customerEmail: string;
  assignedSpecialistName: string | null;
  assignedReviewerName: string | null;
  createdAt: string;
  currentStatusAgeDays: number;
};

export type OpsWorkloadRow = {
  kind: 'specialist' | 'reviewer';
  userId: string;
  name: string;
  email: string;
  activeCount: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  oldestActiveAgeDays: number;
};

function formatAge(days: number) {
  if (days <= 0) return 'Vừa cập nhật';
  return `${days} ngày`;
}

function personLabel(name: string | null, email?: string | null) {
  return name || email || 'Chưa phân công';
}

const requestColumns: ColumnsType<OpsRequestRow> = [
  {
    title: 'Mã hồ sơ',
    key: 'title',
    render: (_: unknown, record: OpsRequestRow) => record.title || record.id,
    width: 200,
  },
  {
    title: 'Khách hàng / Workspace',
    key: 'customer',
    render: (_: unknown, record: OpsRequestRow) =>
      `${personLabel(record.customerName, record.customerEmail)} / ${record.workspaceId}`,
    width: 250,
  },
  {
    title: 'Matter type',
    key: 'matterType',
    render: (_: unknown, record: OpsRequestRow) =>
      record.matterTypeLabel || record.matterTypeKey || 'Chưa phân loại',
    width: 180,
  },
  {
    title: 'Trạng thái',
    key: 'status',
    filters: Object.entries(statusLabels).map(([value, meta]) => ({ text: meta.label, value })),
    filterMultiple: false,
    onFilter: (value, record) => record.status === value,
    render: (_: unknown, record: OpsRequestRow) => {
      const meta = statusLabels[record.status];
      return <Tag color={toneToColor[meta.tone] ?? 'default'}>{meta.label}</Tag>;
    },
    width: 150,
  },
  {
    title: 'Specialist',
    key: 'specialist',
    render: (_: unknown, record: OpsRequestRow) => personLabel(record.assignedSpecialistName),
    width: 180,
  },
  {
    title: 'Reviewer',
    key: 'reviewer',
    render: (_: unknown, record: OpsRequestRow) => personLabel(record.assignedReviewerName),
    width: 180,
  },
  {
    title: 'Tuổi hồ sơ',
    key: 'age',
    render: (_: unknown, record: OpsRequestRow) =>
      formatAge(Math.max(0, record.currentStatusAgeDays)),
    width: 120,
  },
  {
    title: 'Thao tác',
    key: 'actions',
    render: (_: unknown, record: OpsRequestRow) => (
      <Link
        href={`/admin/ops/${record.id}`}
        style={{ color: '#0F766E', fontSize: 14, fontWeight: 600 }}
      >
        Xem timeline
      </Link>
    ),
    width: 120,
  },
];

const workloadColumns: ColumnsType<OpsWorkloadRow> = [
  {
    title: 'Người phụ trách',
    key: 'person',
    render: (_: unknown, record: OpsWorkloadRow) => personLabel(record.name, record.email),
    width: 200,
  },
  {
    title: 'Vai trò',
    key: 'kind',
    render: (_: unknown, record: OpsWorkloadRow) =>
      record.kind === 'specialist' ? 'Specialist' : 'Reviewer',
    width: 120,
  },
  {
    title: 'Active requests',
    dataIndex: 'activeCount',
    key: 'activeCount',
    width: 140,
  },
  {
    title: 'Pending review',
    key: 'pendingReview',
    render: (_: unknown, record: OpsWorkloadRow) =>
      record.byStatus.find((item) => item.status === 'pending_review')?.count ?? 0,
    width: 140,
  },
  {
    title: 'Revision required',
    key: 'revisionRequired',
    render: (_: unknown, record: OpsWorkloadRow) =>
      record.byStatus.find((item) => item.status === 'revision_required')?.count ?? 0,
    width: 150,
  },
  {
    title: 'Oldest active age',
    key: 'oldestAge',
    render: (_: unknown, record: OpsWorkloadRow) => formatAge(record.oldestActiveAgeDays),
    width: 150,
  },
];

interface AdminOpsTablesProps {
  requests: OpsRequestRow[];
  workload: OpsWorkloadRow[];
}

export default function AdminOpsTables({ requests, workload }: AdminOpsTablesProps) {
  return (
    <Flex vertical gap={16}>
      <Table
        dataSource={requests}
        rowKey="id"
        columns={requestColumns}
        pagination={false}
        size="middle"
        bordered
      />
      <Table
        dataSource={workload}
        rowKey={(row) => `${row.kind}-${row.userId}`}
        columns={workloadColumns}
        pagination={false}
        size="middle"
        bordered
      />
    </Flex>
  );
}
