'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Button, Space, Tag, Spin } from 'antd';
import AdminUsersTable from './AdminUsersTable';

const { Title, Paragraph } = Typography;

const roles = [
  { value: 'customer', label: 'Khach hang', tone: 'neutral' as const },
  { value: 'specialist', label: 'Chuyên viên', tone: 'info' as const },
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

export default function UsersPageClient() {
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setDataSource(data);
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

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Quan ly nguoi dung
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Nen tang quan tri 5 vai tro: customer, specialist, reviewer, coordinator_admin va super_admin.
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Space orientation="vertical" size={16}>
          <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Vai tro he thong
          </Title>
          <Flex wrap="wrap" gap={8}>
            {roles.map((role) => (
              <Tag key={role.value} color={toneToColor[role.tone] ?? 'default'}>
                {role.label} ({role.value})
              </Tag>
            ))}
          </Flex>
          <Paragraph style={{ color: '#475569', margin: 0 }}>
            Thay doi user/role/workspace goi createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace va duoc ghi audit.
          </Paragraph>
        </Space>
      </Card>

      <AdminUsersTable dataSource={dataSource} />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">Tao nguoi dung</Button>
      </Flex>
    </>
  );
}
