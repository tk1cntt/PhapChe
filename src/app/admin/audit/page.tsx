import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { AdminShell } from '../components/admin-shell';
import { Badge, Card, PageHeader, Table } from '../components/ui';

export default async function AuditPage() {
  const session = await requireAppSession();

  const auditEvents = await prisma.auditEvent.findMany({
    where: session.activeWorkspaceId
      ? { workspaceId: session.activeWorkspaceId }
      : undefined,
    select: {
      id: true,
      actorId: true,
      workspaceId: true,
      action: true,
      targetType: true,
      targetId: true,
      correlationId: true,
      metadataSummary: true,
      createdAt: true,
      actor: { select: { email: true, name: true } },
      workspace: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AdminShell>
      <PageHeader
        title="Audit"
        description="Dòng thời gian thao tác quan trọng chỉ hiển thị định danh, action, mã tương quan và tóm tắt metadata an toàn."
      />

      <Card>
        <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          Không hiển thị nội dung pháp lý thô trong audit; dùng metadataSummary, identifier hoặc hash khi cần truy vết.
        </p>
      </Card>

      <Table headers={['Thời gian', 'Actor', 'Workspace', 'Hành động', 'Đối tượng', 'Mã tương quan', 'Tóm tắt metadata']}>
        {auditEvents.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-[14px] leading-[1.4] text-[#475569]">
              Chưa có sự kiện kiểm toán nào.
            </td>
          </tr>
        ) : (
          auditEvents.map((event) => (
            <tr key={event.id} className="hover:bg-[#F1F5F9]">
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">
                {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(event.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">
                {event.actor?.email ?? 'system'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">
                {event.workspace.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Badge tone="info">{event.action}</Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">
                {event.targetType}:{event.targetId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
                {event.correlationId ?? '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
                {event.metadataSummary ?? '-'}
              </td>
            </tr>
          ))
        )}
      </Table>
    </AdminShell>
  );
}
