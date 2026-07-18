import { getLocaleDateCode } from './index';

/** Options for date-only formatting */
export interface DateFormatOptions {
  day?: '2-digit' | 'numeric';
  month?: '2-digit' | 'numeric' | 'long' | 'short';
  year?: '2-digit' | 'numeric';
}

/** Options for date+time formatting */
export interface DateTimeFormatOptions extends DateFormatOptions {
  hour?: '2-digit' | 'numeric';
  minute?: '2-digit' | 'numeric';
  second?: '2-digit' | 'numeric';
}

const DEFAULT_DATE: DateFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const DEFAULT_DATETIME: DateTimeFormatOptions = {
  ...DEFAULT_DATE,
  hour: '2-digit',
  minute: '2-digit',
};

const DEFAULT_TIME: DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(
  date: Date | string,
  locale: string,
  options?: DateFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleDateCode(locale), {
    ...DEFAULT_DATE,
    ...options,
  } as Intl.DateTimeFormatOptions);
}

export function formatDateTime(
  date: Date | string,
  locale: string,
  options?: DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleDateCode(locale), {
    ...DEFAULT_DATETIME,
    ...options,
  } as Intl.DateTimeFormatOptions);
}

export function formatTime(
  date: Date | string,
  locale: string,
  options?: DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(getLocaleDateCode(locale), {
    ...DEFAULT_TIME,
    ...options,
  } as Intl.DateTimeFormatOptions);
}
