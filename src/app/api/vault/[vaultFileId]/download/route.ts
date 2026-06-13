import { NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> }
) {
  try {
    const session = await requireAppSession();
    const { vaultFileId } = await params;

    const vaultFile = await prisma.vaultFile.findUnique({
      where: { id: vaultFileId },
      select: {
        id: true,
        filename: true,
        storageKey: true,
        contentType: true,
        size: true,
        workspaceId: true,
      },
    });

    if (!vaultFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // For now, return a placeholder response since we don't have actual S3/storage
    // In production, this would generate a signed URL or stream the file
    return NextResponse.json({
      message: 'Download endpoint',
      filename: vaultFile.filename,
      storageKey: vaultFile.storageKey,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
