import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
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

  return (
    <AdminShell>
      <PageHeader
        title="Quản lý mẫu tài liệu"
        description="Tạo, chỉnh sửa và phiên bản hóa mẫu tài liệu pháp lý"
        action={
          <Link href="/admin/templates/new">
            <Button>+ Tạo mẫu mới</Button>
          </Link>
        }
      />

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
                <Table headers={['Phiên bản', 'Trạng thái', 'Mô tả', 'Ngày tạo', 'Hành động']}>
                  {items.map((template, idx) => (
                    <tr key={template.id} className="hover:bg-[#F1F5F9]">
                      <td className="whitespace-nowrap px-4 py-3 text-[14px] font-medium">
                        v{template.version}
                        {idx === 0 && <span className="ml-1 text-[#64748B]">(Mới nhất)</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={STATUS_TONES[template.status]}>{STATUS_LABELS[template.status]}</Badge>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-[14px] text-[#64748B]">
                        {template.description ? (template.description.length > 80 ? template.description.slice(0, 80) + '...' : template.description) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[14px] text-[#475569]">{formatDate(template.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/templates/${template.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
                            Chi tiết
                          </Link>
                          {template.status === 'draft' && (
                            <Link href={`/admin/templates/${template.id}?action=edit`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
                              Sửa
                            </Link>
                          )}
                          {template.status === 'published' || template.status === 'approved' ? (
                            <Link href={`/admin/templates/${template.id}?action=new_version`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
                              Tạo phiên bản mới
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}