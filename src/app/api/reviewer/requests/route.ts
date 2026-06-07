import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();

    const pendingReviews = await prisma.documentVersion.findMany({
      where: {
        status: 'submitted_for_review',
        document: {
          request: {
            assignedReviewerId: session.userId,
          },
        },
      },
      select: {
        id: true,
        templateVersion: true,
        createdAt: true,
        document: {
          select: {
            id: true,
            request: {
              select: {
                id: true,
                title: true,
                intakeSubmission: { select: { matterTypeKey: true } },
                assignedSpecialist: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = pendingReviews.map((r) => ({
      id: r.id,
      requestId: r.document.request.id,
      title: r.document.request.title,
      matterTypeKey: r.document.request.intakeSubmission?.matterTypeKey ?? null,
      specialistName: r.document.request.assignedSpecialist?.name ?? null,
      templateVersion: r.templateVersion,
      createdAt: r.createdAt.toISOString(),
      reviewHref: `/reviewer/requests/${r.document.request.id}/review/${r.id}`,
    }));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
