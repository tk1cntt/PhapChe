'use client';

import { useActionState } from 'react';
import { Badge, Button } from '@/app/admin/components/ui';
import { closeDeliveredAction, markDeliveredAction, type SpecialistRequestActionResult } from '../actions';

const initialState: SpecialistRequestActionResult = { ok: false, message: '' };

function FeedbackMessage({ result }: { result: SpecialistRequestActionResult }) {
  if (!result.message) return null;

  return <Badge tone={result.ok ? 'accent' : 'destructive'}>{result.message}</Badge>;
}

export function DeliverForm({ requestId }: { requestId: string }) {
  const [result, formAction] = useActionState(async (_state: SpecialistRequestActionResult, formData: FormData) => markDeliveredAction(formData), initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit">Giao cho khách hàng</Button>
      <FeedbackMessage result={result} />
    </form>
  );
}

export function CloseDeliveredForm({ requestId }: { requestId: string }) {
  const [result, formAction] = useActionState(async (_state: SpecialistRequestActionResult, formData: FormData) => closeDeliveredAction(formData), initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="block space-y-2">
        <span className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Lý do đóng hồ sơ</span>
        <textarea
          name="reason"
          required
          className="min-h-24 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[16px] leading-[1.5] text-[#0F172A] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
        />
      </label>
      <p className="text-[14px] leading-[1.4] text-[#475569]">Yêu cầu sẽ được đóng lại. Hành động này sẽ được ghi nhận.</p>
      <Button type="submit">Đóng hồ sơ</Button>
      <FeedbackMessage result={result} />
    </form>
  );
}
