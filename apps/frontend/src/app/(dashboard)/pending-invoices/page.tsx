'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  XIcon,
  InfoIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe } from '@/integrations/backend/users';
import { getSupplier, listSuppliersByOrg } from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import { getOrganization } from '@/integrations/backend/organizations';
import { approveInvoice, rejectInvoice, validateInvoice } from '@/integrations/backend/invoices';
import { getInvoiceBudgetStatuses } from '@/integrations/backend/budget';
import type { InvoiceBudgetStatus } from '@/integrations/backend/budget';
import { syncInvoices } from '@/services/invoice-service';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type AmountOp = 'gte' | 'lte' | 'eq';

interface Filters {
  status: string;
  supplierId: string;
  amountOp: AmountOp;
  amountValue: string;
}

const DEFAULT_FILTERS: Filters = {
  status: 'pending',
  supplierId: 'all',
  amountOp: 'gte',
  amountValue: '',
};

// Session-scoped cache — persists across navigations, resets on full page reload
let hasSynced = false;
let cachedOrgId: string | null = null;
let cachedLastSyncAt: string | null = null;
const supplierNameCache = new Map<string, string>();

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface EnrichedInvoice extends Invoice {
  supplierName: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

interface AiValidationBadgeProps {
  status: 'ok' | 'error' | null;
  notes: string | null;
  loading?: boolean;
}

function AiValidationBadge({ status, notes, loading }: AiValidationBadgeProps): React.JSX.Element {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
        Validando...
      </span>
    );
  }
  if (status === null) return <span className="text-sm text-muted-foreground">—</span>;
  const isOk = status === 'ok';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'whitespace-nowrap cursor-default',
              isOk
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-red-100 text-red-800 border-red-200',
            )}
          >
            {isOk ? 'IA: Válida' : 'IA: Revisar'}
          </Badge>
        </TooltipTrigger>
        {notes && (
          <TooltipContent side="top" className="max-w-[240px]">
            <p className="text-xs">{notes}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

function statusClasses(status: Invoice['status']): string {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
    default: return 'bg-orange-100 text-orange-800 border-orange-200';
  }
}

function statusLabel(status: Invoice['status']): string {
  switch (status) {
    case 'approved': return 'Aprobada';
    case 'rejected': return 'Rechazada';
    case 'paid': return 'Pagada';
    case 'pending':
    default: return 'Pendiente';
  }
}

function formatCLP(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns the days remaining until executiveTitleDate (issueDate + 8 days).
 * Positive = days left, 0 or negative = overdue.
 */
function daysUntilExecutiveTitle(issueDate: string): number {
  const executive = new Date(issueDate);
  executive.setDate(executive.getDate() + 8);
  executive.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((executive.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface MeritCellProps {
  issueDate: string;
  status: Invoice['status'];
}

function executiveTitleDateStr(issueDate: string): string {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + 8);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function MeritCell({ issueDate, status }: MeritCellProps): React.JSX.Element {
  const daysLeft = daysUntilExecutiveTitle(issueDate);
  const overdue = daysLeft <= 0;

  // Resolved invoices past the title date → dash
  if (overdue && status !== 'pending') {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  // Still pending and past the title date → red cross
  if (overdue && status === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm font-semibold text-red-600 cursor-default">✗</span>
          </TooltipTrigger>
          <TooltipContent>Plazo vencido — título ejecutivo al {executiveTitleDateStr(issueDate)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Countdown — red when 3 days or fewer remain
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('text-sm cursor-default', daysLeft <= 3 && 'font-semibold text-red-600')}>
            {daysLeft}
            {' días'}
          </span>
        </TooltipTrigger>
        <TooltipContent>Título ejecutivo el {executiveTitleDateStr(issueDate)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BudgetStatusCellProps {
  invoiceId: string;
  budgetStatuses: Record<string, InvoiceBudgetStatus>;
}

function BudgetStatusCell({ invoiceId, budgetStatuses }: BudgetStatusCellProps): React.JSX.Element {
  const budgetStatus = budgetStatuses[invoiceId];
  if (!budgetStatus || budgetStatus.status === 'no_budget') {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const exceeds = budgetStatus.status === 'exceeds';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'whitespace-nowrap cursor-default',
              exceeds
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200',
            )}
          >
            {exceeds ? 'Supera presupuesto' : 'En presupuesto'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-xs">
            {`Presupuesto: ${formatCLP(budgetStatus.budgetAmount)} — Gastado antes: ${formatCLP(budgetStatus.spentBefore)}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default function PendingInvoicesPage(): React.JSX.Element {
  const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(cachedLastSyncAt);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [budgetStatuses, setBudgetStatuses] = useState<Record<string, InvoiceBudgetStatus>>({});
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(value);
    }, 350);
  };

  const getOrgId = useCallback(async (): Promise<string | null> => {
    if (cachedOrgId) return cachedOrgId;
    const meResponse = await getMe();
    if (!meResponse.success || !meResponse.data) return null;
    cachedOrgId = meResponse.data.organization_id;
    return cachedOrgId;
  }, []);

  const doSync = useCallback(async (orgId: string, force = false): Promise<void> => {
    if (syncing) return;
    setSyncing(true);
    setSyncFailed(false);
    try {
      const result = await syncInvoices(orgId);
      if (!result.success) setSyncFailed(true);
      // Refresh org to get updated lastSiiSyncAt
      const orgResult = await getOrganization(orgId);
      if (orgResult.success && orgResult.data) {
        cachedLastSyncAt = orgResult.data.lastSiiSyncAt;
        setLastSyncAt(orgResult.data.lastSiiSyncAt);
      }
      if (force) {
        setRefreshKey((k) => k + 1);
      }
    } catch {
      setSyncFailed(true);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Load suppliers for filter dropdown
  useEffect(() => {
    const loadSuppliers = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId) return;
      const res = await listSuppliersByOrg(orgId, { limit: 100 });
      if (res.success) setSuppliers(res.data);
    };
    loadSuppliers();
  }, [getOrgId]);

  // After each invoice load, fetch accurate per-invoice budget statuses from the backend
  useEffect(() => {
    if (invoices.length === 0) return;
    const fetchBudgetStatuses = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId) return;
      const ids = invoices.map((inv) => inv.id);
      const res = await getInvoiceBudgetStatuses(orgId, ids);
      if (res.success && res.data) setBudgetStatuses(res.data);
    };
    fetchBudgetStatuses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  // Load org metadata (lastSiiSyncAt)
  useEffect(() => {
    const loadOrg = async (): Promise<void> => {
      if (cachedLastSyncAt !== null) return;
      const orgId = await getOrgId();
      if (!orgId) return;
      const res = await getOrganization(orgId);
      if (res.success && res.data) {
        cachedLastSyncAt = res.data.lastSiiSyncAt;
        setLastSyncAt(res.data.lastSiiSyncAt);
      }
    };
    loadOrg();
  }, [getOrgId]);

  useEffect(() => {
    const fetchInvoices = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const orgId = await getOrgId();
        if (!orgId) {
          setError('Error al obtener usuario');
          return;
        }

        // Build API params
        const params: Parameters<typeof getOrgInvoices>[1] = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (appliedFilters.status !== 'all') {
          params.status = appliedFilters.status as Invoice['status'];
        }
        if (appliedFilters.supplierId !== 'all') {
          params.supplierId = appliedFilters.supplierId;
        }
        const amtVal = parseFloat(appliedFilters.amountValue);
        if (!Number.isNaN(amtVal) && appliedFilters.amountValue !== '') {
          if (appliedFilters.amountOp === 'gte') params.grossAmountGte = amtVal;
          else if (appliedFilters.amountOp === 'lte') params.grossAmountLte = amtVal;
          else params.grossAmountEq = amtVal;
        }

        const response = await getOrgInvoices(orgId, params);
        if (!response.success || !response.data) {
          setError('Error al cargar facturas');
          return;
        }

        const { data: items, pagination: pag } = response.data;

        // Fetch missing supplier names
        const uniqueSupplierIds = [...new Set(items.map((inv) => inv.supplierId))];
        const uncachedIds = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const results = await Promise.all(uncachedIds.map((id) => getSupplier(id)));
        results.forEach((res, i) => {
          if (res.success && res.data) supplierNameCache.set(uncachedIds[i], res.data.legalName);
        });

        const enriched = items.map((inv) => ({
          ...inv,
          supplierName: supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
        }));
        setInvoices(enriched);
        setPagination(pag);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters, debouncedSearch, refreshKey, getOrgId]);

  // Auto-sync once per session (survives tab switching, resets on full reload)
  useEffect(() => {
    if (hasSynced) return;
    let mounted = true;
    const autoSync = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId || !mounted) return;
      hasSynced = true;
      await doSync(orgId);
    };
    autoSync();
    return () => { mounted = false; };
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (): void => {
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
    setShowFilters(false);
  };

  const handleClearFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const activeFilterCount = [
    appliedFilters.status !== DEFAULT_FILTERS.status,
    appliedFilters.supplierId !== 'all',
    appliedFilters.amountValue !== '',
  ].filter(Boolean).length;

  const handleRefresh = async (): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    await doSync(orgId, true);
  };

  const handleApprove = async (inv: EnrichedInvoice): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setActionLoading(inv.id);
    try {
      await approveInvoice(orgId, inv.id);
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'approved' } : i));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inv: EnrichedInvoice): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setActionLoading(inv.id);
    try {
      await rejectInvoice(orgId, inv.id);
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'rejected' } : i));
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateAi = async (inv: EnrichedInvoice): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setActionLoading(inv.id);
    try {
      const result = await validateInvoice(orgId, inv.id);
      if (result.success && result.data) {
        const { aiValidationStatus, aiValidationNotes } = result.data;
        setInvoices((prev) => prev.map((i) => (
          i.id === inv.id ? { ...i, aiValidationStatus, aiValidationNotes } : i
        )));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = invoices.filter(
    (inv) => !debouncedSearch
      || inv.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.documentNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.issuerTaxIdentifier.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const totalPending = filtered.reduce((sum, inv) => sum + (inv.grossAmount ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Facturas</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {'Últ. sincronización: '}
            <strong>{formatSyncTime(lastSyncAt)}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCwIcon className={cn('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Sincronizando...' : 'Actualizar'}
          </Button>
        </div>
      </header>

      {/* Summary card */}
      <div className="flex gap-4 border-b px-4 py-3">
        <div className="rounded-lg border bg-orange-50 px-4 py-2">
          <p className="text-xs text-orange-700">Por revisar (pendientes)</p>
          <p className="text-lg font-semibold text-orange-800">{formatCLP(totalPending)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor o folio..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="shrink-0 gap-2"
          onClick={() => setShowFilters((v) => !v)}
        >
          <FilterIcon className="h-4 w-4" />
          Filtrar
          {activeFilterCount > 0 && (
            <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Status filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Estado</span>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Proveedor</span>
              <Select
                value={filters.supplierId}
                onValueChange={(v) => setFilters((f) => ({ ...f, supplierId: v }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Monto bruto</span>
              <div className="flex gap-2">
                <Select
                  value={filters.amountOp}
                  onValueChange={(v) => setFilters((f) => ({ ...f, amountOp: v as AmountOp }))}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gte">&gt;=</SelectItem>
                    <SelectItem value="lte">&lt;=</SelectItem>
                    <SelectItem value="eq">=</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountValue}
                  onChange={(e) => setFilters((f) => ({ ...f, amountValue: e.target.value }))}
                  className="w-[120px]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApplyFilters}>
                Aplicar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClearFilters} className="gap-1">
                <XIcon className="h-3 w-3" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">
              {syncing ? 'Obteniendo últimas facturas del SII...' : 'Cargando facturas...'}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {syncFailed && (
              <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>⚠</span>
                <span>No se pudo sincronizar con el SII. Se muestran los datos guardados.</span>
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Proveedor</TableHead>
                    <TableHead>Tipo Documento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden lg:table-cell">Presupuesto</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1 cursor-default">
                            Mérito
                            <InfoIcon className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-center">
                            Días restantes hasta el título ejecutivo (fecha de emisión + 8 días).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Emisión</TableHead>
                    <TableHead className="hidden xl:table-cell">Revisión IA</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[60px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[220px]">{inv.supplierName}</span>
                          <span className="text-xs text-muted-foreground">
                            {inv.issuerTaxIdentifier}
                            {' · N° '}
                            {inv.documentNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">{inv.documentType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <BudgetStatusCell
                          invoiceId={inv.id}
                          budgetStatuses={budgetStatuses}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <MeritCell issueDate={inv.issueDate} status={inv.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">{formatDate(inv.issueDate)}</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <AiValidationBadge status={inv.aiValidationStatus} notes={inv.aiValidationNotes} loading={actionLoading === inv.id} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('whitespace-nowrap', statusClasses(inv.status))}>
                          {statusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={actionLoading === inv.id}
                            >
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {inv.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(inv)}>
                                  Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(inv)}>
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleValidateAi(inv)}>
                              Re-validar con IA
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        No se encontraron facturas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 p-4 md:hidden">
              {filtered.map((inv) => (
                <div key={inv.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{inv.supplierName}</span>
                      <span className="text-xs text-muted-foreground">
                        {inv.issuerTaxIdentifier}
                        {' · N° '}
                        {inv.documentNumber}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={actionLoading === inv.id}
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {inv.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(inv)}>Aprobar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(inv)}>Rechazar</DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleValidateAi(inv)}>
                          Re-validar con IA
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{inv.documentType}</Badge>
                    <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AiValidationBadge status={inv.aiValidationStatus} notes={inv.aiValidationNotes} loading={actionLoading === inv.id} />
                    <Badge variant="outline" className={cn('text-xs', statusClasses(inv.status))}>
                      {statusLabel(inv.status)}
                    </Badge>
                    <BudgetStatusCell
                      invoiceId={inv.id}
                      budgetStatuses={budgetStatuses}
                    />
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {'Mérito: '}
                      <strong><MeritCell issueDate={inv.issueDate} status={inv.status} /></strong>
                    </span>
                    <span>
                      {'Emisión: '}
                      <strong>{formatDate(inv.issueDate)}</strong>
                    </span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">No se encontraron facturas</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {`Página ${pagination.page} de ${pagination.totalPages} — ${pagination.total} facturas`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
