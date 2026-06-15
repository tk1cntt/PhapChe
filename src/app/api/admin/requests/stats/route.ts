/**
 * Admin Requests Stats API
 * GET /api/admin/requests/stats
 *
 * Returns aggregate statistics for the admin requests dashboard.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET() {
  try {
    const session = await requireAppSession();

    // Authorization check
    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute all count queries in parallel
    const [
      totalCount,
      pendingTriageCount,
      statusAssignedCount,
      statusInProgressCount,
      statusApprovedCount,
      statusDeliveredCount,
      slaRiskCount,
    ] = await Promise.all([
      // Total requests
      prisma.legalRequest.count(),

      // Pending triage (workspace without org)
      prisma.legalRequest.count({
        where: {
          workspace: { organizationId: null },
        },
      }),

      // Status: assigned
      prisma.legalRequest.count({ where: { status: 'assigned' } }),

      // Status: in_progress
      prisma.legalRequest.count({ where: { status: 'in_progress' } }),

      // Status: approved
      prisma.legalRequest.count({ where: { status: 'approved' } }),

      // Status: delivered
      prisma.legalRequest.count({ where: { status: 'delivered' } }),

      // SLA at risk (slaDeadline within 24 hours or passed)
      prisma.legalRequest.count({
        where: {
          slaDeadline: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          status: {
            notIn: ['closed', 'cancelled', 'approved', 'delivered'],
          },
        },
      }),
    ]);

    // Calculate percentages
    const total = totalCount || 1; // Avoid division by zero

    // Count partners
    const partnerCount = await prisma.partner.count({ where: { status: 'active' } });

    return NextResponse.json({
      pendingTriage: {
        count: pendingTriageCount,
        description: 'Hồ sơ vãng lai chưa có org/workspace',
      },
      total: {
        count: totalCount,
        description: 'Tất cả partner, org và workspace',
      },
      specialistPartner: {
        count: 0,
        description: 'Xử lý theo loại hồ sơ / service scope',
      },
      dedicatedPartner: {
        count: partnerCount,
        description: 'Phụ trách toàn bộ organization',
      },
      slaRisk: {
        count: slaRiskCount,
        description: 'Cần điều phối hoặc nhắc partner',
      },
      // Status breakdown for the overview panel
      statusBreakdown: [
        {
          name: 'Chờ phân loại',
          count: pendingTriageCount,
          percentage: Math.round((pendingTriageCount / total) * 100),
          color: 'orange',
          note: 'Hồ sơ vãng lai chưa có org/workspace hoặc service type.',
        },
        {
          name: 'Đã giao partner',
          count: statusAssignedCount,
          percentage: Math.round((statusAssignedCount / total) * 100),
          color: 'blue',
          note: 'Đã xác định partner, chờ partner phản hồi hoặc tiếp nhận.',
        },
        {
          name: 'Đang xử lý',
          count: statusInProgressCount,
          percentage: Math.round((statusInProgressCount / total) * 100),
          color: 'purple',
          note: 'Partner hoặc internal team đang xử lý nghiệp vụ.',
        },
        {
          name: 'Hoàn tất',
          count: statusApprovedCount + statusDeliveredCount,
          percentage: Math.round(((statusApprovedCount + statusDeliveredCount) / total) * 100),
          color: 'green',
          note: 'Đã bàn giao kết quả hoặc đóng workflow.',
        },
        {
          name: 'SLA rủi ro cao',
          count: slaRiskCount,
          percentage: Math.round((slaRiskCount / total) * 100),
          color: 'red',
          note: 'Cần nhắc partner, điều phối lại hoặc tăng ưu tiên.',
        },
      ],
    });
  } catch (error) {
    console.error('Admin requests stats error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
