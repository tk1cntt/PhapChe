'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Button, Spin } from 'antd';
import AdminOpsTables from './AdminOpsTables';
import type { OpsRequestRow, OpsWorkloadRow } from './AdminOpsTables';
import type { RequestStatus } from '@/lib/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const { Text, Title, Paragraph } = Typography;

const statusLabels: Record<RequestStatus, { labelKey: string; tone: string }> = {
  draft_intake: { labelKey: 'draft_intake', tone: 'neutral' },
  intake_submitted: { labelKey: 'intake_submitted', tone: 'info' },
  triage: { labelKey: 'triage', tone: 'warning' },
  assigned: { labelKey: 'assigned', tone: 'info' },
  in_progress: { labelKey: 'in_progress', tone: 'info' },
  pending_review: { labelKey: 'pending_review', tone: 'warning' },
  revision_required: { labelKey: 'revision_required', tone: 'destructive' },
  approved: { labelKey: 'approved', tone: 'accent' },
  delivered: { labelKey: 'delivered', tone: 'outline' },
  closed: { labelKey: 'closed', tone: 'neutral' },
  cancelled: { labelKey: 'cancelled', tone: 'destructive' },
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

interface DashboardData {
  total: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  requests: OpsRequestRow[];
  workload: OpsWorkloadRow[];
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
  const t = useTranslations('AdminOps');
  const tStatus = useTranslations('RequestStatus');
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract locale from pathname: /en/admin/ops -> en
    const locale = pathname.split('/')[1] || 'vi';
    fetch(`/${locale}/api/ops`)
      .then((r) => r.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  const hasData = dashboard && (dashboard.total > 0 || dashboard.requests.length > 0);

  const requestRows: OpsRequestRow[] = (dashboard?.requests ?? []).map((r) => ({
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

  const workloadRows: OpsWorkloadRow[] = (dashboard?.workload ?? []).map((r) => ({
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
          {t('pageTitle')}
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          {t('pageDescription')}
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{t('overviewTitle')}</Title>
        {!hasData ? (
          <EmptyState title={t('noData')} body={t('noDataHint')} />
        ) : dashboard ? (
          <Flex vertical gap={8} style={{ marginBottom: 16 }}>
            <Flex gap={4} wrap="wrap">
              {dashboard.byStatus.map((row) => (
                <Text key={row.status}>
                  {tStatus(statusLabels[row.status]?.labelKey ?? row.status)}: {row.count}{' '}
                </Text>
              ))}
            </Flex>
          </Flex>
        ) : null}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{t('requestList')}</Title>
        {!hasData ? (
          <EmptyState title={t('noRequests')} body={t('noRequestsHint')} />
        ) : (
          <AdminOpsTables requests={requestRows} workload={workloadRows} />
        )}
      </Card>
    </>
  );
}
