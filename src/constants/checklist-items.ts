/**
 * QC-LEG-01 Checklist items
 * Static checklist structure for legal document review quality control.
 * Items are organized by group: formal, legal, operational.
 */
export const CHECKLIST_ITEMS = [
  // Formal Requirements (Yêu cầu hình thức)
  { id: "formal-1", group: "formal", label: "Biểu mẫu phù hợp", required: true },
  { id: "formal-2", group: "formal", label: "Chính tả/trình bày", required: true },
  { id: "formal-3", group: "formal", label: "Thông tin doanh nghiệp khớp", required: true },
  // Legal Content (Nội dung pháp lý)
  { id: "legal-1", group: "legal", label: "Căn cứ pháp lý còn hiệu lực", required: true },
  { id: "legal-2", group: "legal", label: "Quyền và nghĩa võ rõ ràng", required: true },
  { id: "legal-3", group: "legal", label: "Điều khoản rủi ro", required: true },
  { id: "legal-4", group: "legal", label: "Phù hợp với vấn đề của khách hàng", required: true },
  // Operational & Signing (Thủ tục và ký nháy)
  { id: "op-1", group: "operational", label: "Vị trí ký", required: true },
  { id: "op-2", group: "operational", label: "Phân loại bảo mật", required: true },
] as const;

export const GROUP_LABELS: Record<string, string> = {
  formal: "Yêu cầu hình thức",
  legal: "Nội dung pháp lý",
  operational: "Thủ tục và ký nháy",
};

export const CHECKLIST_GROUPS = ["formal", "legal", "operational"] as const;