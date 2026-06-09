'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Flex, Button, Space, Tag, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import AdminUsersTable from './AdminUsersTable';

const { Title, Paragraph } = Typography;

const roles = [
  { value: 'customer', labelKey: 'role_customer', tone: 'neutral' as const },
  { value: 'specialist', labelKey: 'role_specialist', tone: 'info' as const },
  { value: 'reviewer', labelKey: 'role_reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', labelKey: 'role_coordinator_admin', tone: 'accent' as const },
  { value: 'super_admin', labelKey: 'role_super_admin', tone: 'destructive' as const },
];

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
};

export default function UsersPageClient() {
  const t = useTranslations('AdminUsers');
  const pathname = usePathname();
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract locale from pathname: /en/admin/users -> en
    const locale = pathname.split('/')[1] || 'vi';
    fetch(`/${locale}/api/users`)
      .then((r) => r.json())
      .then((data) => {
        setDataSource(data);
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
        <Space orientation="vertical" size={16}>
          <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {t('systemRoles')}
          </Title>
          <Flex wrap="wrap" gap={8}>
            {roles.map((role) => (
              <Tag key={role.value} color={toneToColor[role.tone] ?? 'default'}>
                {t(role.labelKey)} ({role.value})
              </Tag>
            ))}
          </Flex>
          <Paragraph style={{ color: '#475569', margin: 0 }}>
            {t('roleChangeNote')}
          </Paragraph>
        </Space>
      </Card>

      <AdminUsersTable dataSource={dataSource} />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">{t('createUserButton')}</Button>
      </Flex>
    </>
  );
}
