'use client';

import { useState } from 'react';
import type { RequestStatus } from '@/lib/types';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { Tag, Button, Card, Table, Typography, Flex } from 'antd';
import { useTranslations } from 'next-intl';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const statusLabels: Record<RequestStatus, { labelKey: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
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

const sampleStatus: RequestStatus = 'pending_review';
const requests = [
  { code: 'REQ-001', workspace: 'Công ty An Phát', status: sampleStatus },
  { code: 'REQ-002', workspace: 'Công ty Minh Khang', status: 'triage' as RequestStatus },
];

export default function RequestsPage() {
  const [loading] = useState(false);
  const tStatus = useTranslations('RequestStatus');
  const t = useTranslations('AdminRequests');

  const allowedTransitions = getAllowedTransitions(sampleStatus);

  const columns = [
    {
      title: t('code'),
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: t('workspace'),
      dataIndex: 'workspace',
      key: 'workspace',
      width: 250,
    },
    {
      title: t('status'),
      key: 'status',
      render: (_: unknown, record: (typeof requests)[number]) => {
        const meta = statusLabels[record.status];
        return <Tag color={toneToColor[meta.tone] ?? 'default'}>{tStatus(meta.labelKey)}</Tag>;
      },
      width: 180,
    },
    {
      title: t('validTransitions'),
      key: 'actions',
      render: () => (
        <span className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          {t('validTransitionsNote')}
        </span>
      ),
    },
  ];

  if (loading) {
    return <PageSkeleton rows={5} />;
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              {t('pageTitle')}
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              {t('pageDescription')}
            </Typography.Paragraph>
          </Flex>
          <Button type="primary">{t('createButton')}</Button>
        </Flex>
      </Flex>

      <Card className="space-y-4" style={{ marginBottom: 16 }}>
        <h2 className="text-[20px] font-semibold leading-[1.2]">{t('validTransitions')}</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          {t('validTransitionsNote')}
        </p>
        <Flex wrap="wrap" gap={8}>
          {allowedTransitions.map((transition) => (
            <Button
              key={transition}
              danger={transition === 'revision_required'}
            >
              {tStatus(statusLabels[transition].labelKey)}
            </Button>
          ))}
        </Flex>
        <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
          <span>{t('transitionReason')}</span>
          <textarea className="min-h-[96px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
        </label>
      </Card>

      <Table
        dataSource={requests}
        rowKey="code"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
        locale={{ emptyText: t('noData') }}
      />
    </>
  );
}
