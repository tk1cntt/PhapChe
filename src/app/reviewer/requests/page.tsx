import Link from 'next/link';
import { Badge, Button, Card, PageHeader, Table } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function ReviewerQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
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
              assignedSpecialist: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      {notice === 'approved' ? (
        <Badge tone="accent">Đã duyệt tài liệu. Tài liệu đã được chuyển sang trạng thái cuối.</Badge>
      ) : notice === 'revision' ? (
        <Badge tone="destructive">Đã gửi yêu cầu chỉnh sửa cho chuyên viên.</Badge>
      ) : null}

      <PageHeader
        title="Hàng chờ duyệt"
        description="Danh sách phiên bản tài liệu được chuyên viên gửi lên chờ bạn duyệt."
      />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ duyệt</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Danh sách này được lọc trên máy chủ theo reviewer đang đăng nhập.
        </p>
      </Card>

      <Table headers={['Yêu cầu', 'Loại vụ việc', 'Chuyên viên', 'Phiên bản', 'Gửi lúc']}>
        {pendingReviews.map((review) => (
          <tr key={review.id} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#0F172A]">
              <Link
                href={`/reviewer/requests/${review.document.request.id}/review/${review.id}`}
                className="text-[#0F766E] hover:underline"
              >
                {review.document.request.title}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {review.document.request.intakeSubmission?.matterTypeKey ?? 'Chưa có loại'}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {review.document.request.assignedSpecialist?.name ?? 'Chưa có'}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              v{review.templateVersion}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {formatDate(review.createdAt)}
            </td>
          </tr>
        ))}
        {pendingReviews.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-[16px] font-normal leading-[1.5] text-[#475569]">
              <p className="font-semibold text-[#0F172A]">Chưa có tài liệu chờ duyệt</p>
              <p className="mt-1">Khi chuyên viên gửi tài liệu lên, tài liệu sẽ xuất hiện tại đây.</p>
            </td>
          </tr>
        ) : null}
      </Table>
    </main>
  );
}
