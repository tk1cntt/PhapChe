import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { Card, Typography, Flex, Button, Space, Tag } from 'antd';
import { notFound } from 'next/navigation';
import AdminUsersTable from './AdminUsersTable';
import type { UserRow } from './AdminUsersTable';

const roles = [
  { value: 'customer', label: 'Khach hang', tone: 'neutral' as const },
  { value: 'specialist', label: 'Chuyen vien', tone: 'info' as const },
  { value: 'reviewer', label: 'Reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', label: 'Dieu phoi vien', tone: 'accent' as const },
  { value: 'super_admin', label: 'Super admin', tone: 'destructive' as const },
];

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
};

export default async function UsersPage() {
  const session = await requireAppSession();
  if (!session.roles.includes('super_admin') && !session.roles.includes('coordinator_admin')) notFound();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        select: { role: true, workspace: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dataSource: UserRow[] = users.map((user) => ({
    key: user.id,
    name: user.name,
    email: user.email,
    role: user.memberships[0]?.role ?? 'customer',
    workspace: user.memberships[0]?.workspace.name ?? '-',
    status: user.isActive ? 'Dang hoat dong' : 'Vo hieu hoa',
  }));

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Quan ly nguoi dung
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Nen tang quan tri 5 vai tro: customer, specialist, reviewer, coordinator_admin va super_admin.
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={16}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Vai tro he thong
          </Typography.Title>
          <Flex wrap="wrap" gap={8}>
            {roles.map((role) => (
              <Tag key={role.value} color={toneToColor[role.tone] ?? 'default'}>
                {role.label} ({role.value})
              </Tag>
            ))}
          </Flex>
          <Typography.Paragraph style={{ color: '#475569', margin: 0 }}>
            Thay doi user/role/workspace goi createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace va duoc ghi audit.
          </Typography.Paragraph>
        </Space>
      </Card>

      <AdminUsersTable dataSource={dataSource} />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">Tao nguoi dung</Button>
      </Flex>
    </>
  );
}
