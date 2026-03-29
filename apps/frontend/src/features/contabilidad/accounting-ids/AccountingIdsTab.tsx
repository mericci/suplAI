'use client';

import { useCallback, useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
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
import { listAccountingIds, deleteAccountingId } from '@/integrations/backend/contabilidad';
import type { AccountingIdWithAggregates, ContabilidadPeriod } from '@/integrations/backend/contabilidad';
import { PeriodSelector } from '../components/PeriodSelector';
import { CreateAccountingIdDialog } from './CreateAccountingIdDialog';
import { EditAccountingIdDialog } from './EditAccountingIdDialog';
import { CONTABILIDAD_PERIOD } from '../constants';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

interface AccountingIdsTabProps {
  orgId: string;
  isAdmin: boolean;
}

export function AccountingIdsTab({ orgId, isAdmin }: AccountingIdsTabProps): React.JSX.Element {
  const [items, setItems] = useState<AccountingIdWithAggregates[]>([]);
  const [period, setPeriod] = useState<ContabilidadPeriod>(CONTABILIDAD_PERIOD.CURRENT_MONTH);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<AccountingIdWithAggregates | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (p: ContabilidadPeriod): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAccountingIds(orgId, p);
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error ?? 'Error al cargar los IDs contables.');
      }
    } catch {
      setError('Error inesperado al cargar los IDs contables.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadItems(period);
  }, [period, loadItems]);

  async function handleDelete(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await deleteAccountingId(orgId, id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setError(res.error ?? 'Error al eliminar el ID contable.');
      }
    } catch {
      setError('Error inesperado al eliminar.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreateSuccess(item: AccountingIdWithAggregates): void {
    setCreateOpen(false);
    setItems((prev) => [...prev, item]);
  }

  function handleEditSuccess(updated: AccountingIdWithAggregates): void {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditItem(null);
  }

  function renderTable(): React.JSX.Element {
    if (loading) {
      return (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {['ID', 'Descripción', 'Monto total', 'Pagado', 'Aprobado', 'Pendiente', 'Proveedores', ''].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No hay IDs contables.{' '}
            {isAdmin && (
              <button
                type="button"
                className="text-foreground underline underline-offset-2"
                onClick={() => setCreateOpen(true)}
              >
                Crear uno
              </button>
            )}
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto total</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Aprobado</TableHead>
              <TableHead className="text-right">Pendiente</TableHead>
              <TableHead className="text-center">Proveedores</TableHead>
              {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm font-medium">{item.externalId}</TableCell>
                <TableCell className="text-muted-foreground">{item.description}</TableCell>
                <TableCell className="text-right">{formatCLP(item.totalAmount)}</TableCell>
                <TableCell className="text-right">{formatCLP(item.paidAmount)}</TableCell>
                <TableCell className="text-right">{formatCLP(item.approvedAmount)}</TableCell>
                <TableCell className="text-right">{formatCLP(item.pendingAmount)}</TableCell>
                <TableCell className="text-center">{item.supplierCount}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Eliminar"
                        disabled={deletingId === item.id}
                        onClick={(e) => { handleDelete(item.id, e); }}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <PeriodSelector value={period} onChange={setPeriod} />
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nuevo ID contable
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      {renderTable()}

      <CreateAccountingIdDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        onSuccess={handleCreateSuccess}
      />

      {editItem && (
        <EditAccountingIdDialog
          open={editItem !== null}
          onOpenChange={(val) => { if (!val) setEditItem(null); }}
          orgId={orgId}
          item={editItem}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
