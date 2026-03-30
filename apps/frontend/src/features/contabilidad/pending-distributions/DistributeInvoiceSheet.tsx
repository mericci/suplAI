'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createInvoiceDistributions } from '@/integrations/backend/contabilidad/pending-distributions/create-invoice-distributions';
import type { PendingDistributionInvoice } from '@/integrations/backend/contabilidad';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

interface DistributeInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  invoice: PendingDistributionInvoice;
  onSuccess: () => void;
}

export function DistributeInvoiceSheet({
  open,
  onOpenChange,
  orgId,
  invoice,
  onSuccess,
}: DistributeInvoiceSheetProps): React.JSX.Element {
  const [ccAmounts, setCcAmounts] = useState<Record<string, string>>({});
  const [aiAmounts, setAiAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getCcTotal(): number {
    return invoice.pendingCostCenters.reduce(
      (sum, cc) => sum + (Number(ccAmounts[cc.id]) || 0),
      0,
    );
  }

  function getAiTotal(): number {
    return invoice.pendingAccountingIds.reduce(
      (sum, ai) => sum + (Number(aiAmounts[ai.id]) || 0),
      0,
    );
  }

  function handleOpenChange(val: boolean): void {
    if (!val) {
      setCcAmounts({});
      setAiAmounts({});
      setError(null);
    }
    onOpenChange(val);
  }

  async function handleSubmit(): Promise<void> {
    const hasCc = invoice.pendingCostCenters.length > 0;
    const hasAi = invoice.pendingAccountingIds.length > 0;

    // Validate CC amounts sum
    if (hasCc) {
      const total = getCcTotal();
      if (total !== invoice.netAmount) {
        setError(
          `Los montos de centros de costos deben sumar ${formatCLP(invoice.netAmount)}`
          + ` (actualmente: ${formatCLP(total)})`,
        );
        return;
      }
    }

    // Validate AI amounts sum
    if (hasAi) {
      const total = getAiTotal();
      if (total !== invoice.netAmount) {
        setError(
          `Los montos de IDs contables deben sumar ${formatCLP(invoice.netAmount)}`
          + ` (actualmente: ${formatCLP(total)})`,
        );
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const costCenterDistributions = hasCc
        ? invoice.pendingCostCenters.map((cc) => ({
          costCenterId: cc.id,
          amount: Number(ccAmounts[cc.id]) || 0,
        }))
        : undefined;
      const accountingIdDistributions = hasAi
        ? invoice.pendingAccountingIds.map((ai) => ({
          accountingId: ai.id,
          amount: Number(aiAmounts[ai.id]) || 0,
        }))
        : undefined;
      const payload = { costCenterDistributions, accountingIdDistributions };

      const res = await createInvoiceDistributions(orgId, invoice.id, payload);
      if (!res.success) { setError(res.error ?? 'Error al guardar la distribución.'); return; }
      onSuccess();
      handleOpenChange(false);
    } catch {
      setError('Error inesperado al guardar la distribución.');
    } finally {
      setLoading(false);
    }
  }

  const hasCc = invoice.pendingCostCenters.length > 0;
  const hasAi = invoice.pendingAccountingIds.length > 0;
  const ccTotal = getCcTotal();
  const aiTotal = getAiTotal();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <DialogPrimitive.Title className="text-xl font-bold">
                Distribuir Factura
              </DialogPrimitive.Title>
              <p className="text-sm text-muted-foreground mt-0.5">
                {invoice.supplierName} · Folio {invoice.folio}
              </p>
            </div>
            <DialogPrimitive.Close asChild>
              <button type="button" className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Cerrar">
                <XIcon className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="mb-4 rounded-md border bg-muted/30 px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monto neto</span>
            <span className="text-sm font-semibold">{formatCLP(invoice.netAmount)}</span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Cost center distribution inputs */}
          {hasCc && (
            <div className="mb-5">
              <p className="mb-3 text-sm font-medium">Centros de Costos</p>
              <div className="space-y-2">
                {invoice.pendingCostCenters.map((cc) => (
                  <div key={cc.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{cc.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{cc.externalId}</p>
                    </div>
                    <div className="flex w-36 items-center gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={ccAmounts[cc.id] ?? ''}
                        onChange={(e) => setCcAmounts((p) => ({ ...p, [cc.id]: e.target.value }))}
                        className="h-8 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className={[
                'mt-2 text-right text-xs font-medium',
                ccTotal === invoice.netAmount ? 'text-green-600' : 'text-muted-foreground',
              ].join(' ')}>
                Total CC: {formatCLP(ccTotal)} / {formatCLP(invoice.netAmount)}
              </p>
            </div>
          )}

          {/* Accounting ID distribution inputs */}
          {hasAi && (
            <div className="mb-5">
              <p className="mb-3 text-sm font-medium">IDs Contables</p>
              <div className="space-y-2">
                {invoice.pendingAccountingIds.map((ai) => (
                  <div key={ai.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{ai.externalId}</p>
                      <p className="truncate text-xs text-muted-foreground">{ai.description}</p>
                    </div>
                    <div className="flex w-36 items-center gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={aiAmounts[ai.id] ?? ''}
                        onChange={(e) => setAiAmounts((p) => ({ ...p, [ai.id]: e.target.value }))}
                        className="h-8 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className={[
                'mt-2 text-right text-xs font-medium',
                aiTotal === invoice.netAmount ? 'text-green-600' : 'text-muted-foreground',
              ].join(' ')}>
                Total ID: {formatCLP(aiTotal)} / {formatCLP(invoice.netAmount)}
              </p>
            </div>
          )}

          <Button type="button" className="w-full" disabled={loading} onClick={() => { handleSubmit(); }}>
            {loading ? 'Guardando...' : 'Confirmar distribución'}
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
