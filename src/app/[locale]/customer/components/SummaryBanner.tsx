'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  // Extract locale from pathname (e.g., /vi/customer -> vi)
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'vi';

  return (
    <div className="summary-banner">
      <div className="summary-banner-text">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={`/${locale}/customer/create`} className="create-btn">
        + {buttonText}
      </Link>
    </div>
  );
}

export default SummaryBanner;
