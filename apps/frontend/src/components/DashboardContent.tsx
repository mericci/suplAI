'use client';

import { useUserProfile } from '@/context/UserProfileContext';

function RendidorEmptyState(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <span className="text-3xl">🔒</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Sin acceso por el momento</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tu rol actual no tiene acceso a ninguna sección de la plataforma.
          Contacta a tu administrador para que te asigne permisos.
        </p>
      </div>
    </div>
  );
}

export function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { loading, isRendidor } = useUserProfile();

  if (loading) return <></>;
  // Rendidores now have access to the Rendiciones module
  if (isRendidor) return <>{children}</>;
  return <>{children}</>;
}
