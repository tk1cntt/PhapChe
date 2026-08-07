'use client';

import React, { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState — hiển thị khi không có dữ liệu.
 * Hỗ trợ icon, title, description, và optional action button.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const t = useTranslations('shared.emptyState');
  const displayTitle = title || t('noData');
  const displayActionLabel = action?.label || t('create');

  return (
    <div className={`flex min-h-[400px] flex-col items-center justify-center p-8 ${className || ''}`}>
      <div className="text-gray-400">
        {icon || <DefaultEmptyIcon />}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">{displayTitle}</h3>
      {description && (
        <p className="mt-2 text-center text-gray-600">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {displayActionLabel}
        </button>
      )}
    </div>
  );
}
