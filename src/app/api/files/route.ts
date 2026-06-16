/**
 * POST /api/files - Upload file
 *
 * Handles file upload with multipart/form-data.
 * Requires authentication and workspace membership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { storageServer } from '@/lib/storage/server';
import { FileCategory, FileVisibility } from '@/lib/storage/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const requestId = formData.get('requestId') as string | null;
    const category = (formData.get('category') as string | null) || 'request_upload';
    const visibility = (formData.get('visibility') as string | null) || 'private';

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'Validation error', detail: 'File is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Validation error', detail: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = Object.values(FileCategory);
    if (!validCategories.includes(category as FileCategory)) {
      return NextResponse.json(
        { error: 'Validation error', detail: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    // Validate visibility
    const validVisibilities = Object.values(FileVisibility);
    if (!validVisibilities.includes(visibility as FileVisibility)) {
      return NextResponse.json(
        { error: 'Validation error', detail: `Invalid visibility: ${visibility}` },
        { status: 400 }
      );
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const uploadedFile = await storageServer.uploadFile({
      organizationId,
      requestId: requestId || undefined,
      file: buffer,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      category: category as FileCategory,
      visibility: visibility as FileVisibility,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      data: uploadedFile,
      meta: {
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);

    if (error instanceof Error) {
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('VALIDATION')) {
        return NextResponse.json(
          { error: 'Validation error', detail: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', detail: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
