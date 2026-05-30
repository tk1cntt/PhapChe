import Link from 'next/link';
import { Badge, Button, Card, PageHeader, Table } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export default async function ReviewerQueuePage() {
  const session = await requireAppSession();

  // Fetch document versions awaiting review for this reviewer
  const pendingReviews = await prisma.documentVersion.findMany({
    where: {
      status: 'submitted_for_review',
      legalRequest: {
        assignedReviewerId: session.userId,
      },
    },
    select: {
      id: true,
      versionNumber: true,
      createdAt: true,
      legalRequest: {
        select: {
          id: true,
          title: true,
          intakeSubmission: { select: { matterTypeKey: true } },
          assignedSpecialist: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader
        title="Yêu cầu kiểm tra"
        description="Các tài liệu chờ bạn kiểm tra chất lượng"
      />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ kiểm tra</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Danh sách này được lọc trên máy chủ theo reviewer đang đăng nhập.
        </p>
      </Card>

      <Table headers={['STT', 'Tiêu đề', 'Loại', 'Chuyên viên', 'Ngày nộp', 'Trạng thái', 'Thao tác']}>
        {pendingReviews.map((review, index) => (
          <tr key={review.id} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{index + 1}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#0F172A]">{review.legalRequest.title}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {review.legalRequest.intakeSubmission?.matterTypeKey ?? 'Chưa có loại'}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {review.legalRequest.assignedSpecialist?.name ?? 'Chưa có'}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{formatDate(review.createdAt)}</td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone="info">Đang chờ</Badge></td>
            <td className="whitespace-nowrap px-4 py-3">
              <Link href={`/reviewer/requests/${review.legalRequest.id}/review/${review.id}`}>
                <Button variant="secondary">Xem chi tiết</Button>
              </Link>
            </td>
          </tr>
        ))}
        {pendingReviews.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-[16px] font-normal leading-[1.5] text-[#475569]">
              Không có tài liệu chờ kiểm tra
            </td>
          </tr>
        ) : null}
      </Table>
    </main>
  );
}