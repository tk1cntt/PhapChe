import Link from 'next/link';
import { Tag, Card, Table, Typography, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

type PendingReview = {
  id: string;
  templateVersion: number;
  createdAt: Date;
  document: {
    id: string;
    request: {
      id: string;
      title: string;
      intakeSubmission: { matterTypeKey: string } | null;
      assignedSpecialist: { name: string; email: string } | null;
    };
  };
};

export default async function ReviewerQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const session = await requireAppSession();

  const pendingReviews: PendingReview[] = await prisma.documentVersion.findMany({
    where: {
      status: 'submitted_for_review',
      document: {
        request: {
          assignedReviewerId: session.userId,
        },
      },
    },
    select: {
      id: true,
      templateVersion: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          request: {
            select: {
              id: true,
              title: true,
              intakeSubmission: { select: { matterTypeKey: true } },
              assignedSpecialist: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const columns: ColumnsType<PendingReview> = [
    {
      title: 'Yeu cau',
      dataIndex: ['document', 'request', 'title'],
      key: 'title',
      render: (title: string, record: PendingReview) => (
        <Link
          href={`/reviewer/requests/${record.document.request.id}/review/${record.id}`}
          style={{ color: '#0F766E' }}
        >
          {title}
        </Link>
      ),
    },
    {
      title: 'Loai vu viec',
      key: 'matterType',
      render: (_: unknown, record: PendingReview) =>
        record.document.request.intakeSubmission?.matterTypeKey ?? 'Chua co loai',
    },
    {
      title: 'Chuyen vien',
      key: 'specialist',
      render: (_: unknown, record: PendingReview) =>
        record.document.request.assignedSpecialist?.name ?? 'Chua co',
    },
    {
      title: 'Phien ban',
      dataIndex: 'templateVersion',
      key: 'templateVersion',
      render: (v: number) => `v${v}`,
    },
    {
      title: 'Gui luc',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatDate(date),
    },
  ];

  return (
    <Flex vertical gap="middle">
      {notice === 'approved' ? (
        <Tag color="cyan">Da duyet tai lieu. Tai lieu da duoc chuyen sang trang thai cuoi.</Tag>
      ) : notice === 'revision' ? (
        <Tag color="red">Da gui yeu cau chinh sua cho chuyen vien.</Tag>
      ) : null}

      <Flex vertical>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Hang cho duyet
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: '#475569' }}>
          Danh sach phien ban tai lieu duoc chuyen vien gui len cho ban duyet.
        </Typography.Paragraph>
      </Flex>

      <Card>
        <Typography.Title level={5}>Hang cho duyet</Typography.Title>
        <Typography.Paragraph style={{ color: '#475569' }}>
          Danh sach nay duoc loc tren may chu theo reviewer dang dang nhap.
        </Typography.Paragraph>
      </Card>

      <Table
        dataSource={pendingReviews}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Typography.Text strong>Chua co tai lieu cho duyet</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                Khi chuyen vien gui tai lieu len, tai lieu se xuat hien tai day.
              </Typography.Text>
            </div>
          ),
        }}
      />
    </Flex>
  );
}
