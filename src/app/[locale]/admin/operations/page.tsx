import { AdminLayout } from '@/components/layout/AdminLayout';
import AdminOperationsClient from '@/components/admin/AdminOperationsClient';

export default function AdminOperationsPage() {
  return (
    <AdminLayout>
      <div style={{ padding: '31px 36px 42px' }}>
        <AdminOperationsClient />
      </div>
    </AdminLayout>
  );
}
