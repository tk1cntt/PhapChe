import { UserLayout } from '@/components/layout/UserLayout';
import { CreateRequestForm } from '@/components/create-request/CreateRequestForm';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateRequestPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <UserLayout>
      <CreateRequestForm locale={locale} />
    </UserLayout>
  );
}
