'use client';

import { useEffect, useRef, useState } from 'react';
import { Tabs } from 'radix-ui';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { getMe } from '@/integrations/backend/users';
import { cn } from '@/lib/utils';
import { CostCentersTab } from './cost-centers/CostCentersTab';
import { AccountingIdsTab } from './accounting-ids/AccountingIdsTab';
import { CONTABILIDAD_TAB, ADMIN_ROLES } from './constants';

export function ContabilidadPage(): React.JSX.Element {
  const orgIdRef = useRef<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<string>(CONTABILIDAD_TAB.CENTROS_COSTOS);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    getMe().then((res) => {
      if (res.success && res.data?.organization_id) {
        orgIdRef.current = res.data.organization_id;
        setOrgId(res.data.organization_id);
        setIsAdmin(ADMIN_ROLES.includes(res.data.role));
      } else {
        setInitError('No se pudo obtener el contexto de la organización.');
      }
    }).catch(() => {
      setInitError('Error inesperado al cargar.');
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="flex-1 text-lg font-semibold">Contabilidad</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          {initError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {initError}
            </div>
          )}

          <Tabs.Root value={tab} onValueChange={setTab}>
            <Tabs.List className="flex border-b mb-6">
              {[
                { value: CONTABILIDAD_TAB.CENTROS_COSTOS, label: 'Centro de Costos' },
                { value: CONTABILIDAD_TAB.IDS_CONTABLES, label: 'IDs Contables' },
                { value: CONTABILIDAD_TAB.PENDIENTES, label: 'Pendientes de distribución' },
              ].map((t) => (
                <Tabs.Trigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                    tab === t.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value={CONTABILIDAD_TAB.CENTROS_COSTOS}>
              {orgId && (
                <CostCentersTab orgId={orgId} isAdmin={isAdmin} />
              )}
            </Tabs.Content>

            <Tabs.Content value={CONTABILIDAD_TAB.IDS_CONTABLES}>
              {orgId && (
                <AccountingIdsTab orgId={orgId} isAdmin={isAdmin} />
              )}
            </Tabs.Content>

            <Tabs.Content value={CONTABILIDAD_TAB.PENDIENTES}>
              <div className="rounded-lg border border-dashed py-20 text-center">
                <p className="text-sm text-muted-foreground">
                  Pendientes de distribución — próximamente.
                </p>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
