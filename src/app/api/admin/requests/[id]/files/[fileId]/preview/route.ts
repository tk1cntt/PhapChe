/**
 * GET /api/admin/requests/[id]/files/[fileId]/preview — Trả về nội dung preview của file
 *
 * fileId format:
 *   "vf_<vaultFileId>" — uploaded file (trả về text hoặc info nếu binary)
 *   "gen_<documentId>" — generated document (trả về generatedContent)
 *
 * Response: { content: string, mimeType: string, title: string, isBinary: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

const BINARY_EXTENSIONS = /\.(pdf|doc|docx|pptx|ppt|xls|xlsx|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;
const TEXT_EXTENSIONS = /\.(txt|md|json|xml|html|css|js|ts|jsx|tsx|yaml|yml|csv|log|sql|env)$/i;

function isBinaryPreview(mimeType: string | null, filename: string | null): boolean {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType.startsWith('audio/')) return true;
    if (mimeType.startsWith('video/')) return true;
    if (mimeType === 'application/pdf') return true;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return true;
  }
  if (filename && BINARY_EXTENSIONS.test(filename)) return true;
  return false;
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
        return NextResponse.json({ content: '', mimeType, title, isBinary: false });
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

        return NextResponse.json({
          content: truncated,
          mimeType: mimeType ?? 'text/plain',
          title,
          isBinary: false,
        });
      } catch (fileErr) {
        const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
        return NextResponse.json({
          content: `[Lỗi đọc file: ${msg}]`,
          mimeType: mimeType ?? 'text/plain',
          title,
          isBinary: false,
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
