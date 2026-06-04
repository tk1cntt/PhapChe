'use client';

import { useActionState } from 'react';
import { Button, Card } from '@/app/admin/components/ui';
import { startReviewAction, type ReviewerActionResult } from '../actions';

const initialState: ReviewerActionResult = { ok: false, message: '' };

export default function StartReviewButton({
  requestId,
  documentVersionId,
}: {
  requestId: string;
  documentVersionId: string;
}) {
  const [state, formAction] = useActionState(startReviewAction, initialState);

  return (
    <Card className="space-y-4">
      <p className="text-[16px] leading-[1.5] text-[#475569]">
        Phien duyet chua duoc khoi tao. Nhan "Bat dau duyet" de bat dau phien duyet tai lieu nay.
      </p>
      <form action={formAction}>
        <input type="hidden" name="documentVersionId" value={documentVersionId} />
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" variant="primary">Bat dau duyet</Button>
      </form>
      {state.message && !state.ok && (
        <p className="text-[14px] leading-[1.5] text-[#DC2626]">{state.message}</p>
      )}
    </Card>
  );
}
