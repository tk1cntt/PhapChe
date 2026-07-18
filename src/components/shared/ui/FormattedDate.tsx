'use client';

import { useLocale } from 'next-intl';
import { formatDate, formatDateTime, formatTime } from '@/lib/i18n/date-format';

export type FormattedDateVariant = 'date' | 'datetime' | 'time';

interface FormattedDateProps {
  date: Date | string | null | undefined;
  variant?: FormattedDateVariant;
  /** Override locale (defaults to useLocale()) */
  locale?: string;
  /** Append timezone label (e.g. "ICT", "GMT+7") — only for datetime/time */
  timezoneSuffix?: string;
  className?: string;
}

/**
 * Locale-aware date display component.
 *
 * Usage:
 *   <FormattedDate date={new Date()} variant="date" />
 *   <FormattedDate date={item.updatedAt} variant="datetime" />
 *   <FormattedDate date={log.timestamp} variant="time" timezoneSuffix=" ICT" />
 */
export function FormattedDate({
  date,
  variant = 'date',
  locale: localeProp,
  timezoneSuffix,
  className,
}: FormattedDateProps) {
  const hookLocale = useLocale();
  const locale = localeProp ?? hookLocale;

  if (!date) {
    return <time className={className}>—</time>;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return <time className={className}>—</time>;
  }

  let text: string;
  switch (variant) {
    case 'datetime':
      text = formatDateTime(d, locale);
      break;
    case 'time':
      text = formatTime(d, locale);
      break;
    default:
      text = formatDate(d, locale);
  }

  if (timezoneSuffix && (variant === 'datetime' || variant === 'time')) {
    text += timezoneSuffix;
  }

  return (
    <time dateTime={d.toISOString()} className={className}>
      {text}
    </time>
  );
}
