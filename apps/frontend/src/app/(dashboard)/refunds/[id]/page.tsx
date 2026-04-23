'use client';

import { use } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { RendicionDetail } from '@/features/refunds/RendicionDetail';
import { Loader2Icon } from 'lucide-react';

interface RendicionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RendicionDetailPage({ params }: RendicionDetailPageProps): React.JSX.Element {
  const { id } = use(params);
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.organization_id) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  return <RendicionDetail orgId={profile.organization_id} rendicionId={id} />;
}
