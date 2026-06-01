import { notFound } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Badge, Card, PageHeader } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { getTemplatesForGeneration } from '@/lib/documents/template-service';
import { listVaultFiles } from '@/lib/documents/vault-service';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import GenerateDraftForm from './components/generate-draft-form';
import DocumentVersionsList from './components/document-versions';
import VaultFilesList from './components/vault-files';
import { CloseDeliveredForm, DeliverForm } from './components/delivery-actions';

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ kiểm tra chất lượng', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa nội bộ', tone: 'warning' },
  approved: { label: 'Đã được duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao tài liệu', tone: 'outline' },
  closed: { label: 'Đã đóng hồ sơ', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (value == null || value === '') return 'Chưa có thông tin';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function SpecialistRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
      createdBy: { select: { name: true, email: true } },
      intakeSubmission: { select: { matterTypeKey: true, answerLabels: true, answers: true } },
      vaultFiles: { select: { id: true, filename: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      documents: {
        select: {
          id: true,
          documentVersions: {
            select: {
              id: true,
              templateId: true,
              templateVersion: true,
              status: true,
              generatedContent: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
  if (!request) notFound();

  const status = statusLabels[request.status];
  const answers = asObject(request.intakeSubmission?.answers);
  const answerLabels = asObject(request.intakeSubmission?.answerLabels);
  const summaryRows = Object.entries(answers).map(([key, value]) => ({
    key,
    label: typeof answerLabels[key] === 'string' ? answerLabels[key] as string : key,
    value: formatValue(value),
  }));

  // Load templates and vault files server-side
  const matterTypeKey = request.intakeSubmission?.matterTypeKey ?? '';
  const templates = matterTypeKey
    ? await getTemplatesForGeneration(session, request.workspaceId, matterTypeKey).catch(() => [])
    : [];

  const allVaultFiles = await listVaultFiles(session, requestId).catch(() => []);

  // Flatten document versions with template info
  const documentVersions = request.documents.flatMap((doc) =>
    doc.documentVersions.map((v) => ({
      ...v,
      template: { label: '', version: v.templateVersion },
    })),
  );

  // Enrich versions with template labels
  const templateIds = [...new Set(documentVersions.map((v) => v.templateId))];
  const templateMap = new Map(
    templates.map((t) => [t.id, { label: t.label, version: t.version }]),
  );
  if (templateIds.length > 0) {
    const dbTemplates = await prisma.documentTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, label: true, version: true },
    });
    for (const t of dbTemplates) {
      templateMap.set(t.id, { label: t.label, version: t.version });
    }
  }

  const enrichedVersions = documentVersions.map((v) => ({
    ...v,
    template: templateMap.get(v.templateId) ?? { label: 'Unknown', version: v.templateVersion },
  }));

  const showDraftSection = request.status === 'assigned' || request.status === 'in_progress';

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader title="Chi tiết yêu cầu" description="Thông tin tiếp nhận và metadata tệp hỗ trợ cho chuyên viên xử lý." />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Yêu cầu</p>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{request.title}</h1>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Khách hàng</p>
            <p className="mt-2 text-[16px] leading-[1.5] text-[#0F172A]">{request.createdBy.name}</p>
            <p className="text-[14px] leading-[1.4] text-[#475569]">{request.createdBy.email}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Loại vụ việc</p>
            <p className="mt-2 text-[16px] leading-[1.5] text-[#0F172A]">{request.intakeSubmission?.matterTypeKey ?? 'Chưa có loại vụ việc'}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tóm tắt thông tin tiếp nhận</h2>
        {summaryRows.length > 0 ? (
          <dl className="space-y-3">
            {summaryRows.map((row) => (
              <div key={row.key} className="rounded-xl border border-[#E2E8F0] p-4">
                <dt className="text-[14px] font-semibold leading-[1.4] text-[#475569]">{row.label}</dt>
                <dd className="mt-2 text-[16px] leading-[1.5] text-[#0F172A]">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-[#E2E8F0] p-4 text-[16px] leading-[1.5] text-[#475569]">Chưa có thông tin tiếp nhận có cấu trúc.</p>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tệp khách hàng đã gửi</h2>
        {request.vaultFiles.length > 0 ? (
          <ul className="space-y-3">
            {request.vaultFiles.map((file) => (
              <li key={file.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <p className="text-[16px] font-normal leading-[1.5] text-[#0F172A]">{file.filename}</p>
                <p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Ngày gửi: {formatDate(file.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-[#E2E8F0] p-4 text-[16px] leading-[1.5] text-[#475569]">Khách hàng chưa gửi tệp hỗ trợ.</p>
        )}
      </Card>

      {showDraftSection && (
        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tạo bản nháp</h2>
          {templates.length === 0 ? (
            <p className="rounded-xl border border-[#E2E8F0] p-4 text-[16px] leading-[1.5] text-[#475569]">
              Chưa có mẫu tài liệu nào cho loại vụ việc này.
            </p>
          ) : (
            <GenerateDraftForm
              requestId={requestId}
              templates={templates.map((t) => ({
                id: t.id,
                matterTypeKey: t.matterTypeKey,
                version: t.version,
                status: t.status,
                label: t.label,
                description: t.description,
                variableSchema: t.variableSchema as unknown as import('@/lib/documents/template-service').TemplateVariable[],
                content: t.content,
              }))}
              initialAnswers={answers}
            />
          )}
        </Card>
      )}

      {enrichedVersions.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">
            Các phiên bản tài liệu
            <span className="ml-2 text-[16px] font-normal text-[#475569]">
              (Có {enrichedVersions.length} phiên bản)
            </span>
          </h2>
          <DocumentVersionsList
            documentVersions={enrichedVersions}
            requestId={requestId}
            requestStatus={request.status}
          />
        </Card>
      )}

      {(request.status === 'approved' || request.status === 'delivered') && (
        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Giao và đóng hồ sơ</h2>
          {request.status === 'approved' ? <DeliverForm requestId={request.id} /> : null}
          {request.status === 'delivered' ? <CloseDeliveredForm requestId={request.id} /> : null}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tệp trong kho lưu trữ</h2>
        <VaultFilesList vaultFiles={allVaultFiles} />
      </Card>
    </main>
  );
}
