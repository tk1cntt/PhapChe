import { AdminShell } from '../components/admin-shell';
import { Badge, Card, PageHeader, Table } from '../components/ui';

const auditEvents = [
  {
    time: '2026-05-26 09:00',
    actor: 'coordinator@example.com',
    workspace: 'Công ty An Phát',
    action: 'user.role_updated',
    target: 'user:user-123',
    correlationId: 'corr-001',
    metadataSummary: 'role=reviewer',
  },
  {
    time: '2026-05-26 09:05',
    actor: 'system',
    workspace: 'Công ty Minh Khang',
    action: 'request.status_changed',
    target: 'request:req-002',
    correlationId: 'corr-002',
    metadataSummary: 'triage -> assigned',
  },
];

export default function AuditPage() {
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
        {auditEvents.map((event) => (
          <tr key={event.correlationId} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.time}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.actor}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.workspace}</td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone="info">{event.action}</Badge></td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.target}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{event.correlationId}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{event.metadataSummary}</td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
