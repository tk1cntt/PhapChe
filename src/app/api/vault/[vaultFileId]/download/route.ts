import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAppSession } from '@/lib/security/session';
import { getVaultFileDownloadPayload, requestVaultFileAccess, verifyVaultFileAccessSignature } from '@/lib/documents/vault-service';

function noStoreResponse(body: string, status: number) {
  return new Response(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function safeAttachmentName(filename: string | null) {
  return (filename ?? 'document').replace(/["\\\r\n]/g, '_');
}

async function readLocalVaultFile(storageKey: string | null) {
  if (!storageKey) return new Uint8Array();

  const root = process.env.VAULT_STORAGE_ROOT?.trim();
  if (!root) return new TextEncoder().encode('Tệp đang được lưu trong kho bảo mật. Cấu hình VAULT_STORAGE_ROOT để tải nội dung local.');

  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, storageKey);
  if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error('FORBIDDEN');

  return readFile(resolvedFile);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> },
) {
  try {
    const session = await requireAppSession();
    const { vaultFileId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const expires = searchParams.get('expires');
    const userId = searchParams.get('userId');
    const signature = searchParams.get('signature');

    if (!expires || !userId || !signature) {
      const access = await requestVaultFileAccess(session, vaultFileId);
      return Response.redirect(new URL(access.accessUrl, request.url), 302);
    }

    if (userId !== session.userId) {
      return noStoreResponse('Liên kết tải xuống không hợp lệ.', 403);
    }

    const expiresMs = Number(expires);
    if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) {
      return noStoreResponse('Liên kết tải xuống đã hết hạn.', 410);
    }

    if (!verifyVaultFileAccessSignature({ vaultFileId, userId, expires, signature })) {
      return noStoreResponse('Liên kết tải xuống không hợp lệ.', 403);
    }

    const vaultFile = await getVaultFileDownloadPayload(session, vaultFileId);
    const body = await readLocalVaultFile(vaultFile.storageKey);

    return new Response(body, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': vaultFile.contentType ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeAttachmentName(vaultFile.filename)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'UNAUTHENTICATED') return noStoreResponse('Chưa đăng nhập.', 401);
    if (message === 'FORBIDDEN' || message === 'VAULT_FILE_NOT_FOUND') return noStoreResponse('Không tìm thấy tài liệu.', 404);
    return noStoreResponse('Không thể tải tài liệu.', 500);
  }
}
