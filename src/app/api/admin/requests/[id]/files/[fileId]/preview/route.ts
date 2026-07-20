/**
 * GET /api/admin/requests/[id]/files/[fileId]/preview — Trả về nội dung preview của file
 *
 * fileId format:
 *   "vf_<vaultFileId>" — uploaded file (trả về text hoặc info nếu binary)
 *   "gen_<documentId>" — generated document (trả về generatedContent)
 *
 * Response: { content: string, mimeType: string, title: string, isBinary: boolean, previewFormat: 'markdown'|'text', officeFileType?: 'docx'|'xlsx' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

const BINARY_EXTENSIONS = /\.(doc|pptx|ppt|xls|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;
const TEXT_EXTENSIONS = /\.(txt|md|json|xml|html|css|js|ts|jsx|tsx|yaml|yml|csv|log|sql|env)$/i;
const OFFICE_XML_EXTENSIONS = /\.(docx|xlsx)$/i;

function isBinaryPreview(mimeType: string | null, filename: string | null): boolean {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType.startsWith('audio/')) return true;
    if (mimeType.startsWith('video/')) return true;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return true;
  }
  if (filename && BINARY_EXTENSIONS.test(filename)) return true;
  return false;
}

function isOfficeXml(mimeType: string | null, filename: string | null): 'docx' | 'xlsx' | null {
  const docxMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const xlsxMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (mimeType) {
    if (docxMimes.includes(mimeType)) return 'docx';
    if (xlsxMimes.includes(mimeType)) return 'xlsx';
  }
  if (filename) {
    if (/\.docx$/i.test(filename)) return 'docx';
    if (/\.xlsx$/i.test(filename)) return 'xlsx';
  }
  return null;
}

function isPdf(mimeType: string | null, filename: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  if (filename && /\.pdf$/i.test(filename)) return true;
  return false;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // ── Node.js polyfills for pdfjs-dist DOM APIs ──
  // pdfjs-dist@6.x references these at module parse time; inject stubs before import
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // Minimal 2D matrix with a-f affine transform props (pdf.js only does multiplyByDOMMatrix)
    class DOMMatrixStub { a=1; b=0; c=0; d=1; e=0; f=0; }
    (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrixStub;
  }
  if (typeof globalThis.ImageBitmap === 'undefined') {
    (globalThis as Record<string, unknown>).ImageBitmap = class {};
  }
  if (typeof globalThis.OffscreenCanvas === 'undefined') {
    (globalThis as Record<string, unknown>).OffscreenCanvas = class {};
  }
  if (typeof globalThis.HTMLCanvasElement === 'undefined') {
    (globalThis as Record<string, unknown>).HTMLCanvasElement = class {};
  }
  if (typeof globalThis.CSSStyleSheet === 'undefined') {
    (globalThis as Record<string, unknown>).CSSStyleSheet = class {};
  }
  if (!globalThis.navigator) (globalThis as Record<string, unknown>).navigator = { userAgent: 'node.js' };
  if (!globalThis.devicePixelRatio) globalThis.devicePixelRatio = 1;

  const pdfjsLib = await import('pdfjs-dist');
  // Disable worker — text extraction doesn't need a separate thread,
  // and Turbopack can't resolve pdf.worker.mjs cross-chunk
  pdfjsLib.GlobalWorkerOptions.workerPort = null;
  const src = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const loadingTask = pdfjsLib.getDocument({ data: src, disableRange: true, disableStream: true });
  const doc = await loadingTask.promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      parts.push(pageText);
    } catch {
      // Skip pages that fail to parse — recover what we can
      parts.push(`[Trang ${i}: không thể trích xuất text]`);
    }
  }

  return parts.join('\n\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/** Convert sheet data to markdown table */
function sheetToMarkdownTable(sheetData: string[][]): string {
  if (sheetData.length === 0) return '';
  const [header, ...rows] = sheetData;
  const sep = `|${header.map(() => '---').join('|')}|`;
  const headerRow = `|${header.map((c) => c || ' ').join('|')}|`;
  const dataRows = rows.map((r) => `|${r.map((c) => c || ' ').join('|')}|`);
  return [headerRow, sep, ...dataRows].join('\n');
}

function extractXlsxText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',' });
    const rows = csv.trim().split('\n').map((line) =>
      line.split(',').map((c) => c.trim())
    );
    if (rows.length === 0) continue;
    if (workbook.SheetNames.length > 1) {
      parts.push(`### ${sheetName}`);
    }
    parts.push(sheetToMarkdownTable(rows));
    parts.push('');
  }
  return parts.join('\n');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId, fileId } = await params;
    if (!requestId || !fileId) {
      return NextResponse.json({ error: 'VALIDATION: missing ids' }, { status: 400 });
    }

    // ── Generated document (gen_) ───────────────────────────
    if (fileId.startsWith('gen_')) {
      const documentId = fileId.slice(4);
      const doc = await prisma.document.findFirst({
        where: { id: documentId, requestId, deletedAt: null },
        include: {
          documentVersions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { generatedContent: true, status: true },
          },
        },
      });

      if (!doc) {
        return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
      }

      const content = doc.documentVersions[0]?.generatedContent ?? '';
      return NextResponse.json({
        content,
        mimeType: 'text/markdown',
        title: doc.title,
        isBinary: false,
        previewFormat: 'markdown',
      });
    }

    // ── Uploaded file (vf_) ─────────────────────────────────
    if (fileId.startsWith('vf_')) {
      const vaultFileId = fileId.slice(3);
      const vaultFile = await prisma.vaultFile.findFirst({
        where: { id: vaultFileId, requestId, deletedAt: null },
        include: {
          file: {
            select: {
              objectKey: true,
              storageDriver: true,
              originalName: true,
              mimeType: true,
            },
          },
        },
      });

      if (!vaultFile) {
        return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
      }

      const title = vaultFile.file?.originalName ?? vaultFile.filename ?? 'Tài liệu';
      const mimeType = vaultFile.file?.mimeType ?? vaultFile.contentType ?? null;

      // Parse office XML files (docx/xlsx) for text extraction
      const officeType = isOfficeXml(mimeType, title);

      if (officeType) {
        const objectKey = vaultFile.file?.objectKey ?? vaultFile.storageKey;
        if (!objectKey) {
          return NextResponse.json({ content: '', mimeType, title, isBinary: false, previewFormat: 'text' });
        }
        try {
          const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
          const fullPath = join(storageRoot, objectKey);
          if (!existsSync(fullPath)) {
            return NextResponse.json({
              content: `[File không tồn tại trong storage: ${objectKey}]`,
              mimeType,
              title,
              isBinary: false,
              previewFormat: 'text',
            });
          }
          if (objectKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
          }
          const buffer = await readFile(fullPath);
          let content: string;
          if (officeType === 'docx') {
            content = await extractDocxText(buffer);
          } else {
            content = extractXlsxText(buffer);
          }
          const MAX_PREVIEW = 100_000;
          const truncated = content.length > MAX_PREVIEW
            ? content.slice(0, MAX_PREVIEW) + '\n\n... [đã cắt bớt để hiển thị, tải file gốc để xem đầy đủ]'
            : content;
          return NextResponse.json({
            content: truncated || `[Không có nội dung text trong file ${officeType.toUpperCase()}]`,
            mimeType,
            title,
            isBinary: false,
            officeFileType: officeType,
            previewFormat: 'markdown',
          });
        } catch (fileErr) {
          const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
          return NextResponse.json({
            content: `[Lỗi đọc file ${officeType.toUpperCase()}: ${msg}]`,
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        }
      }

      // Parse PDF files for text extraction
      if (isPdf(mimeType, title)) {
        const objectKey = vaultFile.file?.objectKey ?? vaultFile.storageKey;
        if (!objectKey) {
          return NextResponse.json({ content: '', mimeType, title, isBinary: false, previewFormat: 'text' });
        }
        try {
          const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
          const fullPath = join(storageRoot, objectKey);
          if (!existsSync(fullPath)) {
            return NextResponse.json({
              content: `[File không tồn tại trong storage: ${objectKey}]`,
              mimeType,
              title,
              isBinary: false,
              previewFormat: 'text',
            });
          }
          if (objectKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
          }
          const buffer = await readFile(fullPath);
          const content = await extractPdfText(buffer);
          const MAX_PREVIEW = 100_000;
          const truncated = content.length > MAX_PREVIEW
            ? content.slice(0, MAX_PREVIEW) + '\n\n... [đã cắt bớt để hiển thị, tải file gốc để xem đầy đủ]'
            : content;
          return NextResponse.json({
            content: truncated || '[Không có nội dung text trong file PDF]',
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        } catch (fileErr) {
          const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
          return NextResponse.json({
            content: `[Lỗi đọc file PDF: ${msg}]`,
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        }
      }

      // Check if binary
      if (isBinaryPreview(mimeType, title)) {
        return NextResponse.json({
          content: '',
          mimeType,
          title,
          isBinary: true,
          message: `Không thể hiển thị nội dung file ${mimeType ?? 'binary'}. Vui lòng tải xuống để xem.`,
        });
      }

      // Read text file content
      const objectKey = vaultFile.file?.objectKey ?? vaultFile.storageKey;
      if (!objectKey) {
        return NextResponse.json({ content: '', mimeType, title, isBinary: false, previewFormat: 'text' });
      }

      try {
        const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
        const fullPath = join(storageRoot, objectKey);

        if (!existsSync(fullPath)) {
          return NextResponse.json({
            content: `[File không tồn tại trong storage: ${objectKey}]`,
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        }

        // Kiểm tra path traversal
        if (objectKey.includes('..')) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }

        const buffer = await readFile(fullPath);
        const content = buffer.toString('utf-8');

        // Truncate nếu quá dài (> 100KB)
        const MAX_PREVIEW = 100_000;
        const truncated = content.length > MAX_PREVIEW
          ? content.slice(0, MAX_PREVIEW) + '\n\n... [đã cắt bớt để hiển thị, tải file gốc để xem đầy đủ]'
          : content;

        // Detect markdown by file extension
        const isMarkdown = /\.(md|markdown)$/i.test(title);

        return NextResponse.json({
          content: truncated,
          mimeType: mimeType ?? 'text/plain',
          title,
          isBinary: false,
          previewFormat: isMarkdown ? 'markdown' : 'text',
        });
      } catch (fileErr) {
        const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
        return NextResponse.json({
          content: `[Lỗi đọc file: ${msg}]`,
          mimeType: mimeType ?? 'text/plain',
          title,
          isBinary: false,
          previewFormat: 'text',
        });
      }
    }

    return NextResponse.json({ error: 'INVALID_FILE_ID' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[File Preview API Error]', msg, error);
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 });
  }
}
