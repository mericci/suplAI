'use client';

import { useUserProfile } from '@/context/UserProfileContext';
import { RendicionesList } from '@/features/refunds/RendicionesList';
import { Loader2Icon } from 'lucide-react';

export default function RendicionesPage(): React.JSX.Element {
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

  return <RendicionesList orgId={profile.organization_id} />;
}
