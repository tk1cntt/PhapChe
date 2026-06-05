import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Tag, Button, Card, Table, Typography, Flex } from 'antd';
import { listTemplates } from '@/lib/documents/template-service';
import { requireAppSession } from '@/lib/security/session';

const MATTER_TYPE_LABELS: Record<string, string> = {
  labor_contract: 'Hợp đồng lao động',
  agency_contract: 'Hợp đồng đại lý',
  trademark_registration: 'Đăng ký nhãn hiệu',
  unsupported: 'Khác / Chưa rõ',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  deprecated: 'Không còn sử dụng',
};

const STATUS_TONES: Record<string, 'neutral' | 'info' | 'accent' | 'destructive'> = {
  draft: 'neutral',
  approved: 'info',
  published: 'accent',
  deprecated: 'destructive',
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  accent: 'cyan',
  destructive: 'red',
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function TemplatesPage() {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const workspaceId = session.activeWorkspaceId;
  const templates = await listTemplates(session, workspaceId);

  // Group by matterTypeKey
  const grouped = new Map<string, typeof templates>();
  for (const t of templates) {
    if (!grouped.has(t.matterTypeKey)) grouped.set(t.matterTypeKey, []);
    grouped.get(t.matterTypeKey)!.push(t);
  }

  type TemplateItem = (typeof templates)[number];

  const templateColumns = [
    {
      title: 'Phiên bản',
      key: 'version',
      render: (_: unknown, record: TemplateItem, index: number) => (
        <>
          v{record.version}
          {index === 0 && <span className="ml-1 text-[#64748B]">(Mới nhất)</span>}
        </>
      ),
      width: 140,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: TemplateItem) => (
        <Tag color={toneToColor[STATUS_TONES[record.status]] ?? 'default'}>{STATUS_LABELS[record.status]}</Tag>
      ),
      width: 150,
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (_: unknown, record: TemplateItem) => {
        if (!record.description) return '-';
        return record.description.length > 80 ? record.description.slice(0, 80) + '...' : record.description;
      },
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_: unknown, record: TemplateItem) => formatDate(record.createdAt as Date),
      width: 130,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: TemplateItem) => (
        <Flex align="center" gap={8}>
          <Link href={`/admin/templates/${record.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
            Chi tiết
          </Link>
          {record.status === 'draft' && (
            <Link href={`/admin/templates/${record.id}?action=edit`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              Sửa
            </Link>
          )}
          {(record.status === 'published' || record.status === 'approved') && (
            <Link href={`/admin/templates/${record.id}?action=new_version`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              Tạo phiên bản mới
            </Link>
          )}
        </Flex>
      ),
      width: 250,
    },
  ];

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
          <p className="py-8 text-center text-[14px] text-[#64748B]">Chưa có mẫu tài liệu nào. Tạo mẫu đầu tiên.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([matterTypeKey, items]) => {
            const label = MATTER_TYPE_LABELS[matterTypeKey] ?? matterTypeKey;
            return (
              <div key={matterTypeKey}>
                <h2 className="mb-2 text-[16px] font-semibold text-[#0F172A]">{label}</h2>
                <Table
                  dataSource={items}
                  rowKey="id"
                  columns={templateColumns}
                  pagination={false}
                  size="middle"
                  bordered
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
