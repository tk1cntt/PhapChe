import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Typography, Flex } from 'antd';
import { listTemplates } from '@/lib/documents/template-service';
import { requireAppSession } from '@/lib/security/session';
import AdminTemplatesTable from './AdminTemplatesTable';

const MATTER_TYPE_LABELS: Record<string, string> = {
  labor_contract: 'Hợp đồng lao động',
  agency_contract: 'Hợp đồng đại lý',
  trademark_registration: 'Đăng ký nhãn hiệu',
  unsupported: 'Khác / Chưa rõ',
};

export default async function TemplatesPage() {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const workspaceId = session.activeWorkspaceId;
  const templates = await listTemplates(session, workspaceId ?? '');

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
            <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              Quản lý mẫu tài liệu
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              Tạo, chỉnh sửa và phiên bản hóa mẫu tài liệu pháp lý
            </Typography.Paragraph>
          </Flex>
          <Link href="/admin/templates/new">
            <Button type="primary">+ Tạo mẫu mới</Button>
          </Link>
        </Flex>
      </Flex>

      {templates.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 14 }}>Chưa có mẫu tài liệu nào. Tạo mẫu đầu tiên.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...grouped.entries()].map(([matterTypeKey, items]) => {
            const label = MATTER_TYPE_LABELS[matterTypeKey] ?? matterTypeKey;
            return (
              <div key={matterTypeKey}>
                <h2 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{label}</h2>
                <AdminTemplatesTable items={items} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
