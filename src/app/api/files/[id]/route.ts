/**
 * GET /api/files/[id] - Get file metadata
 * DELETE /api/files/[id] - Delete file
 *
 * Requires authentication and file ownership/workspace membership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'better-auth';
import { storageServer } from '@/lib/storage/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/files/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file
    const file = await storageServer.getFile(id, session.user.id);

    return NextResponse.json({ data: file });
  } catch (error) {
    console.error('Get file error:', error);

    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', detail: 'Failed to get file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 *
 * Only workspace admins and coordinators can delete files.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file to check workspace
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }

    // Check user role - only coordinators and admins can delete
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: file.workspaceId,
        userId: session.user.id,
        isActive: true,
      },
    });

    const canDelete = membership?.role === 'coordinator_admin' || membership?.role === 'super_admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Only workspace admins can delete files' },
        { status: 403 }
      );
    }

    // Delete file
    await storageServer.deleteFile(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);

    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', detail: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
