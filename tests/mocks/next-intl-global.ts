import { vi } from 'vitest';

// Global mock for next-intl — auto-applied to all test files via vitest globals
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'vi',
  useNow: () => new Date(),
  useTimeZone: () => 'Asia/Ho_Chi_Minh',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
