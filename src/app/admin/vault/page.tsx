import { redirect } from 'next/navigation';
import { AdminShell } from '../components/admin-shell';
import { Card, PageHeader, Table, Badge } from '../components/ui';
import { listFolders, listTags, listFileClassifications } from '@/lib/documents/classification-service';
import { requireAppSession } from '@/lib/security/session';
import { FolderForm } from './components/folder-form';
import { TagForm } from './components/tag-form';
import { MoveFileForm } from './components/move-file-form';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default async function AdminVaultPage() {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) redirect('/admin');

  const [folders, tags, classifications] = await Promise.all([
    listFolders(session, workspaceId),
    listTags(session, workspaceId),
    listFileClassifications(session, workspaceId),
  ]);

  return (
    <AdminShell>
      <PageHeader
        title="Phân loại vault"
        description="Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý. Chỉ quản trị viên mới thấy mục này."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <Card>
          <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Thư mục</h2>

          <FolderForm folders={folders.map((f) => ({ id: f.id, name: f.name }))} />

          {folders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
              Chưa có thư mục nào. Tạo thư mục đầu tiên để bắt đầu phân loại.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {folders.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#0F172A]">{f.name}</span>
                    {f.parentId && <span className="text-[12px] text-[#64748B]">trong thư mục cha</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{f._count.vaultFileFolders} tệp</Badge>
                    {f._count.children > 0 && <Badge tone="info">{f._count.children} thư mục con</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Thẻ phân loại</h2>

          <TagForm />

          {tags.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
              Chưa có thẻ nào. Tạo thẻ đầu tiên để gắn nhãn hồ sơ.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {tags.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#0F172A]">{t.label}</span>
                    <span className="font-mono text-[12px] text-[#64748B]">{t.key}</span>
                  </div>
                  <Badge tone="neutral">{t._count.vaultFileTags} tệp</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Tệp trong vault</h2>

        {classifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
            Chưa có tệp nào trong vault này.
          </p>
        ) : (
          <Table headers={['Tên tệp', 'Thư mục', 'Thẻ', 'Cập nhật', 'Hành động']}>
            {classifications.map((c) => (
              <tr key={c.vaultFile.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 text-[14px] font-semibold text-[#0F172A]">
                  {c.vaultFile.filename ?? '(không tên)'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.folders.length === 0 ? (
                      <span className="text-[12px] text-[#94A3B8]">—</span>
                    ) : (
                      c.folders.map((f) => (
                        <Badge key={f.id} tone="info">
                          {f.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.length === 0 ? (
                      <span className="text-[12px] text-[#94A3B8]">—</span>
                    ) : (
                      c.tags.map((t) => (
                        <Badge key={t.id} tone="accent">
                          {t.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#475569]">{formatDate(c.vaultFile.createdAt)}</td>
                <td className="px-4 py-3">
                  <MoveFileForm
                    vaultFileId={c.vaultFile.id}
                    folders={folders.map((f) => ({ id: f.id, name: f.name }))}
                    tags={tags.map((t) => ({ id: t.id, key: t.key, label: t.label }))}
                    appliedTags={c.tags.map((t) => ({ id: t.id, key: t.key, label: t.label }))}
                  />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </AdminShell>
  );
}
