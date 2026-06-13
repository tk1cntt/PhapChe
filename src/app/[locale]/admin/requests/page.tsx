import { AdminLayout } from '@/components/layout/AdminLayout';
import AdminRequestsClient from '@/components/admin/AdminRequestsClient';

export default function AdminRequestsPage() {
  return (
    <AdminLayout>
      <AdminRequestsClient />
    </AdminLayout>
  );
}
