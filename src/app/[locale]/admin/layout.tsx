import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AdminLayout from '@/app/admin/layout';

export default async function AdminLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <AdminLayout>{children}</AdminLayout>
    </NextIntlClientProvider>
  );
}
