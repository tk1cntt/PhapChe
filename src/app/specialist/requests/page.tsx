import { Card, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import SpecialistRequestsTable from './SpecialistRequestsTable';

const { Title, Paragraph } = Typography;

export default async function SpecialistRequestsPage() {
  const session = await requireAppSession();

  const requests = await prisma.legalRequest.findMany({
    where: {
      workspaceId: session.activeWorkspaceId ?? '',
      assignedSpecialistId: session.userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map to serializable DTOs — Date objects converted to ISO strings for client component
  const rows = requests.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    customerName: r.createdBy.name,
    customerEmail: r.createdBy.email,
    matterTypeKey: r.intakeSubmission?.matterTypeKey ?? null,
  }));

  return (
    <>
      <Flex vertical gap={8} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Yêu cầu được giao</Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Danh sách yêu cầu đã được điều phối cho bạn.
        </Paragraph>
      </Flex>

      <Card>
        <Title level={5} style={{ marginBottom: 4 }}>Hàng chờ xử lý</Title>
        <Paragraph style={{ color: '#475569', marginBottom: 0 }}>
          Danh sách này được lọc trên máy chủ theo workspace hiện tại và chuyên viên đang đăng nhập.
        </Paragraph>
      </Card>

      <SpecialistRequestsTable rows={rows} />
    </>
  );
}
