'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2Icon } from 'lucide-react';
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
import { listCostCenters, deleteCostCenter } from '@/integrations/backend/contabilidad';
import type { CostCenterWithAggregates, CostCenterDetail, ContabilidadPeriod } from '@/integrations/backend/contabilidad';
import { listUsers } from '@/integrations/backend/users';
import type { User } from '@/integrations/backend/users';
import { PeriodSelector } from '../components/PeriodSelector';
import { CreateCostCenterDialog } from './CreateCostCenterDialog';
import { CONTABILIDAD_PERIOD } from '../constants';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

interface CostCentersTabProps {
  orgId: string;
  isAdmin: boolean;
}

export function CostCentersTab({ orgId, isAdmin }: CostCentersTabProps): React.JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<CostCenterWithAggregates[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [period, setPeriod] = useState<ContabilidadPeriod>(CONTABILIDAD_PERIOD.CURRENT_MONTH);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (p: ContabilidadPeriod): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCostCenters(orgId, p);
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error ?? 'Error al cargar los centros de costos.');
      }
    } catch {
      setError('Error inesperado al cargar los centros de costos.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadItems(period);
  }, [period, loadItems]);

  useEffect(() => {
    if (!isAdmin) return;
    listUsers(orgId, 1, 100).then((res) => {
      if (res.success && res.data) {
        setOrgUsers(res.data.data ?? []);
      }
    }).catch(() => undefined);
  }, [orgId, isAdmin]);

  async function handleDelete(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await deleteCostCenter(orgId, id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setError(res.error ?? 'Error al eliminar el centro de costos.');
      }
    } catch {
      setError('Error inesperado al eliminar.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreateSuccess(item: CostCenterDetail): void {
    setCreateOpen(false);
    setItems((prev) => [
      ...prev,
      {
        id: item.id,
        organizationId: item.organizationId,
        externalId: item.externalId,
        name: item.name,
        totalAmount: item.totalAmount,
        paidAmount: item.paidAmount,
        approvedAmount: item.approvedAmount,
        pendingAmount: item.pendingAmount,
        supplierCount: item.supplierCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    ]);
  }

  function handleRowClick(id: string): void {
    router.push(`/accounting/cost-centers/${id}`);
  }

  function renderTable(): React.JSX.Element {
    if (loading) {
      return (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {['Nombre', 'ID', 'Monto total', 'Pagado', 'Aprobado', 'Pendiente', 'Proveedores', ''].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
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
            No hay centros de costos.{' '}
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
                <TableHead>Nombre</TableHead>
                <TableHead>ID</TableHead>
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
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(item.id)}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{item.externalId}</TableCell>
                  <TableCell className="text-right">{formatCLP(item.totalAmount)}</TableCell>
                  <TableCell className="text-right">{formatCLP(item.paidAmount)}</TableCell>
                  <TableCell className="text-right">{formatCLP(item.approvedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCLP(item.pendingAmount)}</TableCell>
                  <TableCell className="text-center">{item.supplierCount}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
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
            Nuevo centro de costos
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

      <CreateCostCenterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        orgUsers={orgUsers}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
