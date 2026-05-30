import { PageHeader } from "@/app/admin/components/ui";
import { Button } from "@/app/admin/components/ui";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CHECKLIST_ITEMS, GROUP_LABELS, CHECKLIST_GROUPS } from "@/constants/checklist-items";

export default async function ReviewDetailPage({
  params,
}: {
  params: { requestId: string; documentVersionId: string };
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  // TODO: Load review data:
  // 1. DocumentVersion with VaultFile content
  // 2. LegalRequest with matter type and specialist info
  // 3. Existing ReviewChecklistAnswer if review was started
  // 4. Passed checklist item IDs to derive button state
  const passedItemIds: string[] = []; // TODO: replace with actual data
  const allRequiredPassed = CHECKLIST_ITEMS
    .filter(item => item.required)
    .every(item => passedItemIds.includes(item.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader
          title="Kiểm tra tài liệu"
          description="Đánh giá tài liệu theo tiêu chí QC-LEG-01"
        />

        {/* Split View Container */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Panel: Document Preview */}
          <div className="min-h-[400px] rounded-xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">
              Nội dung tài liệu
            </h2>
            {/* TODO: Render document content from VaultFile */}
            <div className="prose max-w-none">
              {/* Document preview will be loaded from VaultFile storageKey */}
            </div>
          </div>

          {/* Right Panel: QC Checklist */}
          <div className="min-h-[400px] rounded-xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">
              Checklist QC-LEG-01
            </h2>

            {/* Checklist Groups */}
            <div className="space-y-4">
              {CHECKLIST_GROUPS.map((group) => (
                <details key={group} className="rounded-lg border border-[#E2E8F0]" open={group === "formal"}>
                  <summary className="cursor-pointer bg-[#F1F5F9] px-4 py-3 font-semibold text-[#0F172A]">
                    {GROUP_LABELS[group as keyof typeof GROUP_LABELS]}
                  </summary>
                  <div className="divide-y divide-[#E2E8F0]">
                    {CHECKLIST_ITEMS.filter(item => item.group === group).map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Pass/Fail Toggle */}
                          <button
                            type="button"
                            className="mt-1 h-6 w-6 rounded border-2 border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#0F766E] flex items-center justify-center"
                            aria-label={item.label}
                          >
                            {/* Checkmark shown when passed */}
                          </button>
                          <div className="flex-1">
                            <label className="text-[16px] font-normal text-[#0F172A]">
                              {item.label}
                            </label>
                            {item.required && (
                              <span className="ml-2 text-[11px] font-semibold uppercase text-[#DC2626]">
                                Bắt buộc
                              </span>
                            )}
                            {/* TODO: Comment toggle and textarea for failures */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <Button variant="primary" className="flex-1" disabled={!allRequiredPassed}>
                Phê duyệt
              </Button>
              <Button variant="destructive" className="flex-1">
                Yêu cầu sửa đổi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}