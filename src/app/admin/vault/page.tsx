import { redirect } from 'next/navigation';
import { Card, Typography, Flex, Row, Col } from 'antd';
import { listFolders, listTags, listFileClassifications } from '@/lib/documents/classification-service';
import { requireAppSession } from '@/lib/security/session';
import { FolderForm } from './components/folder-form';
import { TagForm } from './components/tag-form';
import { VaultFilesTable } from './VaultFilesTable';

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
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Phân loại vault
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý. Chỉ quản trị viên mới thấy mục này.
        </Typography.Paragraph>
      </Flex>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card>
            <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Thư mục</h2>

            <FolderForm folders={folders.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))} />

            {folders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
                Chưa có thư mục nào. Tạo thư mục đầu tiên để bắt đầu phân loại.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {folders.map((f: { id: string; name: string; parentId: string | null; _count: { vaultFileFolders: number; children: number } }) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[#0F172A]">{f.name}</span>
                      {f.parentId && <span className="text-[12px] text-[#64748B]">trong thư mục cha</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#64748B]">{f._count.vaultFileFolders} tệp</span>
                      {f._count.children > 0 && <span className="rounded bg-[#E0F2FE] px-2 py-0.5 text-[12px] text-[#0369A1]">{f._count.children} thư mục con</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Thẻ phân loại</h2>

            <TagForm />

            {tags.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
                Chưa có thẻ nào. Tạo thẻ đầu tiên để gắn nhãn hồ sơ.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {tags.map((t: { id: string; label: string; key: string; _count: { vaultFileTags: number } }) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[#0F172A]">{t.label}</span>
                      <span className="font-mono text-[12px] text-[#64748B]">{t.key}</span>
                    </div>
                    <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#64748B]">{t._count.vaultFileTags} tệp</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>

      <Card>
        <h2 className="mb-3 text-[18px] font-semibold leading-[1.2] text-[#0F172A]">Tệp trong vault</h2>

        {classifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-6 text-center text-[14px] text-[#64748B]">
            Chưa có tệp nào trong vault này.
          </p>
        ) : (
          <VaultFilesTable
            classifications={classifications}
            folders={folders.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))}
            tags={tags.map((t: { id: string; key: string; label: string }) => ({ id: t.id, key: t.key, label: t.label }))}
          />
        )}
      </Card>
    </>
  );
}
