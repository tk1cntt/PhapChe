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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Requests Table ───────────────────────────────────────────────────────────

type RoutingRequestsTableProps = {
  requests: RequestRow[];
  suggestionRows: SuggestionRows[];
};

export function RoutingRequestsTable({ requests, suggestionRows }: RoutingRequestsTableProps) {
  const columns = [
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
        if (!list.length) return <span className="text-[#94A3B8] text-[13px]">—</span>;
        return (
          <ul className="space-y-1">
            {list.map((s) => (
              <li key={s.userId} className="text-[13px]">
                <span className="font-medium text-[#0F172A]">{s.name || s.email}</span>
                <br />
                <span className="text-[#64748B]">{s.email}</span>
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
        if (!list.length) return <span className="text-[#94A3B8] text-[13px]">—</span>;
        return (
          <ul className="space-y-1">
            {list.map((s) => (
              <li key={s.userId} className="text-[13px]">
                <span className="font-medium text-[#0F172A]">{s.name || s.email}</span>
                <br />
                <span className="text-[#64748B]">{s.email}</span>
              </li>
            ))}
          </ul>
        );
      },
      width: 220,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: RequestRow, index: number) => {
        const { specialists, reviewers } = suggestionRows[index] ?? { specialists: [], reviewers: [] };
        return (
          <Flex vertical gap={4}>
            {specialists.map((s) => (
              <AssignmentCell key={s.userId} requestId={record.id} kind="specialist" suggestion={s} />
            ))}
            {reviewers.map((s) => (
              <AssignmentCell key={s.userId} requestId={record.id} kind="reviewer" suggestion={s} />
            ))}
            {!specialists.length && !reviewers.length && (
              <span className="text-[13px] text-[#94A3B8]">Không có gợi ý</span>
            )}
          </Flex>
        );
      },
      width: 260,
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

function AssignmentCell({ requestId, kind, suggestion }: { requestId: string; kind: AssignmentKind; suggestion: Suggestion }) {
  const label = kind === 'specialist' ? 'Chuyên viên' : 'Reviewer';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-[#64748B]">{label}: {suggestion.name || suggestion.email}</span>
      <button
        type="button"
        className="rounded border border-[#0F766E] bg-white px-2 py-1 text-[12px] text-[#0F766E] hover:bg-[#F0FDFA]"
        onClick={async () => {
          const reason = prompt('Lý do phân công:');
          if (!reason) return;
          await fetch('/api/routing/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, kind, assigneeId: suggestion.userId, reason }),
          });
          window.location.reload();
        }}
      >
        Phân công
      </button>
    </div>
  );
}

// ─── Matter Types Table ───────────────────────────────────────────────────────

type RoutingMatterTypesTableProps = { matterTypes: MatterTypeRow[] };

export function RoutingMatterTypesTable({ matterTypes }: RoutingMatterTypesTableProps) {
  const columns = [
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

// ─── Capabilities Table ───────────────────────────────────────────────────────

type RoutingCapabilitiesTableProps = { capabilities: CapabilityRow[] };

export function RoutingCapabilitiesTable({ capabilities }: RoutingCapabilitiesTableProps) {
  const columns = [
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
