import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';

const workspaces = [
  { name: 'Công ty An Phát', slug: 'an-phat', members: '3 thành viên', status: 'Đang hoạt động' },
  { name: 'Công ty Minh Khang', slug: 'minh-khang', members: '2 thành viên', status: 'Đang hoạt động' },
  { name: 'Workspace nội bộ', slug: 'internal', members: '4 thành viên', status: 'Đang hoạt động' },
];

export default function WorkspacesPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Workspace khách hàng"
        description="Mỗi SME có workspace riêng để hiển thị membership và giảm rủi ro lộ dữ liệu giữa tenant."
        action={<Button>Tạo workspace</Button>}
      />

      <Card className="space-y-3">
        <h2 className="text-[20px] font-semibold leading-[1.2]">Ranh giới quyền truy cập</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Bạn không có quyền xem nội dung này. Nếu cần truy cập, hãy liên hệ quản trị viên.
        </p>
      </Card>

      <Table headers={['Tên workspace', 'Slug', 'Thành viên', 'Trạng thái']}>
        {workspaces.map((workspace) => (
          <tr key={workspace.slug} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{workspace.name}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{workspace.slug}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{workspace.members}</td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone="accent">{workspace.status}</Badge></td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
