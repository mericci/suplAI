import { SupplierProfile } from '@/features/suppliers/SupplierProfile';

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage(
  { params }: ProviderPageProps,
): Promise<React.JSX.Element> {
  const { id } = await params;
  return <SupplierProfile supplierId={id} />;
}
