export const breadcrumbLabels: Record<string, string> = {
  admin: "Quan tri",
  users: "Nguoi dung",
  workspaces: "Workspace",
  requests: "Ho so yeu cau",
  ops: "Van hanh",
  audit: "Audit",
  vault: "Phan loai vault",
  specialist: "Chuyen vien",
  reviewer: "Nguoi duyet",
  customer: "Khach hang",
  delivery: "Ban giao",
  templates: "Mau van ban",
  review: "Duyet",
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
