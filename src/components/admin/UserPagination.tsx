'use client';

import { useTranslations } from 'next-intl';

interface UserPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export default function UserPagination({
  current,
  pageSize,
  total,
  onChange,
}: UserPaginationProps) {
  const t = useTranslations('AdminUsers');

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="px-4 py-3 bg-[#f8fafc] border border-t-0 border-gray-200 rounded-b-[15px] flex justify-end items-center gap-3">
      <select
        value={pageSize}
        onChange={(e) => onChange(1, parseInt(e.target.value))}
        className="h-8 border border-gray-200 rounded-md px-2 text-[13px] bg-white cursor-pointer"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
      <span className="text-[13px] text-[#64748b] flex items-center">
        {t('totalUsersCount', { total }) || `${total} users total`}
      </span>
    </div>
  );
}
