'use client';

import { useUserProfile } from '@/context/UserProfileContext';
import { NuevaRendicion } from '@/features/refunds/NuevaRendicion';
import { Loader2Icon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function NuevaRendicionPage(): React.JSX.Element {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-base font-semibold">Nueva rendición</span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
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

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-base font-semibold">Nueva rendición</span>
      </header>
      <NuevaRendicion orgId={profile.organization_id} userRut={profile.rut ?? null} />
    </div>
  );
}
