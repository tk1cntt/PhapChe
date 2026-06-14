import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else {
    return `${diffDays} ngày trước`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const recentDocs = await prisma.vaultFile.findMany({
      where: { workspaceId: activeWorkspaceId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const transformed = recentDocs.map((d) => ({
      id: d.id,
      filename: d.filename || 'Untitled',
      size: d.size || 0,
      mimeType: d.contentType || 'application/octet-stream',
      status: 'ACTIVE',
      uploadedBy: '—',
      updatedAt: d.createdAt.toISOString(),
      relativeTime: getRelativeTime(d.createdAt),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Dashboard recent documents API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
