import AdminRequestsClient from '@/components/admin/AdminRequestsClient';
import { TriagePanel } from '@/components/admin/TriagePanel';
import '@/styles/pages/admin/triage.css';

export default function AdminRequestsPage() {
  return (
    <>
      <TriagePanel />
      <AdminRequestsClient />
    </>
  );
}
