'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Typography, Flex, Spin } from 'antd';
import AdminTemplatesTable from './AdminTemplatesTable';

const { Title, Paragraph } = Typography;

const MATTER_TYPE_LABELS: Record<string, string> = {
  labor_contract: 'Hợp đồng lao động',
  agency_contract: 'Hợp đồng đại lý',
  trademark_registration: 'Đăng ký nhãn hiệu',
  unsupported: 'Khác / Chưa rõ',
};

export default function TemplatesPageClient() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
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

  // Group by matterTypeKey
  const grouped = new Map<string, typeof templates>();
  for (const t of templates) {
    if (!grouped.has(t.matterTypeKey)) grouped.set(t.matterTypeKey, []);
    grouped.get(t.matterTypeKey)!.push(t);
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              Quản lý mẫu tài liệu
            </Title>
            <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              Tạo, chỉnh sửa và phiên bản hóa mẫu tài liệu pháp lý
            </Paragraph>
          </Flex>
          <Link href="/admin/templates/new">
            <Button type="primary">+ Tạo mẫu mới</Button>
          </Link>
        </Flex>
      </Flex>

      {templates.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 14 }}>
            Chưa có mẫu tài liệu nào. Tạo mẫu đầu tiên.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...grouped.entries()].map(([matterTypeKey, items]) => {
            const label = MATTER_TYPE_LABELS[matterTypeKey] ?? matterTypeKey;
            return (
              <div key={matterTypeKey}>
                <h2 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>
                  {label}
                </h2>
                <AdminTemplatesTable items={items} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
