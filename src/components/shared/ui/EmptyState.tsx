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
        {icon || (
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
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
