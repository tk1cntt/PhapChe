export const breadcrumbLabels: Record<string, string> = {
  admin: "Quản trị",
  users: "Người dùng",
  workspaces: "Workspace",
  requests: "Hồ sơ yêu cầu",
  ops: "Vận hành",
  audit: "Audit",
  vault: "Phân loại vault",
  specialist: "Chuyên viên",
  reviewer: "Người duyệt",
  customer: "Khách hàng",
  delivery: "Bàn giao",
  templates: "Mẫu văn bản",
  review: "Duyệt",
};

import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb';

export function getBreadcrumbItems(pathname: string): ItemType[] {
  const segments = pathname.split("/").filter(Boolean);
  const filteredSegments = segments.filter((s) => !s.startsWith("("));
  const items: ItemType[] = [];

  for (let i = 0; i < filteredSegments.length; i++) {
    const segment = filteredSegments[i];
    const label = breadcrumbLabels[segment] ?? segment;
    const href = "/" + filteredSegments.slice(0, i + 1).join("/");

    if (i === filteredSegments.length - 1) {
      items.push({ title: label });
    } else {
      items.push({ title: label, href });
    }
  }

  return items;
}
