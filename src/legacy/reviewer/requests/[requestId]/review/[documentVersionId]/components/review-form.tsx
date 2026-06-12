'use client';

import { useActionState, useState } from 'react';
import { Tag, Button, Card } from 'antd';
import { CHECKLIST_GROUPS, CHECKLIST_ITEMS, GROUP_LABELS } from '@/lib/reviews/checklist';
import { approveReviewAction, rejectReviewAction, type ReviewerActionResult } from '../actions';

const initialState: ReviewerActionResult = { ok: false, message: '' };

type Answer = { itemId: string; passed: boolean; comment: string };

type ExistingAnswer = { checklistItemId: string; passed: boolean; comment: string | null };

function FeedbackBadge({ result }: { result: ReviewerActionResult }) {
  if (!result.message) return null;
  return <Tag color={result.ok ? 'cyan' : 'red'}>{result.message}</Tag>;
}

export default function ReviewForm({
  requestId,
  documentVersionId,
  reviewId,
  existingAnswers,
  generalComment: initialComment,
  isReadOnly,
}: {
  requestId: string;
  documentVersionId: string;
  reviewId: string;
  existingAnswers: ExistingAnswer[];
  generalComment: string;
  isReadOnly: boolean;
}) {
  const [answers, setAnswers] = useState<Map<string, Answer>>(
    () =>
      new Map(
        existingAnswers.map((a) => [
          a.checklistItemId,
          { itemId: a.checklistItemId, passed: a.passed, comment: a.comment ?? '' },
        ]),
      ),
  );
  const [generalComment, setGeneralComment] = useState(initialComment);

  const requiredItems = CHECKLIST_ITEMS.filter((i) => i.required);
  const allRequiredPassed = requiredItems.every((i) => answers.get(i.id)?.passed === true);

  const [approveState, approveFormAction] = useActionState(
    async (_state: ReviewerActionResult, formData: FormData) => approveReviewAction(formData),
    initialState,
  );
  const [rejectState, rejectFormAction] = useActionState(
    async (_state: ReviewerActionResult, formData: FormData) => rejectReviewAction(formData),
    initialState,
  );

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0F172A]">Checklist QC-LEG-01</h2>

      <div className="space-y-4">
        {CHECKLIST_GROUPS.map((group) => (
          <div key={group} className="rounded-xl border border-[#E2E8F0]">
            <div className="bg-[#F1F5F9] px-4 py-2 text-[14px] font-semibold text-[#0F172A]">
              {GROUP_LABELS[group]}
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {CHECKLIST_ITEMS.filter((i) => i.group === group).map((item) => {
                const a = answers.get(item.id);
                return (
                  <div key={item.id} className="space-y-2 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={item.label}
                        checked={a?.passed === true}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setAnswers((prev) => {
                            const next = new Map(prev);
                            const prevEntry = next.get(item.id) ?? {
                              itemId: item.id,
                              passed: false,
                              comment: '',
                            };
                            next.set(item.id, { ...prevEntry, passed: e.target.checked });
                            return next;
                          })
                        }
                        className="mt-1 h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#0F172A]">
                          {item.label}
                          {item.required ? (
                            <span className="ml-2 text-[11px] font-semibold uppercase text-[#DC2626]">
                              Bat buoc
                            </span>
                          ) : null}
                        </p>
                        {a && !a.passed ? (
                          <textarea
                            name={`comment_${item.id}`}
                            value={a.comment}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              setAnswers((prev) => {
                                const next = new Map(prev);
                                const prevEntry = next.get(item.id) ?? {
                                  itemId: item.id,
                                  passed: false,
                                  comment: '',
                                };
                                next.set(item.id, { ...prevEntry, comment: e.target.value });
                                return next;
                              })
                            }
                            placeholder="Nhan xet cho muc chua dat"
                            className="mt-2 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <form action={approveFormAction} className="space-y-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="documentVersionId" value={documentVersionId} />
        <input type="hidden" name="reviewId" value={reviewId} />
        {Array.from(answers.values()).map((a) => (
          <input
            key={a.itemId}
            type="hidden"
            name={`answer_${a.itemId}`}
            value={a.passed ? '1' : '0'}
          />
        ))}
        <Button type="primary" htmlType="submit" disabled={!allRequiredPassed || isReadOnly}>
          Duyet
        </Button>
        <FeedbackBadge result={approveState} />
      </form>

      <form action={rejectFormAction} className="space-y-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="documentVersionId" value={documentVersionId} />
        <input type="hidden" name="reviewId" value={reviewId} />
        {Array.from(answers.values()).map((a) => (
          <input
            key={a.itemId}
            type="hidden"
            name={`answer_${a.itemId}`}
            value={a.passed ? '1' : '0'}
          />
        ))}
        <label className="block space-y-2">
          <span className="text-[14px] font-semibold text-[#475569]">Nhan xet chung</span>
          <textarea
            name="generalComment"
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            disabled={isReadOnly}
            className="min-h-24 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
          />
        </label>
        <Button danger htmlType="submit" disabled={isReadOnly}>
          Yêu cầu chinh sua
        </Button>
        <FeedbackBadge result={rejectState} />
      </form>
    </Card>
  );
}
