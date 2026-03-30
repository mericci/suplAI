'use client';

import { useCallback, useEffect, useState } from 'react';
import { BuildingIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { listSupplierCostCenters } from '@/integrations/backend/suppliers/list-supplier-cost-centers';
import type { SupplierCostCenterLink, DistributionType } from '@/integrations/backend/contabilidad';
import { SupplierCostCentersSheet } from './SupplierCostCentersSheet';

const DISTRIBUTION_LABELS: Record<DistributionType, string> = {
  single: 'Única',
  average: 'Promedio',
  percentage: 'Porcentaje',
  manual: 'Manual',
};

const DISTRIBUTION_VARIANT: Record<DistributionType, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  single: 'secondary',
  average: 'secondary',
  percentage: 'secondary',
  manual: 'outline',
};

interface SupplierCostCentersTabProps {
  supplierId: string;
  orgId: string;
  isAdmin: boolean;
}

export function SupplierCostCentersTab({
  supplierId,
  orgId,
  isAdmin,
}: SupplierCostCentersTabProps): React.JSX.Element {
  const [links, setLinks] = useState<SupplierCostCenterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSupplierCostCenters(orgId, supplierId);
      if (res.success && res.data) setLinks(res.data);
      else setError(res.error ?? 'Error al cargar centros de costos.');
    } catch {
      setError('Error al cargar centros de costos.');
    } finally {
      setLoading(false);
    }
  }, [orgId, supplierId]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  function handleSuccess(updated: SupplierCostCenterLink[]): void {
    setLinks(updated);
    setSheetOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div>
      {links.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BuildingIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay centros de costos asignados
          </p>
          <p className="text-xs text-muted-foreground">
            Asigna centros de costos para clasificar automáticamente las facturas de este proveedor.
          </p>
          {isAdmin && (
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Agregar Centro de Costos
            </Button>
          )}
        </div>
      ) : (
        /* Linked cost centers */
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {links.length === 1 ? '1 centro de costos asignado' : `${links.length} centros de costos asignados`}
              </p>
              <p className="text-xs text-muted-foreground">
                Distribución: <Badge variant={DISTRIBUTION_VARIANT[links[0].distributionType]} className="ml-1 text-xs">
                  {DISTRIBUTION_LABELS[links[0].distributionType]}
                </Badge>
              </p>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
                Editar
              </Button>
            )}
          </div>

          <div className="rounded-md border divide-y">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{link.costCenterName}</p>
                  <p className="text-xs text-muted-foreground">{link.costCenterExternalId}</p>
                </div>
                {link.distributionType === 'percentage' && link.percentage !== null && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {link.percentage}%
                  </span>
                )}
                {link.distributionType === 'average' && (
                  <span className="text-xs text-muted-foreground">
                    {(100 / links.length).toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {links[0].distributionType === 'manual' && (
            <p className="mt-3 text-xs text-muted-foreground rounded-md border border-dashed p-2">
              Las facturas de este proveedor aparecerán en &ldquo;Pendientes de
              distribución&rdquo; en Contabilidad para asignación manual.
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <SupplierCostCentersSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          orgId={orgId}
          supplierId={supplierId}
          existing={links}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
