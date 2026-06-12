import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AdminLayoutShell from '@/app/components/AdminLayout';

export default async function AdminLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AdminLayoutShell
        title="Dashboard"
        subtitle="GitNexus Legal Admin Panel"
        userName="Admin"
        userRole="Super Admin"
        userInitial="A"
      >
        {children}
      </AdminLayoutShell>
    </NextIntlClientProvider>
  );
}
