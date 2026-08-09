/**
 * POST /api/admin/requests/[id]/report — Tổng hợp annotations thành báo cáo review
 *
 * Có thể dùng LLM hoặc template-based generation.
 * Query params: ?useAi=true (mặc định false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { llmComplete, isLlmConfigured, DEFAULT_MODELS } from '@/lib/ai/llm-gateway';

function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'NEXT_REDIRECT' === e.message;
}

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── Helpers ────────────────────────────────────────────────

function buildTemplateReport(
  requestTitle: string,
  files: { fileKey: string; title: string; status: string }[],
  annotations: {
    fileKey: string;
    authorName: string;
    content: string;
    severity: string;
    category: string;
    status: string;
  }[],
  includeResolved: boolean,
): { content: string; summary: Record<string, number> } {
  const filteredAnnotations = includeResolved
    ? annotations
    : annotations.filter((a) => a.status === 'open');

  const severityLabels: Record<string, string> = {
    critical: '🔴 Nghiêm trọng',
    warning: '🟡 Cảnh báo',
    info: '🔵 Thông tin',
  };

  const categoryLabels: Record<string, string> = {
    issue: 'Vấn đề',
    suggestion: 'Đề xuất',
    question: 'Câu hỏi',
    comment: 'Nhận xét',
  };

  const totalFiles = files.length;
  const reviewedFiles = files.filter((f) => f.status !== 'pending').length;
  const totalAnnotations = filteredAnnotations.length;
  const criticalIssues = filteredAnnotations.filter((a) => a.severity === 'critical').length;
  const warnings = filteredAnnotations.filter((a) => a.severity === 'warning').length;
  const suggestions = filteredAnnotations.filter((a) => a.category === 'suggestion').length;
  const questions = filteredAnnotations.filter((a) => a.category === 'question').length;

  // Group annotations by file
  const byFile: Record<string, typeof filteredAnnotations> = {};
  for (const a of filteredAnnotations) {
    if (!byFile[a.fileKey]) byFile[a.fileKey] = [];
    byFile[a.fileKey].push(a);
  }

  let content = `# BÁO CÁO REVIEW TÀI LIỆU PHÁP LÝ\n\n`;
  content += `**Yêu cầu:** ${requestTitle}\n`;
  content += `**Ngày tạo:** ${new Date().toLocaleDateString('vi-VN')}\n\n`;
  content += `---\n\n`;

  content += `## 📊 Tổng quan\n\n`;
  content += `| Chỉ số | Giá trị |\n|--------|--------|\n`;
  content += `| Tổng số tài liệu | ${totalFiles} |\n`;
  content += `| Đã review | ${reviewedFiles} |\n`;
  content += `| Tổng ghi chú | ${totalAnnotations} |\n`;
  content += `| Vấn đề nghiêm trọng | ${criticalIssues} |\n`;
  content += `| Cảnh báo | ${warnings} |\n`;
  content += `| Đề xuất | ${suggestions} |\n`;
  content += `| Câu hỏi | ${questions} |\n\n`;

  content += `---\n\n`;

  for (const file of files) {
    const fileAnnotations = byFile[file.fileKey] ?? [];
    if (fileAnnotations.length === 0 && !includeResolved) continue;

    content += `## 📄 ${file.title}\n\n`;
    content += `**Trạng thái:** ${file.status === 'reviewed' ? '✅ Đã review' : file.status === 'has_issues' ? '⚠️ Có vấn đề' : '⏳ Chưa review'}\n\n`;

    if (fileAnnotations.length === 0) {
      content += `Không có ghi chú nào.\n\n`;
    } else {
      for (const a of fileAnnotations) {
        content += `### ${severityLabels[a.severity] ?? a.severity} — ${categoryLabels[a.category] ?? a.category}\n\n`;
        content += `> ${a.content}\n\n`;
        content += `*Người ghi chú: ${a.authorName}*\n\n`;
      }
    }
    content += `---\n\n`;
  }

  content += `\n*Báo cáo được tạo tự động từ hệ thống Pháp Chế.*\n`;

  const summary = {
    totalFiles,
    reviewedFiles,
    totalAnnotations,
    criticalIssues,
    warnings,
    suggestions,
    questions,
    openAnnotations: filteredAnnotations.length,
  };

  return { content, summary };
}

// ── POST ───────────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;

    let includeResolved = false;
    try {
      const body = await _request.json();
      includeResolved = body?.includeResolved === true;
    } catch {
      // no body, use defaults
    }

    // Fetch request info + workspace verification
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { title: true, workspaceId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Verify workspace access — prevent horizontal privilege escalation
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Fetch annotations
    const rawAnnotations = await prisma.documentAnnotation.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Fetch review statuses
    const reviewStatuses = await prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: session.userId },
      select: { fileKey: true, status: true },
    });

    // Fetch files from the unified API logic
    const vaultFiles = await prisma.vaultFile.findMany({
      where: { requestId, deletedAt: null },
      include: {
        file: { select: { originalName: true, mimeType: true } },
      },
    });
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      select: { id: true, title: true },
    });

    const statusMap: Record<string, string> = {};
    for (const s of reviewStatuses) {
      statusMap[s.fileKey] = s.status;
    }

    const files = [
      ...vaultFiles.map((vf) => ({
        fileKey: `vf_${vf.id}`,
        title: vf.file?.originalName ?? vf.filename ?? 'File tải lên',
        status: statusMap[`vf_${vf.id}`] ?? 'pending',
      })),
      ...documents.map((doc) => ({
        fileKey: `gen_${doc.id}`,
        title: doc.title,
        status: statusMap[`gen_${doc.id}`] ?? 'pending',
      })),
    ];

    const annotations = rawAnnotations.map((a) => ({
      fileKey: a.fileKey,
      authorName: a.author.name,
      content: a.content,
      severity: a.severity,
      category: a.category,
      status: a.status,
    }));

    // Try LLM if configured, otherwise template
    let content: string;
    let summary: Record<string, number>;

    const useAi = _request.nextUrl.searchParams.get('useAi') === 'true';
    if (useAi && isLlmConfigured()) {
      try {
        const annotationsText = annotations
          .filter((a) => includeResolved || a.status === 'open')
          .map((a) => `[${a.severity}][${a.category}] ${a.content} (file: ${a.fileKey}, by: ${a.authorName})`)
          .join('\n');

        const filesText = files.map((f) => `- ${f.title} (status: ${f.status})`).join('\n');

        const systemPrompt = `Bạn là trợ lý pháp lý chuyên nghiệp. Nhiệm vụ của bạn là tổng hợp các ghi chú review tài liệu pháp lý thành báo cáo chuyên nghiệp bằng tiếng Việt.

Báo cáo phải có cấu trúc:
1. Tổng quan (số liệu thống kê)
2. Chi tiết từng tài liệu với các vấn đề tìm thấy
3. Kết luận và khuyến nghị

Định dạng: Markdown.`;

        const userPrompt = `Hãy tạo báo cáo review cho yêu cầu pháp lý: "${legalRequest.title}"

## Danh sách tài liệu:
${filesText}

## Ghi chú review:
${annotationsText || 'Không có ghi chú nào.'}

Hãy tạo báo cáo bằng tiếng Việt, định dạng Markdown.`;

        const result = await llmComplete({
          model: DEFAULT_MODELS['gpt-4o-mini'],
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          maxTokens: 4000,
        });

        content = result.content ?? '';

        // Build summary
        const totalFiles = files.length;
        const reviewedFiles = files.filter((f) => f.status !== 'pending').length;
        summary = {
          totalFiles,
          reviewedFiles,
          totalAnnotations: annotations.length,
          criticalIssues: annotations.filter((a) => a.severity === 'critical').length,
          warnings: annotations.filter((a) => a.severity === 'warning').length,
          suggestions: annotations.filter((a) => a.category === 'suggestion').length,
          questions: annotations.filter((a) => a.category === 'question').length,
          openAnnotations: annotations.filter((a) => a.status === 'open').length,
        };
      } catch {
        // Fallback to template on LLM error
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        content = report.content;
        summary = report.summary;
      }
    } else {
      const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
      content = report.content;
      summary = report.summary;
    }

    return NextResponse.json({
      report: {
        id: `rpt_${Date.now()}`,
        title: `Báo cáo review — ${legalRequest.title}`,
        content,
        summary,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Report API Error]', msg);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
