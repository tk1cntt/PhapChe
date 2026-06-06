import { Tag, Card, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import ReviewerRequestsTable from './ReviewerRequestsTable';

export default async function ReviewerQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const session = await requireAppSession();

  const pendingReviews = await prisma.documentVersion.findMany({
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
              assignedSpecialist: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = pendingReviews.map((r) => ({
    id: r.id,
    requestId: r.document.request.id,
    title: r.document.request.title,
    matterTypeKey: r.document.request.intakeSubmission?.matterTypeKey ?? null,
    specialistName: r.document.request.assignedSpecialist?.name ?? null,
    templateVersion: r.templateVersion,
    createdAt: r.createdAt.toISOString(),
    reviewHref: `/reviewer/requests/${r.document.request.id}/review/${r.id}`,
  }));

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

      <ReviewerRequestsTable rows={rows} notice={notice} />
    </Flex>
  );
}
