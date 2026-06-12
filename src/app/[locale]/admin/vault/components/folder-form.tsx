'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Tag, Button } from 'antd';
import { createFolderAction, type CreateFolderState } from '../actions';

type FolderOption = { id: string; name: string };

const initialState: CreateFolderState = {};

export function FolderForm({ folders }: { folders: FolderOption[] }) {
  const t = useTranslations('Vault');
  const [state, formAction, pending] = useActionState(createFolderAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{t('createFolder')}</p>

      <div>
        <label htmlFor="folder-name" className="block text-[13px] font-semibold text-[#0F172A]">
          {t('folderName')}
        </label>
        <input
          id="folder-name"
          name="name"
          type="text"
          required
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          placeholder={t('folderNamePlaceholder')}
        />
        {state.errors?.name && (
          <p className="mt-1 text-[12px] text-[#B91C1C]">{state.errors.name}</p>
        )}
      </div>

      {folders.length > 0 && (
        <div>
          <label htmlFor="folder-parent" className="block text-[13px] font-semibold text-[#0F172A]">
            {t('parentFolder')}
          </label>
          <select
            id="folder-parent"
            name="parentId"
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <option value="">{t('rootFolder')}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="primary" htmlType="submit" loading={pending}>
          {pending ? t('creating') : t('createFolder')}
        </Button>
        {state.message && state.message !== 'FORBIDDEN' && (
          <Tag color="red">{state.message}</Tag>
        )}
        {state.message === undefined && state.errors === undefined && Object.keys(state).length === 0 && (
          <Tag color="cyan">{t('created')}</Tag>
        )}
      </div>
    </form>
  );
}
