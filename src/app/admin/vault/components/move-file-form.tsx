'use client';

import { useTransition, useState } from 'react';
import { Badge, Button } from '../../components/ui';
import { moveFileToFolderAction, tagFileAction, untagFileAction } from '../actions';

type FolderOption = { id: string; name: string };
type TagOption = { id: string; label: string; key: string };
type AppliedTag = { id: string; key: string; label: string };

export function MoveFileForm({
  vaultFileId,
  folders,
  tags,
  appliedTags,
}: {
  vaultFileId: string;
  folders: FolderOption[];
  tags: TagOption[];
  appliedTags: AppliedTag[];
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: 'accent' | 'destructive'; message: string } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const runAction = (action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, extra: Record<string, string>) => {
    const fd = new FormData();
    fd.set('vaultFileId', vaultFileId);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    startTransition(async () => {
      const result = await action(fd);
      if (result.error) setFeedback({ tone: 'destructive', message: result.error });
      else setFeedback({ tone: 'accent', message: 'Đã lưu thay đổi phân loại.' });
    });
  };

  const availableTags = tags.filter((t) => !appliedTags.some((a) => a.id === t.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          disabled={pending || folders.length === 0}
        >
          <option value="">— Chọn thư mục —</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !selectedFolder}
          onClick={() => runAction(moveFileToFolderAction, { folderId: selectedFolder })}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-transparent bg-[#0F766E] px-4 py-2 text-[14px] font-semibold leading-[1.4] text-white shadow-sm transition hover:bg-teal-800 hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Chuyển vào thư mục
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          disabled={pending || availableTags.length === 0}
        >
          <option value="">— Chọn thẻ —</option>
          {availableTags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} ({t.key})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !selectedTag}
          onClick={() => runAction(tagFileAction, { tagId: selectedTag })}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-transparent bg-[#0F766E] px-4 py-2 text-[14px] font-semibold leading-[1.4] text-white shadow-sm transition hover:bg-teal-800 hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Gắn thẻ
        </button>
      </div>

      {appliedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[#64748B]">Đã gắn:</span>
          {appliedTags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => runAction(untagFileAction, { tagId: t.id })}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white px-2 py-0.5 text-[12px] font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50"
              title="Bấm để gỡ thẻ"
            >
              {t.label} ×
            </button>
          ))}
        </div>
      )}

      {feedback && <Badge tone={feedback.tone}>{feedback.message}</Badge>}
    </div>
  );
}
