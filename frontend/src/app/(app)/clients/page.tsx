import { Suspense } from 'react';
import { ClientsView } from '@/components/clients/ClientsView';

export default function ClientsPage() {
  // ClientsView reads the URL query, which needs a Suspense boundary
  return (
    <Suspense>
      <ClientsView />
    </Suspense>
  );
}
