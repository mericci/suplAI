'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs } from 'radix-ui';
import {
  PlusIcon,
  CalendarIcon,
  BarChart3Icon,
  LayoutListIcon,
  Trash2Icon,
  EyeIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMe } from '@/integrations/backend/users';
import { listSuppliersByOrg } from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import {
  listBudgetItems,
  deleteBudgetItem,
  getBudgetMetrics,
} from '@/integrations/backend/budget';
import type {
  BudgetItemWithSpend,
  BudgetMetrics,
  BudgetPeriod,
} from '@/integrations/backend/budget';
import { CreateBudgetItemDialog } from '@/features/budget/CreateBudgetItemDialog';
import { MetricsTab } from '@/features/budget/MetricsTab';
import { BUDGET_PERIOD, BUDGET_PERIOD_LABELS } from '@/features/budget/constants';
import { cn } from '@/lib/utils';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

const TAB_ITEMS = 'items';
const TAB_METRICS = 'metrics';

export default function BudgetPage(): React.JSX.Element {
  const orgIdRef = useRef<string | null>(null);

  const [tab, setTab] = useState(TAB_ITEMS);
  const [period, setPeriod] = useState<BudgetPeriod>(BUDGET_PERIOD.CURRENT_MONTH);

  const [items, setItems] = useState<BudgetItemWithSpend[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [metrics, setMetrics] = useState<BudgetMetrics | null>(null);

  const [itemsLoading, setItemsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadOrgAndSuppliers = useCallback(async (): Promise<string | null> => {
    if (orgIdRef.current) return orgIdRef.current;
    const meRes = await getMe();
    if (!meRes.success || !meRes.data?.organization_id) return null;
    const orgId = meRes.data.organization_id;
    orgIdRef.current = orgId;

    // Load suppliers (for create dialog)
    const suppliersRes = await listSuppliersByOrg(orgId, { limit: 100 });
    if (suppliersRes.success) {
      setSuppliers(suppliersRes.data ?? []);
    }
    return orgId;
  }, []);

  const loadItems = useCallback(async (p: BudgetPeriod): Promise<void> => {
    setItemsLoading(true);
    setPageError(null);
    try {
      const orgId = await loadOrgAndSuppliers();
      if (!orgId) {
        setPageError('No se pudo obtener el contexto de la organización.');
        return;
      }
      const res = await listBudgetItems(orgId, p);
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setPageError(res.error ?? 'Error al cargar los ítems.');
      }
    } catch {
      setPageError('Error inesperado al cargar los ítems.');
    } finally {
      setItemsLoading(false);
    }
  }, [loadOrgAndSuppliers]);

  const loadMetrics = useCallback(async (budgetItemIds?: string[] | null): Promise<void> => {
    setMetricsLoading(true);
    try {
      const orgId = await loadOrgAndSuppliers();
      if (!orgId) return;
      const res = await getBudgetMetrics(orgId, budgetItemIds ?? undefined);
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {
      // metrics are non-critical — fail silently
    } finally {
      setMetricsLoading(false);
    }
  }, [loadOrgAndSuppliers]);

  useEffect(() => {
    loadItems(period);
  }, [period, loadItems]);

  useEffect(() => {
    if (tab === TAB_METRICS && !metrics) {
      loadMetrics();
    }
  }, [tab, metrics, loadMetrics]);

  function handleMetricsFilterChange(budgetItemIds: string[] | null): void {
    setMetrics(null);
    loadMetrics(budgetItemIds);
  }

  async function handleDelete(item: BudgetItemWithSpend): Promise<void> {
    const orgId = orgIdRef.current;
    if (!orgId || deletingId) return;
    setDeletingId(item.id);
    try {
      await deleteBudgetItem(orgId, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      // Refresh metrics if visible
      if (tab === TAB_METRICS) {
        setMetrics(null);
        loadMetrics();
      }
    } catch {
      setPageError('Error al eliminar el ítem.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCreateSuccess(): void {
    setCreateOpen(false);
    loadItems(period);
    setMetrics(null); // invalidate metrics cache
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="flex-1 text-lg font-semibold">Presupuesto</h1>
        {tab === TAB_ITEMS && (
          <>
            <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
              <SelectTrigger className="w-40 gap-2">
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BUDGET_PERIOD_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Crear ítem
            </Button>
          </>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {pageError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {pageError}
            </div>
          )}

          <Tabs.Root value={tab} onValueChange={setTab}>
            {/* Tab List */}
            <Tabs.List className="flex border-b">
              <Tabs.Trigger
                value={TAB_ITEMS}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  tab === TAB_ITEMS
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutListIcon className="h-4 w-4" />
                Items de gasto
              </Tabs.Trigger>
              <Tabs.Trigger
                value={TAB_METRICS}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  tab === TAB_METRICS
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <BarChart3Icon className="h-4 w-4" />
                Métricas
              </Tabs.Trigger>
            </Tabs.List>

            {/* Items Tab */}
            <Tabs.Content value={TAB_ITEMS} className="pt-4">
              {itemsLoading ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Gasto acumulado</TableHead>
                        <TableHead>% Cumplimiento</TableHead>
                        <TableHead>% Validado por IA</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay ítems de presupuesto.{' '}
                    <button
                      type="button"
                      className="text-foreground underline underline-offset-2"
                      onClick={() => setCreateOpen(true)}
                    >
                      Crear uno
                    </button>
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Gasto acumulado</TableHead>
                        <TableHead className="text-center">% Cumplimiento</TableHead>
                        <TableHead className="text-center">% Validado por IA</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="font-medium">
                              {formatCLP(item.spentAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              de {formatCLP(item.scaledBudget)}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <ComplianceBadge pct={item.compliancePct} />
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <ShieldCheckIcon className="h-3.5 w-3.5" />
                              —
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                title="Ver detalle"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Eliminar"
                                disabled={deletingId === item.id}
                                onClick={() => { handleDelete(item); }}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Tabs.Content>

            {/* Metrics Tab */}
            <Tabs.Content value={TAB_METRICS} className="pt-4">
              <MetricsTab
                metrics={metrics}
                loading={metricsLoading}
                items={items}
                onFilterChange={handleMetricsFilterChange}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {/* Create dialog */}
      <CreateBudgetItemDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgIdRef.current ?? ''}
        suppliers={suppliers}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function ComplianceBadge({ pct }: { pct: number }): React.JSX.Element {
  const isOver = pct > 100;
  const isWarn = pct >= 80 && pct <= 100;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isOver
          ? 'bg-destructive/15 text-destructive'
          : isWarn
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {pct}%
    </span>
  );
}
