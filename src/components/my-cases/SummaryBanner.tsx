'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export interface SummaryBannerProps {
  title: string;
  description: string;
  buttonText: string;
  workspaceSlug: string;
}

export function SummaryBanner({
  title,
  description,
  buttonText,
  workspaceSlug,
}: SummaryBannerProps): React.ReactElement {
  const t = useTranslations('UserCases');

  return (
    <div className="summary-banner">
      <div className="summary-content">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={`/create`} className="summary-button">
        {buttonText}
      </Link>
    </div>
  );
}

export default SummaryBanner;
