'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardListIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listPendingDistributions } from '@/integrations/backend/contabilidad/pending-distributions/list-pending-distributions';
import type { PendingDistributionInvoice } from '@/integrations/backend/contabilidad';
import { DistributeInvoiceSheet } from './DistributeInvoiceSheet';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface PendingDistributionsTabProps {
  orgId: string;
}

export function PendingDistributionsTab(
  { orgId }: PendingDistributionsTabProps,
): React.JSX.Element {
  const [items, setItems] = useState<PendingDistributionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<PendingDistributionInvoice | null>(null);

  const loadItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPendingDistributions(orgId);
      if (res.success && res.data) setItems(res.data);
      else setError(res.error ?? 'Error al cargar las distribuciones pendientes.');
    } catch {
      setError('Error al cargar las distribuciones pendientes.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function handleDistributionSuccess(): void {
    setSelectedInvoice(null);
    loadItems();
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ClipboardListIcon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No hay facturas pendientes de distribución
        </p>
        <p className="text-xs text-muted-foreground">
          Cuando se reciban facturas de proveedores con distribución manual, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead className="text-right">Monto Neto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium max-w-[180px] truncate">{invoice.supplierName}</TableCell>
                <TableCell className="text-muted-foreground">{invoice.folio}</TableCell>
                <TableCell className="text-right font-medium">{formatCLP(invoice.netAmount)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(invoice.issueDate)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {invoice.pendingCostCenters.length > 0 && (
                      <Badge variant="outline" className="text-xs">CC</Badge>
                    )}
                    {invoice.pendingAccountingIds.length > 0 && (
                      <Badge variant="outline" className="text-xs">ID</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    Distribuir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedInvoice && (
        <DistributeInvoiceSheet
          open={!!selectedInvoice}
          onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}
          orgId={orgId}
          invoice={selectedInvoice}
          onSuccess={handleDistributionSuccess}
        />
      )}
    </div>
  );
}
