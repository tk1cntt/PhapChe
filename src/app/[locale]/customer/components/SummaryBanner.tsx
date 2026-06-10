'use client';

import React from 'react';
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
}: SummaryBannerProps): JSX.Element {
  return (
    <div className="summary-banner">
      <div className="summary-banner-text">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={`/${workspaceSlug}/create`} className="create-btn">
        + {buttonText}
      </Link>
    </div>
  );
}

export default SummaryBanner;
