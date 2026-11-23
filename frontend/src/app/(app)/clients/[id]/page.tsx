import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClientDetailsView } from '@/components/clients/ClientDetailsView';
import { NOT_FOUND_TITLE } from '@/components/ui/NotFoundContent';
import { isClientId } from '@/lib/client-details';

interface ClientDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}

// Keeps the 404 tab title for a malformed ID (otherwise the layout's title wins after load)
export async function generateMetadata({
  params,
}: Pick<ClientDetailsPageProps, 'params'>): Promise<Metadata> {
  const { id } = await params;
  return isClientId(id) ? {} : { title: NOT_FOUND_TITLE };
}

export default async function ClientDetailsPage({ params, searchParams }: ClientDetailsPageProps) {
  const { id } = await params;
  // A malformed ID is a real 404, without asking the backend
  if (!isClientId(id)) notFound();
  const { edit } = await searchParams;
  return <ClientDetailsView key={id} id={id} startInEdit={edit === 'true'} />;
}
