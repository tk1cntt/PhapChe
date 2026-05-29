'use server';

import { requireAppSession } from '@/lib/security/session';
import { generateDraft as generateDraftService } from '@/lib/documents/draft-service';
import { submitForReview as submitForReviewService } from '@/lib/documents/draft-service';

export async function generateDraftAction(input: {
  requestId: string;
  templateId: string;
  variables: Record<string, unknown>;
}) {
  const session = await requireAppSession();
  return generateDraftService({
    session,
    requestId: input.requestId,
    templateId: input.templateId,
    variables: input.variables,
  });
}

export async function submitForReviewAction(input: {
  documentVersionId: string;
  reason?: string;
}) {
  const session = await requireAppSession();
  return submitForReviewService({
    session,
    documentVersionId: input.documentVersionId,
    reason: input.reason,
  });
}
