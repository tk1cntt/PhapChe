import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAppSession } from '@/lib/security/session';
import { getVaultFileDownloadPayload, requestVaultFileAccess } from '@/lib/documents/vault-service';

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
    const access = await requestVaultFileAccess(session, vaultFileId);

    if (!access.accessUrl.startsWith(`/api/vault/${vaultFileId}/download`)) {
      return Response.redirect(access.accessUrl, 302);
    }

    const expires = Number(new URL(request.url).searchParams.get('expires') ?? '0');
    if (!Number.isFinite(expires) || expires < Date.now()) {
      return noStoreResponse('Liên kết tải xuống đã hết hạn.', 410);
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
