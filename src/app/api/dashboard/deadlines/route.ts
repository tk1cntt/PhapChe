import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deadlines = await prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId,
        slaDeadline: {
          gte: oneDayAgo,
          lte: sevenDaysFromNow,
        },
      },
      take: 5,
      orderBy: { slaDeadline: 'asc' },
      select: {
        id: true,
        title: true,
        code: true,
        slaDeadline: true,
        createdAt: true,
        status: true,
      },
    });

    const transformed = deadlines
      .filter((d) => d.slaDeadline)
      .map((d) => {
        const deadline = d.slaDeadline!;
        const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        const totalHours = (deadline.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
        const elapsedHours = totalHours - hoursRemaining;
        const progressPercent = Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100));

        let status: 'ok' | 'warn' | 'danger' = 'ok';
        if (hoursRemaining < 0) status = 'danger';
        else if (hoursRemaining < 24) status = 'danger';
        else if (hoursRemaining < 72) status = 'warn';

        let timeText = '';
        if (hoursRemaining < 0) {
          const overdueDays = Math.abs(Math.floor(hoursRemaining / 24));
          timeText = `Quá hạn ${overdueDays} ngày`;
        } else if (hoursRemaining < 24) {
          timeText = `Còn ${Math.ceil(hoursRemaining)} giờ`;
        } else {
          timeText = `Còn ${Math.ceil(hoursRemaining / 24)} ngày`;
        }

        return {
          id: d.id,
          title: d.title || d.code || 'Legal Request',
          code: d.code || d.id.slice(-10),
          slaDeadline: deadline.toISOString(),
          progress: Math.round(progressPercent),
          status,
          timeText,
        };
      });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Dashboard deadlines API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
