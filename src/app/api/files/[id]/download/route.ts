/**
 * GET /api/files/[id]/download - Download file
 *
 * Streams file content with proper headers.
 * Requires authentication and file access permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { storageServer } from '@/lib/storage/server';
import { LocalStorageProvider } from '@/lib/storage/providers/local-storage.provider';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/files/[id]/download
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file record
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: file.workspaceId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Access denied' },
        { status: 403 }
      );
    }

    // For local storage, stream the file directly
    if (file.storageDriver === 'local') {
      const rootPath = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
      const provider = new LocalStorageProvider(rootPath);

      try {
        const raw = await provider.getObject({
          objectKey: file.objectKey,
          bucket: file.bucket || undefined,
        });

        // Robust type guard: getObject returns Buffer | ReadableStream
        let bufferData: Buffer;
        if (Buffer.isBuffer(raw)) {
          bufferData = raw;
        } else if (raw instanceof Uint8Array) {
          bufferData = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
        } else if (raw instanceof ArrayBuffer) {
          bufferData = Buffer.from(raw);
        } else {
          console.error('[Download] Unexpected getObject return type:', typeof raw);
          return NextResponse.json(
            { error: 'Internal server error', detail: 'Unexpected storage response' },
            { status: 500 },
          );
        }

        // Log access
        await storageServer.getDownloadUrl(id, session.user.id);

        // Return file with proper headers
        const responseHeaders: Record<string, string> = {
          'Content-Type': file.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          'Cache-Control': 'private, no-cache',
        };
        if (file.size != null) {
          responseHeaders['Content-Length'] = String(file.size);
        }

        return new NextResponse(bufferData, {
          status: 200,
          headers: responseHeaders,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'FileNotFoundError') {
          return NextResponse.json(
            { error: 'Not found', detail: 'File not found on storage' },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // For S3 storage (future), redirect to signed URL
    // For now, return not implemented
    return NextResponse.json(
      { error: 'Not implemented', detail: 'S3 download not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Download file error:', error);

    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', detail: 'Failed to download file' },
      { status: 500 }
    );
  }
}
