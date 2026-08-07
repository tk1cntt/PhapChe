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
    openAnnotations: annotations.filter((a) => a.status === 'open').length,
  };

  return { content, summary };
}

// ── POST ───────────────────────────────────────────────────

// Extracted helpers (placed above the POST handler):

async function fetchReportData(requestId: string, userId: string) {
  const [
    legalRequest,
    rawAnnotations,
    reviewStatuses,
    vaultFiles,
    documents,
  ] = await Promise.all([
    prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { title: true, workspaceId: true },
    }),
    prisma.documentAnnotation.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: userId },
      select: { fileKey: true, status: true },
    }),
    prisma.vaultFile.findMany({
      where: { requestId, deletedAt: null },
      include: { file: { select: { originalName: true, mimeType: true } } },
    }),
    prisma.document.findMany({
      where: { requestId, deletedAt: null },
      select: { id: true, title: true },
    }),
  ]);

  return { legalRequest, rawAnnotations, reviewStatuses, vaultFiles, documents };
}

function assembleReportData(
  rawAnnotations: Awaited<ReturnType<typeof fetchReportData>>['rawAnnotations'],
  reviewStatuses: Awaited<ReturnType<typeof fetchReportData>>['reviewStatuses'],
  vaultFiles: Awaited<ReturnType<typeof fetchReportData>>['vaultFiles'],
  documents: Awaited<ReturnType<typeof fetchReportData>>['documents'],
) { /* ... existing assembly logic ... */ }

    // Try LLM if configured, otherwise template
    let content: string;
    let summary: Record<string, number>;

    const useAi = _request.nextUrl.searchParams.get('useAi') === 'true';

    let content: string;
    let summary: Record<string, number>;

    if (useAi && isLlmConfigured()) {
      const aiReport = await tryGenerateAiReport(
        legalRequest.title,
        files,
        annotations,
        includeResolved,
      );
      if (aiReport) {
        content = aiReport.content;
        summary = aiReport.summary;
      } else {
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        content = report.content;
        summary = report.summary;
      }
    } else {
        annotations,
        includeResolved,
      );
      if (aiReport) {
        content = aiReport.content;
        summary = aiReport.summary;
      } else {
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        content = report.content;
        summary = report.summary;
      }
    } else {
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
const REPORT_AI_TEMPERATURE = 0.3;
const REPORT_AI_MAX_TOKENS = 4000;

// … then inside llmComplete call:
          temperature: REPORT_AI_TEMPERATURE,
          maxTokens: REPORT_AI_MAX_TOKENS,

// … then inside llmComplete call:
          temperature: REPORT_AI_TEMPERATURE,
          maxTokens: REPORT_AI_MAX_TOKENS,
        summary = buildReportSummary(files, annotations);
      } catch (err) {
        console.error('[Report API] LLM generation failed, falling back to template:', err);
        // Fallback to template on LLM error
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
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
        createdAt: (reportCreatedAt ?? new Date()).toISOString(),
      },
    });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Report API Error]', msg);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
