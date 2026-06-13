import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default async function AdminLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </NextIntlClientProvider>
  );
}
