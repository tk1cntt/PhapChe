'use client';

import { Table, Tag, Flex } from 'antd';
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

const statusLabels: Record<RequestStatus, string> = {
  draft_intake: 'Nháp tiếp nhận',
  intake_submitted: 'Đã gửi tiếp nhận',
  triage: 'Đang phân loại',
  assigned: 'Đã phân công',
  in_progress: 'Đang xử lý',
  pending_review: 'Chờ review',
  revision_required: 'Cần chỉnh sửa',
  approved: 'Đã duyệt',
  delivered: 'Đã giao',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
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
  const columns: ColumnsType<RequestRow> = [
    {
      title: 'Yêu cầu',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: RequestRow) => record.createdBy.name || record.createdBy.email,
      width: 180,
    },
    {
      title: 'Loại vụ việc',
      key: 'matterType',
      render: (_: unknown, record: RequestRow) =>
        record.intakeSubmission?.matterType?.label || record.intakeSubmission?.matterTypeKey || 'Chưa phân loại',
      width: 180,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: RequestRow) => (
        <Tag color={toneToColor[record.status] ?? 'default'}>{statusLabels[record.status] ?? record.status}</Tag>
      ),
      width: 150,
    },
    {
      title: 'Chuyên viên',
      key: 'specialist',
      render: (_: unknown, record: RequestRow) =>
        record.assignedSpecialist?.name || record.assignedSpecialist?.email || '—',
      width: 180,
    },
    {
      title: 'Reviewer',
      key: 'reviewer',
      render: (_: unknown, record: RequestRow) =>
        record.assignedReviewer?.name || record.assignedReviewer?.email || '—',
      width: 180,
    },
    {
      title: 'Gợi ý specialist',
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
      title: 'Gợi ý reviewer',
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
  const columns: ColumnsType<MatterTypeRow> = [
    {
      title: 'Tên loại vụ việc',
      dataIndex: 'label',
      key: 'label',
      width: 220,
    },
    {
      title: 'Mã',
      dataIndex: 'key',
      key: 'key',
      width: 180,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      render: (_: unknown, record: MatterTypeRow) => (
        <Tag color={record.isActive ? 'cyan' : 'default'}>{record.isActive ? 'Đang dùng' : 'Tạm ẩn'}</Tag>
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
  const columns: ColumnsType<CapabilityRow> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: unknown, record: CapabilityRow) => record.user.name || record.user.email,
      width: 220,
    },
    {
      title: 'Vai trò',
      key: 'kind',
      render: (_: unknown, record: CapabilityRow) => (
        <Tag color={record.kind === 'specialist' ? 'cyan' : 'blue'}>
          {record.kind === 'specialist' ? 'Chuyên viên' : 'Reviewer'}
        </Tag>
      ),
      width: 160,
    },
    {
      title: 'Loại vụ việc',
      dataIndex: ['matterType', 'label'],
      key: 'matterType',
      width: 220,
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      render: (_: unknown, record: CapabilityRow) => (
        <Tag color={record.isActive ? 'cyan' : 'default'}>{record.isActive ? 'Đang dùng' : 'Tạm ẩn'}</Tag>
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
