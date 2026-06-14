import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/routing';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { LocaleSync } from '@/components/providers/LocaleSync';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ReactQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <LocaleSync />
        {children}
      </NextIntlClientProvider>
    </ReactQueryProvider>
  );
}
