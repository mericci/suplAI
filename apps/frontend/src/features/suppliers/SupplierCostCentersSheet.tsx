'use client';

import { useEffect, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listCostCenters } from '@/integrations/backend/contabilidad';
import { upsertSupplierCostCenters } from '@/integrations/backend/suppliers/upsert-supplier-cost-centers';
import type { CostCenterWithAggregates, SupplierCostCenterLink, DistributionType } from '@/integrations/backend/contabilidad';

const DISTRIBUTION_TYPE_LABELS: Record<DistributionType, string> = {
  single: 'Única',
  average: 'Promedio',
  percentage: 'Porcentaje',
  manual: 'Manual',
};

interface SupplierCostCentersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  supplierId: string;
  existing: SupplierCostCenterLink[];
  onSuccess: (links: SupplierCostCenterLink[]) => void;
}

export function SupplierCostCentersSheet({
  open,
  onOpenChange,
  orgId,
  supplierId,
  existing,
  onSuccess,
}: SupplierCostCentersSheetProps): React.JSX.Element {
  const [costCenters, setCostCenters] = useState<CostCenterWithAggregates[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [distributionType, setDistributionType] = useState<DistributionType>('single');
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available cost centers when opening
  useEffect(() => {
    if (!open) return;
    setLoadingCostCenters(true);
    listCostCenters(orgId, 'all').then((res) => {
      if (res.success && res.data) setCostCenters(res.data);
    }).catch(() => {
      setError('No se pudieron cargar los centros de costos.');
    }).finally(() => setLoadingCostCenters(false));

    // Pre-fill from existing links
    const existingIds = new Set(existing.map((e) => e.costCenterId));
    setSelected(existingIds);
    const existingType = existing[0]?.distributionType ?? 'single';
    setDistributionType(existingType);
    const existingPercentages = Object.fromEntries(
      existing
        .filter((e) => e.percentage !== null)
        .map((e) => [e.costCenterId, String(e.percentage)]),
    );
    setPercentages(existingPercentages);
    setError(null);
  }, [open, existing, orgId]);

  // When number of selected cost centers changes, infer distribution type
  useEffect(() => {
    if (selected.size <= 1) {
      setDistributionType('single');
    } else if (distributionType === 'single') {
      setDistributionType('average');
    }
  }, [selected.size]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCostCenter(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getTotalPercentage(): number {
    return [...selected].reduce((sum, id) => sum + Number(percentages[id] ?? 0), 0);
  }

  async function handleSubmit(): Promise<void> {
    if (selected.size === 0) { setError('Selecciona al menos un centro de costos.'); return; }

    if (distributionType === 'percentage') {
      const total = getTotalPercentage();
      if (Math.abs(total - 100) > 0.01) {
        setError(`Los porcentajes deben sumar 100% (actualmente: ${total.toFixed(2)}%)`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const assignments = [...selected].map((id) => ({
        costCenterId: id,
        percentage: distributionType === 'percentage' ? Number(percentages[id] ?? 0) : null,
      }));

      const res = await upsertSupplierCostCenters(orgId, supplierId, {
        distributionType: selected.size === 1 ? 'single' : distributionType,
        assignments,
      });

      if (!res.success || !res.data) { setError(res.error ?? 'Error al guardar.'); return; }
      onSuccess(res.data);
      onOpenChange(false);
    } catch {
      setError('Error inesperado al guardar.');
    } finally {
      setLoading(false);
    }
  }

  const selectedArray = [...selected];
  const showDistributionOptions = selected.size > 1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={[
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          ].join(' ')}
        />
        <DialogPrimitive.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg',
            '-translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          ].join(' ')}
        >
          <div className="mb-5 flex items-start justify-between">
            <DialogPrimitive.Title className="text-xl font-bold">
              Centros de Costos
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {error && (
            <div className={[
              'mb-4 rounded-md border border-destructive/30',
              'bg-destructive/10 px-3 py-2 text-sm text-destructive',
            ].join(' ')}>
              {error}
            </div>
          )}

          {/* Cost center selection */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">
              Selecciona los centros de costos para este proveedor
            </p>
            {loadingCostCenters && (
              <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            )}
            {!loadingCostCenters && costCenters.length === 0 && (
              <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                No hay centros de costos disponibles. Crea uno en la sección Contabilidad.
              </div>
            )}
            {!loadingCostCenters && costCenters.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-md border divide-y">
                {costCenters.map((cc) => {
                  const isSelected = selected.has(cc.id);
                  const checkClass = [
                    'flex h-4 w-4 items-center justify-center rounded border',
                    isSelected ? 'bg-primary border-primary' : 'border-input',
                  ].join(' ');
                  return (
                    <label
                      key={cc.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                    >
                      <div className={checkClass}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => toggleCostCenter(cc.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{cc.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{cc.externalId}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribution type selector — only when 2+ cost centers are selected */}
          {showDistributionOptions && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium">Tipo de distribución</p>
              <div className="grid grid-cols-3 gap-2">
                {(['average', 'percentage', 'manual'] as DistributionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDistributionType(type)}
                    className={[
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      distributionType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {DISTRIBUTION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Percentage inputs */}
              {distributionType === 'percentage' && (
                <div className="mt-3 space-y-2">
                  {selectedArray.map((id) => {
                    const cc = costCenters.find((c) => c.id === id);
                    if (!cc) return null;
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <span className="flex-1 truncate text-sm">{cc.name}</span>
                        <div className="flex w-24 items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            placeholder="0"
                            value={percentages[id] ?? ''}
                            onChange={(e) => setPercentages(
                              (p) => ({ ...p, [id]: e.target.value }),
                            )}
                            className="h-8 text-right"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    );
                  })}
                  <p className={[
                    'text-right text-xs font-medium',
                    Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-destructive',
                  ].join(' ')}>
                    Total: {getTotalPercentage().toFixed(2)}%
                  </p>
                </div>
              )}

              {/* Manual distribution note */}
              {distributionType === 'manual' && (
                <p className="mt-2 text-xs text-muted-foreground rounded-md border border-dashed p-2">
                  Las facturas de este proveedor aparecerán en &ldquo;Pendientes
                  de distribución&rdquo; en Contabilidad para asignación manual.
                </p>
              )}

              {/* Average distribution note */}
              {distributionType === 'average' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  El monto de cada factura se dividirá en partes iguales
                  entre los {selected.size} centros de costos seleccionados.
                </p>
              )}
            </div>
          )}

          <Button
            type="button"
            className="w-full mt-2"
            disabled={loading || selected.size === 0}
            onClick={() => { handleSubmit(); }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
