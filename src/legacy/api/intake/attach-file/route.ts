import { NextResponse } from 'next/server';
import { attachIntakeFile } from '@/lib/intake/upload-service';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const formData = await request.formData();
    const file = formData.get('file');
    const requestId = formData.get('requestId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });
    }

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const uploaded = await attachIntakeFile({
      session,
      requestId,
      file,
      correlationId: `upload-${Date.now()}`,
    });

    return NextResponse.json({ filename: uploaded.filename, size: uploaded.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Attach file failed:', message);
    if (message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Storage service is not configured. Please contact support.' },
        { status: 503 },
      );
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to attach file' }, { status: 500 });
  }
}
