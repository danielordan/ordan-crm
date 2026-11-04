import { ClientDetailsView } from '@/components/clients/ClientDetailsView';

interface ClientDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;
  return <ClientDetailsView key={id} id={id} />;
}
