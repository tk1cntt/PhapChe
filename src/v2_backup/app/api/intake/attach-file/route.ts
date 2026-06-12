import { NextResponse } from 'next/server';
import { attachIntakeFile } from '@/lib/intake/upload-service';
import { requireAppSession } from '@/lib/security/session';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const formData = await request.formData();
    const file = formData.get('file');
    const requestId = formData.get('requestId');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'FILE_REQUIRED', message: 'File is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'REQUEST_ID_REQUIRED', message: 'requestId is required' },
        { status: 400 }
      );
    }

    const uploaded = await attachIntakeFile({
      session,
      requestId,
      file,
      correlationId: `v2-upload-${Date.now()}`,
    });

    return NextResponse.json({
      vaultFileId: uploaded.vaultFileId,
      filename: uploaded.filename,
      size: uploaded.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Attach file failed:', message);

    if (message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'STORAGE_ERROR', message: 'Storage service is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      );
    }
    if (message === 'REQUEST_NOT_FOUND') {
      return NextResponse.json(
        { error: 'REQUEST_NOT_FOUND', message: 'Request not found' },
        { status: 404 }
      );
    }
    if (message === 'FILE_REQUIRED') {
      return NextResponse.json(
        { error: 'FILE_REQUIRED', message: 'File is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'UPLOAD_FAILED', message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
