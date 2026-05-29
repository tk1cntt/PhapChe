'use client';

import { Badge } from '@/app/admin/components/ui';

type VaultFile = {
  id: string;
  filename: string | null;
  fileKind: string | null;
  source: string | null;
  createdAt: Date;
};

type Props = {
  vaultFiles: VaultFile[];
};

function fileKindTone(kind: string | null): 'info' | 'warning' | 'neutral' {
  switch (kind) {
    case 'intake_upload':
      return 'info';
    case 'generated_draft':
      return 'warning';
    default:
      return 'neutral';
  }
}

function fileKindLabel(kind: string | null): string {
  switch (kind) {
    case 'intake_upload':
      return 'Tải lên';
    case 'generated_draft':
      return 'Bản nháp';
    default:
      return 'Khác';
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export default function VaultFilesList({ vaultFiles }: Props) {
  if (vaultFiles.length === 0) {
    return <p className="text-[14px] leading-[1.4] text-[#475569]">Chưa có tệp nào trong kho lưu trữ.</p>;
  }

  return (
    <ul className="space-y-3">
      {vaultFiles.map((file) => (
        <li key={file.id} className="rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-normal leading-[1.5] text-[#0F172A]">{file.filename ?? 'Không tên'}</p>
            <Badge tone={fileKindTone(file.fileKind)}>{fileKindLabel(file.fileKind)}</Badge>
          </div>
          <p className="mt-1 text-[14px] leading-[1.4] text-[#475569]">
            Ngày: {formatDate(file.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
