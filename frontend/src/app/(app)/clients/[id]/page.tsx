import { ClientDetailsView } from '@/components/clients/ClientDetailsView';

interface ClientDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}

export default async function ClientDetailsPage({ params, searchParams }: ClientDetailsPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  return <ClientDetailsView key={id} id={id} startInEdit={edit === 'true'} />;
}
