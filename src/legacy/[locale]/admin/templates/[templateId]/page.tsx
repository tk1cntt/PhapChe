import { notFound, redirect } from 'next/navigation';
import { Tag, Button, Card } from 'antd';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { updateTemplateAction, approveTemplateAction, publishTemplateAction, deprecateTemplateAction, createVersionAction } from './actions';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  deprecated: 'Không còn sử dụng',
};

const STATUS_TONES: Record<string, string> = {
  draft: 'default',
  approved: 'blue',
  published: 'cyan',
  deprecated: 'red',
};

const MATTER_TYPE_LABELS: Record<string, string> = {
  labor_contract: 'Hợp đồng lao động',
  agency_contract: 'Hợp đồng đại lý',
  trademark_registration: 'Đăng ký nhãn hiệu',
  unsupported: 'Khác / Chưa rõ',
};

type Props = { params: Promise<{ templateId: string }>; searchParams: Promise<{ action?: string }> };

export default async function TemplateDetailPage({ params, searchParams }: Props) {
  const { templateId } = await params;
  const { action } = await searchParams;
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      workspaceId: true,
      matterTypeKey: true,
      version: true,
      status: true,
      label: true,
      description: true,
      content: true,
      createdAt: true,
      previousVersionId: true,
    },
  });

  if (!template) notFound();

  // Edit mode for draft templates
  if (action === 'edit') {
    return (
      <>
        <div className="mb-6">
          <a href={`/admin/templates/${template.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
            &larr; Quay lại chi tiết
          </a>
        </div>
        <Card>
          <h1 className="mb-6 text-[24px] font-semibold leading-[1.2]">Chỉnh sửa mẫu tài liệu</h1>

          <form action={updateTemplateAction} className="space-y-6">
            <input type="hidden" name="templateId" value={template.id} />

            <div className="space-y-1.5">
              <label htmlFor="label" className="block text-[14px] font-semibold text-[#0F172A]">
                Tên mẫu <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="label"
                name="label"
                type="text"
                required
                defaultValue={template.label}
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] shadow-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-[14px] font-semibold text-[#0F172A]">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={template.description ?? ''}
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] shadow-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="block text-[14px] font-semibold text-[#0F172A]">
                Nội dung mẫu <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={16}
                defaultValue={template.content}
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-[#0F172A] shadow-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-6">
              <a href={`/admin/templates/${template.id}`} className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#475569] shadow-sm hover:bg-[#F8FAFC]">
                Hủy
              </a>
              <Button type="primary" htmlType="submit">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Card>
      </>
    );
  }

  // New version mode for published/approved templates
  if (action === 'new_version') {
    return (
      <>
        <div className="mb-6">
          <a href={`/admin/templates/${template.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
            &larr; Quay lại chi tiết
          </a>
        </div>
        <Card>
          <h1 className="mb-2 text-[24px] font-semibold leading-[1.2]">Tạo phiên bản mới</h1>
          <p className="mb-6 text-[14px] text-[#64748B]">
            Phiên bản mới sẽ bắt đầu ở trạng thái Nháp và liên kết với phiên bản {template.version} hiện tại.
          </p>

          <form action={createVersionAction} className="space-y-6">
            <input type="hidden" name="templateId" value={template.id} />
            <input type="hidden" name="baseVersion" value={template.version} />

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <h2 className="mb-2 text-[14px] font-semibold text-[#0F172A]">Nội dung phiên bản gốc (v{template.version})</h2>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[13px] text-[#475569]">{template.content}</pre>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="block text-[14px] font-semibold text-[#0F172A]">
                Nội dung phiên bản mới <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={16}
                defaultValue={template.content}
                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-[#0F172A] shadow-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-1"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-6">
              <a href={`/admin/templates/${template.id}`} className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#475569] shadow-sm hover:bg-[#F8FAFC]">
                Hủy
              </a>
              <Button type="primary" htmlType="submit">
                Tạo phiên bản v{template.version + 1}
              </Button>
            </div>
          </form>
        </Card>
      </>
    );
  }

  // View mode (default)
  const matterLabel = MATTER_TYPE_LABELS[template.matterTypeKey] ?? template.matterTypeKey;

  return (
    <>
      <div className="mb-6">
        <a href="/admin/templates" className="text-[14px] font-medium text-[#0F766E] hover:underline">
          &larr; Quay lại danh sách mẫu tài liệu
        </a>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-[24px] font-semibold leading-[1.2]">{template.label}</h1>
                <Tag color={STATUS_TONES[template.status]}>{STATUS_LABELS[template.status]}</Tag>
              </div>
              <p className="text-[14px] text-[#64748B]">
                {matterLabel} &bull; Phiên bản v{template.version} &bull;{' '}
                {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(template.createdAt)}
              </p>
            </div>
          </div>

          {template.description && <p className="mt-4 text-[14px] text-[#475569]">{template.description}</p>}

          <div className="mt-6 space-y-3">
            <h2 className="text-[16px] font-semibold text-[#0F172A]">Nội dung</h2>
            <pre className="overflow-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[13px] leading-relaxed text-[#0F172A] whitespace-pre-wrap">
              {template.content}
            </pre>
          </div>
        </Card>

        {/* Version lineage */}
        {template.previousVersionId && (
          <Card>
            <h2 className="mb-3 text-[16px] font-semibold text-[#0F172A]">Phiên bản trước</h2>
            <a href={`/admin/templates/${template.previousVersionId}`} className="flex items-center gap-2 text-[14px] font-medium text-[#0F766E] hover:underline">
              {template.previousVersionId}
            </a>
          </Card>
        )}

        {/* Action buttons */}
        <Card>
          <h2 className="mb-4 text-[16px] font-semibold text-[#0F172A]">Thao tác</h2>
          <div className="flex flex-wrap gap-3">
            {template.status === 'draft' && (
              <>
                <a href={`/admin/templates/${template.id}?action=edit`}>
                  <Button>Chỉnh sửa</Button>
                </a>
                <form action={approveTemplateAction} style={{ display: 'inline' }}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <Button htmlType="submit">
                    Phê duyệt
                  </Button>
                </form>
                <form action={publishTemplateAction} style={{ display: 'inline' }}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <Button type="primary" htmlType="submit">
                    Xuất bản
                  </Button>
                </form>
              </>
            )}
            {(template.status === 'approved' || template.status === 'published') && (
              <a href={`/admin/templates/${template.id}?action=new_version`}>
                <Button>Tạo phiên bản mới</Button>
              </a>
            )}
            {template.status !== 'deprecated' && (
              <form action={deprecateTemplateAction} style={{ display: 'inline' }}>
                <input type="hidden" name="templateId" value={template.id} />
                <Button danger htmlType="submit">
                  Không còn sử dụng
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
