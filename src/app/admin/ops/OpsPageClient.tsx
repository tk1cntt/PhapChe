'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Button, Spin } from 'antd';
import AdminOpsTables from './AdminOpsTables';
import type { OpsRequestRow, OpsWorkloadRow } from './AdminOpsTables';
import type { RequestStatus } from '@prisma/client';
import Link from 'next/link';

const { Text, Title, Paragraph } = Typography;

const statusLabels: Record<RequestStatus, { label: string; tone: string }> = {
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

interface DashboardData {
  total: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  requests: any[];
  workload: any[];
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <Title level={4}>{title}</Title>
      <Text type="secondary">{body}</Text>
    </Card>
  );
}

export default function OpsPageClient() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ops')
      .then((r) => r.json())
      .then((data) => {
        setDashboard(data);
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

  const hasData = dashboard && (dashboard.total > 0 || dashboard.requests.length > 0);

  const requestRows: OpsRequestRow[] = (dashboard?.requests ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    workspaceId: r.workspaceId,
    matterTypeKey: r.matterTypeKey,
    matterTypeLabel: r.matterTypeLabel,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    assignedSpecialistName: r.assignedSpecialistName,
    assignedReviewerName: r.assignedReviewerName,
    createdAt: r.createdAt,
    currentStatusAgeDays: r.currentStatusAgeDays,
  }));

  const workloadRows: OpsWorkloadRow[] = (dashboard?.workload ?? []).map((r: any) => ({
    kind: r.kind,
    userId: r.userId,
    name: r.name,
    email: r.email,
    activeCount: r.activeCount,
    byStatus: r.byStatus,
    oldestActiveAgeDays: r.oldestActiveAgeDays,
  }));

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Vận hành
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn.
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Tổng quan vận hành</Title>
        {!hasData ? (
          <EmptyState
            title="Chưa có dữ liệu vận hành"
            body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây."
          />
        ) : dashboard ? (
          <Flex vertical gap={8} style={{ marginBottom: 16 }}>
            <Flex gap={4} wrap="wrap">
              {dashboard.byStatus.map((row) => (
                <Text key={row.status}>
                  {statusLabels[row.status]?.label ?? row.status}: {row.count}{' '}
                </Text>
              ))}
            </Flex>
          </Flex>
        ) : null}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Danh sách hồ sơ</Title>
        {!hasData ? (
          <EmptyState
            title="Không có hồ sơ phù hợp"
            body="Thử điều chỉnh bộ lọc."
          />
        ) : (
          <AdminOpsTables requests={requestRows} workload={workloadRows} />
        )}
      </Card>
    </>
  );
}
