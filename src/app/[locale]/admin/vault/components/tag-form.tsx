'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Tag, Button } from 'antd';
import { createTagAction, type CreateTagState } from '../actions';

const initialState: CreateTagState = {};

export function TagForm() {
  const t = useTranslations('Vault');
  const [state, formAction, pending] = useActionState(createTagAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{t('createTag')}</p>

      <div>
        <label htmlFor="tag-key" className="block text-[13px] font-semibold text-[#0F172A]">
          {t('tagKey')}
        </label>
        <input
          id="tag-key"
          name="key"
          type="text"
          required
          pattern="[a-z0-9_-]{1,32}"
          maxLength={32}
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          placeholder={t('tagKeyPlaceholder')}
        />
        {state.errors?.key && (
          <p className="mt-1 text-[12px] text-[#B91C1C]">{state.errors.key}</p>
        )}
      </div>

      <div>
        <label htmlFor="tag-label" className="block text-[13px] font-semibold text-[#0F172A]">
          {t('displayName')}
        </label>
        <input
          id="tag-label"
          name="label"
          type="text"
          required
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          placeholder={t('displayNamePlaceholder')}
        />
        {state.errors?.label && (
          <p className="mt-1 text-[12px] text-[#B91C1C]">{state.errors.label}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button type="primary" htmlType="submit" loading={pending}>
          {pending ? t('creating') : t('createTag')}
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
