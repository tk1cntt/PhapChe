import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';

const roles = [
  { value: 'customer', label: 'Khách hàng', tone: 'neutral' as const },
  { value: 'specialist', label: 'Chuyên viên', tone: 'info' as const },
  { value: 'reviewer', label: 'Reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', label: 'Điều phối viên', tone: 'accent' as const },
  { value: 'super_admin', label: 'Super admin', tone: 'destructive' as const },
];

const users = [
  { name: 'Nguyễn An', email: 'an@example.com', role: 'customer', workspace: 'Công ty An Phát', status: 'Đang hoạt động' },
  { name: 'Trần Bình', email: 'binh@example.com', role: 'specialist', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Lê Chi', email: 'chi@example.com', role: 'reviewer', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Phạm Dũng', email: 'dung@example.com', role: 'coordinator_admin', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Võ Hà', email: 'ha@example.com', role: 'super_admin', workspace: 'Hệ thống', status: 'Đang hoạt động' },
];

function roleMeta(role: string) {
  return roles.find((item) => item.value === role) ?? roles[0];
}

export default function UsersPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Quản lý người dùng"
        description="Nền tảng quản trị 5 vai trò: customer, specialist, reviewer, coordinator_admin và super_admin."
        action={<Button>Tạo người dùng</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2]">Vai trò hệ thống</h2>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role.value} tone={role.tone}>{role.label} ({role.value})</Badge>
          ))}
        </div>
        <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          Thay đổi user/role/workspace gọi createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace và được ghi audit.
        </p>
      </Card>

      <Table headers={['Tên', 'Email', 'Vai trò', 'Workspace', 'Trạng thái']}>
        {users.map((user) => {
          const meta = roleMeta(user.role);
          return (
            <tr key={user.email} className="hover:bg-[#F1F5F9]">
              <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{user.name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{user.email}</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone={meta.tone}>{meta.label}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{user.workspace}</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="accent">{user.status}</Badge></td>
            </tr>
          );
        })}
      </Table>
    </AdminShell>
  );
}
