/**
 * POST /api/admin/requests/[id]/files/[fileId]/ai-review
 *
 * Trigger AI-powered inline document review with optional skill selection.
 *
 * Body (optional): { skill?: AgentSkill }
 *   - If skill is provided, runs that skill on the document.
 *   - Default: 'document-issue-analyzer' (inline annotations with line positions).
 *   - Other skills: return structured output without inline annotations.
 *
 * Response: { findings: MappedFinding[], annotationCount: number, timing: { totalMs: number } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { normalizeMarkdown, convertWithMarkItDown, isMarkItDownAvailable } from '@/lib/document';
import { getSkillExecutor, isAiReady } from '@/lib/ai/skill-executor';
import { getSystemPrompt } from '@/lib/ai/system-prompts';
import { splitMarkdownToLines, getLinesArray, fuzzyMatchPosition } from '@/lib/document/position-mapper';
import type { AgentSkill, SkillContext, LegalDomain } from '@/lib/ai/types';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
const MAX_DOC_CHARS = 40000; // Context window for AI — large enough for most legal docs

/** Skills that return line-positioned findings suitable for inline annotations */
export const INLINE_ANNOTATION_SKILLS: AgentSkill[] = ['document-issue-analyzer'];

/** Find domain for a skill via DOMAIN_SKILL_MAP */
function getDomainForSkill(skill: AgentSkill): LegalDomain {
  for (const [domain, skills] of Object.entries(skillDomainMap)) {
    if ((skills as AgentSkill[]).includes(skill)) return domain as LegalDomain;
  }
  return 'commercial-legal';
}

// Lightweight local DOMAIN_SKILL_MAP (avoids circular dependency)
const skillDomainMap: Record<string, AgentSkill[]> = {
  'commercial-legal': ['document-issue-analyzer', 'nda-reviewer', 'vendor-contract-reviewer', 'commercial-contract-drafter', 'commercial-contract-reviewer'],
  'corporate-legal': ['board-resolution-drafter', 'entity-compliance-checker', 'corporate-doc-generator', 'corporate-compliance-checker'],
  'employment-legal': ['labor-discipline-checker', 'internal-regulation-drafter', 'employment-contract-reviewer', 'employment-policy-checker'],
  'privacy-legal': ['dsar-response-drafter', 'privacy-compliance-checker', 'privacy-dpia-generator'],
  'product-legal': ['tos-generator', 'commercial-contract-reviewer', 'regulatory-gap-analyzer'],
  'regulatory-legal': ['compliance-gap-analyzer', 'regulatory-gap-analyzer', 'general-legal-researcher'],
  'ai-governance-legal': ['ai-impact-assessment', 'ai-governance-assessor'],
  'ip-legal': ['trademark-clearance', 'cease-desist-drafter', 'ip-trademark-search', 'ip-patent-analyzer'],
  'litigation-legal': ['demand-letter-drafter', 'litigation-strategist', 'litigation-risk-scorer'],
  'legal-clinic': ['client-letter-drafter', 'legal-memo-drafter', 'general-legal-researcher'],
  'law-student': ['general-legal-researcher'],
  'legal-builder-hub': ['general-legal-researcher', 'commercial-contract-drafter'],
  'external-plugins': ['general-legal-researcher'],
};

function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'NEXT_REDIRECT' === e.message;
}

function isBinaryFile(mimeType: string | null, filename: string | null): boolean {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType.startsWith('audio/')) return true;
    if (mimeType.startsWith('video/')) return true;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return true;
  }
  return false;
}

function isPdf(mimeType: string | null, filename: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  if (filename?.toLowerCase().endsWith('.pdf')) return true;
  return false;
}

// ── File Content Extraction (reuses preview pipeline) ──────────

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '|', RS: '\n' });
    if (csv.trim()) {
      parts.push(`## ${sheetName}\n\n${csv}`);
    }
  }
  return parts.join('\n\n');
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data, disableRange: true, disableStream: true }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as { str?: string }[])
        .map((item: { str?: string }) => item.str ?? '')
        .join(' ');
      pages.push(pageText);
    }
    return pages.join('\n\n').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

async function convertWithMarkItDownOrFallback(
  filePath: string,
  mimeType: string | null,
  filename: string | null,
  _fileType: string,
  fallback: () => Promise<string>,
): Promise<{ content: string; usedMarkitdown: boolean }> {
  if (await isMarkItDownAvailable()) {
    try {
      const result = await convertWithMarkItDown(filePath, mimeType ?? '', filename ?? '');
      if (result.success && result.markdown) {
        const normalized = normalizeMarkdown(result.markdown);
        return { content: normalized.content, usedMarkitdown: true };
      }
    } catch {
      // Fall through to fallback
    }
  }
  const content = await fallback();
  return { content, usedMarkitdown: false };
}

// ── Main Endpoint ──────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const startTime = Date.now();

  try {
    // ── Auth ──
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // ── Check AI available ──
    if (!isAiReady()) {
      return NextResponse.json(
        { error: 'AI_NOT_CONFIGURED', detail: 'Chưa cấu hình API key cho LLM.' },
        { status: 503 },
      );
    }

    const { id: requestId, fileId } = await params;
    if (!requestId || !fileId) {
      return NextResponse.json({ error: 'VALIDATION: missing ids' }, { status: 400 });
    }

    // ── Parse optional body for skill selection ──
    let selectedSkill: AgentSkill = 'document-issue-analyzer';
    try {
      const text = await _request.text();
      if (text) {
        const body = JSON.parse(text);
        if (body?.skill && typeof body.skill === 'string') {
          const validSkills = new Set(Object.values(skillDomainMap).flat());
          if (validSkills.has(body.skill)) {
            selectedSkill = body.skill as AgentSkill;
          }
        }
      }
    } catch {
      // No body or empty body — use default skill
    }

    // ── Load request ──
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { title: true, workspaceId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // ── Load document content ──
    let rawContent: string;
    let docTitle: string;
    let mimeType: string | null = null;

    if (fileId.startsWith('gen_')) {
      // Generated document
      const documentId = fileId.slice(4);
      const doc = await prisma.document.findFirst({
        where: { id: documentId, requestId, deletedAt: null },
        include: {
          documentVersions: { orderBy: { createdAt: 'desc' }, take: 1, select: { generatedContent: true } },
        },
      });
      if (!doc) return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
      rawContent = doc.documentVersions[0]?.generatedContent ?? '';
      docTitle = doc.title;
      mimeType = 'text/markdown';
    } else if (fileId.startsWith('vf_')) {
      // Uploaded file
      const vaultFileId = fileId.slice(3);
      const vaultFile = await prisma.vaultFile.findFirst({
        where: { id: vaultFileId, requestId, deletedAt: null },
        include: { file: { select: { objectKey: true, mimeType: true, originalName: true } } },
      });
      if (!vaultFile) return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });

      docTitle = vaultFile.file?.originalName ?? vaultFile.filename ?? 'Tài liệu';
      mimeType = vaultFile.file?.mimeType ?? vaultFile.contentType ?? null;

      // Check binary
      if (isBinaryFile(mimeType, docTitle)) {
        return NextResponse.json(
          { error: 'UNSUPPORTED_FILE_TYPE', detail: 'Không thể phân tích file ảnh, audio, video hoặc binary.' },
          { status: 400 },
        );
      }

      const objectKey = vaultFile.file?.objectKey ?? vaultFile.storageKey;
      if (!objectKey) {
        return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
      }
      if (objectKey.includes('..')) {
        return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
      }

      const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
      const fullPath = join(storageRoot, objectKey);
      if (!existsSync(fullPath)) {
        return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
      }

      const buffer = await readFile(fullPath);

      // DOCX
      if (mimeType?.includes('wordprocessingml') || docTitle.toLowerCase().endsWith('.docx')) {
        const result = await convertWithMarkItDownOrFallback(fullPath, mimeType, docTitle, 'docx', () => extractDocxText(buffer));
        rawContent = result.content;
      } else if (mimeType?.includes('spreadsheetml') || docTitle.toLowerCase().endsWith('.xlsx')) {
        rawContent = await extractXlsxText(buffer);
      } else if (isPdf(mimeType, docTitle)) {
        // PDF: try MarkItDown first, fallback pdfjs
        const isRealPdf = buffer.length >= 5 && buffer[0] === 0x25 && buffer[1] === 0x50;
        if (!isRealPdf) {
          rawContent = buffer.toString('utf-8').trim();
        } else {
          const result = await convertWithMarkItDownOrFallback(fullPath, mimeType, docTitle, 'pdf', () => extractPdfText(buffer));
          rawContent = result.content;
        }
      } else {
        // Plain text
        rawContent = buffer.toString('utf-8');
      }
    } else {
      return NextResponse.json({ error: 'VALIDATION: invalid fileId prefix' }, { status: 400 });
    }

    // Truncate
    if (rawContent.length > MAX_DOC_CHARS) {
      rawContent = rawContent.slice(0, MAX_DOC_CHARS) + '\n\n... [tài liệu đã được cắt bớt để phân tích]';
    }

    if (!rawContent.trim()) {
      return NextResponse.json(
        { error: 'EMPTY_DOCUMENT', detail: 'Tài liệu không có nội dung text để phân tích.' },
        { status: 400 },
      );
    }

    // ── Prepare line-numbered document for AI ──
    const numberedContent = splitMarkdownToLines(rawContent);
    const linesArray = getLinesArray(rawContent);

    // ── Execute AI skill ──
    const skill = selectedSkill;
    const domain = getDomainForSkill(skill);
    const context: SkillContext = {
      matterTypeKey: 'commercial',
      domain,
      requestContext: {
        title: legalRequest.title,
        documentContent: numberedContent,
      },
      locale: 'vi',
    };

    const executor = getSkillExecutor({ enableRag: false });
    const result = await executor.execute(skill, context);

    // ── Parse AI findings ──
    const isInlineSkill = INLINE_ANNOTATION_SKILLS.includes(skill);
    const aiFindings = (result.output?.findings as Array<Record<string, unknown>>) ?? [];
    const mappedFindings: Array<{
      severity: string;
      lineStart?: number;
      lineEnd?: number;
      matchedText?: string;
      issue: string;
      recommendation: string;
      legalBasis: string;
      confidence: number;
      annotationId?: string;
    }> = [];

    // ── Delete old AI annotations before creating new ones ──
    await prisma.documentAnnotation.deleteMany({
      where: {
        requestId,
        fileKey: fileId,
        aiGenerated: true,
      },
    });

    // ── Create annotations from findings (both inline & non-inline skills) ──
    for (const finding of aiFindings) {
      const rawSeverity = (finding.severity as string) ?? 'info';
      const issue = (finding.issue as string) ?? '';
      const recommendation = (finding.recommendation as string) ?? '';
      const legalBasis = (finding.legalBasis as string) ?? '';
      const clause = (finding.clause as string) ?? '';

      // Map AI severity → Prisma severity (Prisma chỉ chấp nhận info|warning|critical)
      const mappedSeverity = rawSeverity === 'critical' ? 'critical'
        : rawSeverity === 'high' ? 'critical'
        : rawSeverity === 'medium' ? 'warning'
        : 'info';

      // Build content
      const parts = [`**Vấn đề:** ${issue}`];
      if (clause && clause !== 'N/A') parts.unshift(`**Điều khoản:** ${clause}`);
      if (recommendation) parts.push(`\n**Đề xuất:** ${recommendation}`);
      if (legalBasis && legalBasis !== 'N/A') parts.push(`\n**Căn cứ:** ${legalBasis}`);
      const annotationContent = parts.join('');

      // Position: only for inline skills with line info
      let position: Record<string, unknown> | undefined;
      let confidence = result.confidence;
      let lineStart: number | undefined;
      let lineEnd: number | undefined;
      let matchedText: string | undefined;

      if (isInlineSkill) {
        const aiLineStart = Number(finding.lineStart) || 1;
        const snippet = (finding.matchedText as string) ?? '';
        const mapped = fuzzyMatchPosition(snippet, linesArray, aiLineStart);
        lineStart = mapped.lineStart;
        lineEnd = mapped.lineEnd;
        matchedText = mapped.matchedText.substring(0, 200);
        confidence = mapped.confidence;
        position = {
          line: lineStart,
          lineStart,
          lineEnd,
          snippet: matchedText,
        };
      }

      try {
        const annotation = await prisma.documentAnnotation.create({
          data: {
            requestId,
            fileKey: fileId,
            authorId: session.userId,
            content: annotationContent,
            severity: mappedSeverity,
            category: 'issue',
            position: (position ?? undefined) as any,
            aiGenerated: true,
            aiConfidence: confidence,
          },
        });

        mappedFindings.push({
          severity: rawSeverity,
          lineStart,
          lineEnd,
          matchedText,
          issue,
          recommendation,
          legalBasis,
          confidence,
          annotationId: annotation.id,
        });
      } catch (createErr) {
        console.error('[AI Review] Failed to create annotation:', createErr);
      }
    }

    // ── Update review status ──
    if (mappedFindings.length > 0) {
      await prisma.documentReviewStatus.upsert({
        where: {
          requestId_fileKey_reviewerId: { requestId, fileKey: fileId, reviewerId: session.userId },
        },
        create: {
          requestId,
          fileKey: fileId,
          reviewerId: session.userId,
          status: 'has_issues',
        },
        update: { status: 'has_issues' },
      });
    } else {
      await prisma.documentReviewStatus.deleteMany({
        where: { requestId, fileKey: fileId, reviewerId: session.userId },
      });
    }

    const totalMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        findings: mappedFindings,
        annotationCount: mappedFindings.length,
        overallRisk: result.output?.overallRisk ?? 'unknown',
        summary: result.summary,
        timing: { totalMs },
      },
    });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Review Error]', message);

    // Phân biệt credential/config errors (503) vs LLM errors (502) vs generic (500)
    if (message.includes('LLM_API_KEY_MISSING') || message.includes('No active credentials') || message.includes('model_not_found')) {
      return NextResponse.json(
        { error: 'AI_NOT_CONFIGURED', detail: 'Chưa cấu hình API key hoặc model cho LLM. Kiểm tra OPENAI_API_KEY, OPENAI_BASE_URL, LLM_MODEL trong .env.' },
        { status: 503 },
      );
    }

    if (message.includes('LLM_API_ERROR') || message.includes('LLM_RATE_LIMIT') || message.includes('LLM_MAX_RETRIES')) {
      return NextResponse.json(
        { error: 'AI_SERVICE_ERROR', detail: 'Dịch vụ AI gặp lỗi, vui lòng thử lại sau.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: 'AI_REVIEW_FAILED', detail: message },
      { status: 500 },
    );
  }
}
