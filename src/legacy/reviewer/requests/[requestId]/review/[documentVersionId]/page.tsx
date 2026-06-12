import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import ReviewForm from './components/review-form';
import StartReviewButton from './components/start-review-button';

const { Title, Paragraph } = Typography;

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ requestId: string; documentVersionId: string }>;
}) {
  const { requestId, documentVersionId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();

  const docVersion = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    select: {
      id: true,
      documentId: true,
      templateId: true,
      templateVersion: true,
      status: true,
      generatedContent: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          requestId: true,
          request: {
            select: {
              id: true,
              title: true,
              status: true,
              assignedReviewerId: true,
              assignedSpecialist: { select: { name: true, email: true } },
              intakeSubmission: { select: { matterTypeKey: true } },
            },
          },
        },
      },
    },
  });
  if (!docVersion || docVersion.document.requestId !== requestId) notFound();

  // Reviewer-specific RBAC: must be the assigned reviewer (or admin)
  const isAssignedReviewer = docVersion.document.request.assignedReviewerId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  if (!isAssignedReviewer && !isAdmin) notFound();

  // Load the existing review + checklist answers for this reviewer (D-12)
  const existingReview = await prisma.review.findFirst({
    where: { documentVersionId, reviewerId: session.userId },
    select: {
      id: true,
      status: true,
      generalComment: true,
      checklistAnswers: { select: { checklistItemId: true, passed: true, comment: true } },
    },
  });

  return (
    <Flex vertical gap="middle">
      <Flex justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Title level={3} style={{ margin: 0 }}>Duyet tai lieu</Title>
          <Paragraph style={{ margin: 0, color: '#475569' }}>
            Doc tai lieu ben trai va hoan thanh checklist ben phai truoc khi duyet.
          </Paragraph>
        </div>
        <Link href="/reviewer/requests">
          <Button>Quay lai hang cho</Button>
        </Link>
      </Flex>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">Noi dung tai lieu</h2>
          <pre className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[#0F172A]">
            {docVersion.generatedContent}
          </pre>
        </Card>
        {existingReview ? (
          <ReviewForm
            requestId={requestId}
            documentVersionId={documentVersionId}
            reviewId={existingReview.id}
            existingAnswers={existingReview.checklistAnswers.map((a) => ({
              checklistItemId: a.checklistItemId,
              passed: a.passed,
              comment: a.comment,
            }))}
            generalComment={existingReview.generalComment ?? ''}
            isReadOnly={existingReview.status === 'approved' || existingReview.status === 'rejected'}
          />
        ) : (
          <StartReviewButton requestId={requestId} documentVersionId={documentVersionId} />
        )}
      </div>
    </Flex>
  );
}
