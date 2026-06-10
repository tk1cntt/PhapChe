import Link from 'next/link';
import { Button, Card } from 'antd';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import CustomerRequestsTable, { type CustomerRequestRow } from './CustomerRequestsTable';

export default async function CustomerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const PAGE_SIZE = 10;
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const session = await requireAppSession();

  const [total, requests] = await Promise.all([
    prisma.legalRequest.count({
      where: {
        workspaceId: session.activeWorkspaceId ?? '',
        createdById: session.userId,
      },
    }),
    prisma.legalRequest.findMany({
      where: {
        workspaceId: session.activeWorkspaceId ?? '',
        createdById: session.userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        intakeSubmission: { select: { matterTypeKey: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const rows: CustomerRequestRow[] = requests.map((request) => ({
    id: request.id,
    title: request.title,
    status: request.status as CustomerRequestRow['status'],
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    matterTypeKey: request.intakeSubmission?.matterTypeKey ?? null,
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              Yêu cầu của tôi
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 16, color: '#475569', maxWidth: 720, lineHeight: 1.5 }}>
              Theo dõi các yêu cầu pháp lý bạn đã gửi và mở tài liệu cuối cùng khi hồ sơ đã được giao.
            </p>
          </div>
          <Link href="/intake">
            <Button type="primary">Tạo yêu cầu mới</Button>
          </Link>
        </div>

        {rows.length === 0 ? (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0F172A', fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
                  Bạn chưa có yêu cầu nào
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 16, color: '#475569', lineHeight: 1.5 }}>
                  Hãy gửi yêu cầu pháp lý đầu tiên để đội ngũ Pháp Chế bắt đầu tiếp nhận và xử lý.
                </p>
              </div>
              <Link href="/intake">
                <Button type="primary">Tạo yêu cầu mới</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card styles={{ body: { padding: 0 } }}>
            <CustomerRequestsTable rows={rows} />
            {totalPages > 1 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                {currentPage > 1 && (
                  <Link href={`/customer/requests?page=${currentPage - 1}`}>
                    <Button size="small">‹ Trang trước</Button>
                  </Link>
                )}
                <span style={{ fontSize: 14, color: '#475569', padding: '0 8px' }}>
                  Trang {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link href={`/customer/requests?page=${currentPage + 1}`}>
                    <Button size="small">Trang sau ›</Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
