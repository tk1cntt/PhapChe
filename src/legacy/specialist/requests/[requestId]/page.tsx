import { notFound } from 'next/navigation';
import type { RequestStatus } from '@/lib/types';
import { Tag, Card, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { getTemplatesForGeneration } from '@/lib/documents/template-service';
import { listVaultFiles } from '@/lib/documents/vault-service';
import { listDocumentVersions } from '@/lib/documents/draft-service';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import GenerateDraftForm from './components/generate-draft-form';
import DocumentVersionsList from './components/document-versions';
import VaultFilesList from './components/vault-files';
import { CloseDeliveredForm, DeliverForm } from './components/delivery-actions';

const { Title, Paragraph } = Typography;

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

const toneColorMap: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
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
    },
  });
  if (!request) notFound();

  const versionsFromService = await listDocumentVersions({ session, requestId }).catch(() => []);

  const status = statusLabels[request.status as RequestStatus];
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

  const enrichedVersions = versionsFromService.map((v) => ({
    id: v.id,
    templateId: v.templateId,
    templateVersion: v.templateVersion,
    status: v.status as import('@/lib/types').VersionStatus,
    generatedContent: v.generatedContent,
    createdAt: v.createdAt,
    template: { label: v.templateLabel, version: v.templateVersion },
  }));

  const showDraftSection = request.status === 'assigned' || request.status === 'in_progress';

  return (
    <>
      <Flex vertical gap={8} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Chi tiết yêu cầu</Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Thông tin tiếp nhận và metadata tệp hỗ trợ cho chuyên viên xử lý.
        </Paragraph>
      </Flex>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Yêu cầu</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0F172A', margin: 0 }}>{request.title}</h1>
          </div>
          <Tag color={toneColorMap[status.tone] ?? 'default'}>{status.label}</Tag>
        </div>
        <div className="grid gap-4 sm:grid-cols-2" style={{ marginTop: 16 }}>
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Khách hàng</p>
            <p style={{ fontSize: 16, color: '#0F172A', margin: 0 }}>{request.createdBy.name}</p>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{request.createdBy.email}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Loại vụ việc</p>
            <p style={{ fontSize: 16, color: '#0F172A', margin: 0 }}>{request.intakeSubmission?.matterTypeKey ?? 'Chưa có loại vụ việc'}</p>
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Tóm tắt thông tin tiếp nhận</Title>
        {summaryRows.length > 0 ? (
          <dl className="space-y-3">
            {summaryRows.map((row) => (
              <div key={row.key} className="rounded-xl border border-[#E2E8F0] p-4">
                <dt style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{row.label}</dt>
                <dd style={{ fontSize: 16, color: '#0F172A', margin: 0 }}>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-[#E2E8F0] p-4" style={{ fontSize: 16, color: '#475569', margin: 0 }}>
            Chưa có thông tin tiếp nhận có cấu trúc.
          </p>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Tệp khách hàng đã gửi</Title>
        {request.vaultFiles.length > 0 ? (
          <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {request.vaultFiles.map((file) => (
              <li key={file.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <p style={{ fontSize: 16, color: '#0F172A', margin: 0 }}>{file.filename}</p>
                <p style={{ fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 0 }}>
                  Ngày gửi: {formatDate(file.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-[#E2E8F0] p-4" style={{ fontSize: 16, color: '#475569', margin: 0 }}>
            Khách hàng chưa gửi tệp hỗ trợ.
          </p>
        )}
      </Card>

      {showDraftSection && (
        <Card style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Tạo bản nháp</Title>
          {templates.length === 0 ? (
            <p className="rounded-xl border border-[#E2E8F0] p-4" style={{ fontSize: 16, color: '#475569', margin: 0 }}>
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
                label: t.label_vi || t.matterTypeKey,
                description: t.description_vi || t.description_en || '',
                variableSchema: t.variableSchema as unknown as import('@/lib/documents/template-service').TemplateVariable[],
                content: t.content,
              }))}
              initialAnswers={answers}
            />
          )}
        </Card>
      )}

      {enrichedVersions.length > 0 && (
        <Card style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Các phiên bản tài liệu
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 400, color: '#475569' }}>
              (Có {enrichedVersions.length} phiên bản)
            </span>
          </Title>
          <DocumentVersionsList
            documentVersions={enrichedVersions}
            requestId={requestId}
            requestStatus={request.status}
          />
        </Card>
      )}

      {(request.status === 'approved' || request.status === 'delivered') && (
        <Card style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Giao và đóng hồ sơ</Title>
          {request.status === 'approved' ? <DeliverForm requestId={request.id} /> : null}
          {request.status === 'delivered' ? <CloseDeliveredForm requestId={request.id} /> : null}
        </Card>
      )}

      <Card style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Tệp trong kho lưu trữ</Title>
        <VaultFilesList vaultFiles={allVaultFiles} />
      </Card>
    </>
  );
}
