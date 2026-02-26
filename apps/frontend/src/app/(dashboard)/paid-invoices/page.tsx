'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  XIcon,
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
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe } from '@/integrations/backend/users';
import { getSupplier, listSuppliersByOrg } from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import { payInvoice } from '@/integrations/backend/invoices';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type AmountOp = 'gte' | 'lte' | 'eq';

interface Filters {
  supplierId: string;
  amountOp: AmountOp;
  amountValue: string;
}

const DEFAULT_FILTERS: Filters = {
  supplierId: 'all',
  amountOp: 'gte',
  amountValue: '',
};

let cachedOrgId: string | null = null;
const supplierNameCache = new Map<string, string>();

interface EnrichedInvoice extends Invoice {
  supplierName: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export default function PaidInvoicesPage(): React.JSX.Element {
  const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

        // Show paid + approved invoices in this view
        const params: Parameters<typeof getOrgInvoices>[1] = {
          page: currentPage,
          limit: PAGE_SIZE,
          // No status filter = all, but we want paid + approved
          // We'll fetch all and filter, or use supplierId/amount
        };

        if (appliedFilters.supplierId !== 'all') {
          params.supplierId = appliedFilters.supplierId;
        }
        const amtVal = parseFloat(appliedFilters.amountValue);
        if (!Number.isNaN(amtVal) && appliedFilters.amountValue !== '') {
          if (appliedFilters.amountOp === 'gte') params.grossAmountGte = amtVal;
          else if (appliedFilters.amountOp === 'lte') params.grossAmountLte = amtVal;
          else params.grossAmountEq = amtVal;
        }

        // Fetch approved invoices (can be marked as paid)
        const [approvedRes, paidRes] = await Promise.all([
          getOrgInvoices(orgId, { ...params, status: 'approved' }),
          getOrgInvoices(orgId, { ...params, status: 'paid' }),
        ]);

        const approvedItems = (approvedRes.success && approvedRes.data) ? approvedRes.data.data : [];
        const paidItems = (paidRes.success && paidRes.data) ? paidRes.data.data : [];
        const combinedItems = [...paidItems, ...approvedItems];

        const paginationData: Pagination = {
          page: currentPage,
          limit: PAGE_SIZE,
          total: (approvedRes.data?.pagination.total ?? 0) + (paidRes.data?.pagination.total ?? 0),
          totalPages: Math.ceil(
            ((approvedRes.data?.pagination.total ?? 0) + (paidRes.data?.pagination.total ?? 0)) / PAGE_SIZE,
          ),
        };

        // Fetch missing supplier names
        const uniqueSupplierIds = [...new Set(combinedItems.map((inv) => inv.supplierId))];
        const uncachedIds = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const results = await Promise.all(uncachedIds.map((id) => getSupplier(id)));
        results.forEach((res, i) => {
          if (res.success && res.data) supplierNameCache.set(uncachedIds[i], res.data.legalName);
        });

        const enriched: EnrichedInvoice[] = combinedItems.map((inv) => ({
          ...inv,
          supplierName: supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
        }));

        setInvoices(enriched);
        setPagination(paginationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters, debouncedSearch, getOrgId]);

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
    appliedFilters.supplierId !== 'all',
    appliedFilters.amountValue !== '',
  ].filter(Boolean).length;

  const handleMarkAsPaid = async (inv: EnrichedInvoice): Promise<void> => {
    if (inv.status !== 'approved') return;
    const orgId = await getOrgId();
    if (!orgId) return;
    setActionLoading(inv.id);
    try {
      await payInvoice(orgId, inv.id);
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'paid' } : i));
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

  const totalApproved = filtered.reduce(
    (sum, inv) => sum + (inv.status === 'approved' ? (inv.grossAmount ?? 0) : 0), 0,
  );
  const totalPaid = filtered.reduce(
    (sum, inv) => sum + (inv.status === 'paid' ? (inv.grossAmount ?? 0) : 0), 0,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Ya pagado</h1>
      </header>

      {/* Summary cards */}
      <div className="flex gap-4 border-b px-4 py-3">
        <div className="rounded-lg border bg-emerald-50 px-4 py-2">
          <p className="text-xs text-emerald-700">Por pagar (aprobadas)</p>
          <p className="text-lg font-semibold text-emerald-800">{formatCLP(totalApproved)}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 px-4 py-2">
          <p className="text-xs text-blue-700">Pagadas</p>
          <p className="text-lg font-semibold text-blue-800">{formatCLP(totalPaid)}</p>
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
                    <SelectItem key={s.id} value={s.id}>{s.legalName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex gap-2">
              <Button size="sm" onClick={handleApplyFilters}>Aplicar</Button>
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
            <p className="text-muted-foreground">Cargando facturas...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Emisión</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[60px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id} className={inv.status === 'paid' ? 'opacity-70' : ''}>
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
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">{formatDate(inv.issueDate)}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">{formatDate(inv.dueDate)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'whitespace-nowrap',
                            inv.status === 'paid'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          )}
                        >
                          {inv.status === 'paid' ? 'Pagada' : 'Aprobada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.status === 'approved' && (
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
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(inv)}>
                                Marcar como pagada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No hay facturas aprobadas ni pagadas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 p-4 md:hidden">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className={cn('rounded-lg border bg-card p-4 shadow-sm', inv.status === 'paid' && 'opacity-70')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{inv.supplierName}</span>
                      <span className="text-xs text-muted-foreground">
                        {inv.issuerTaxIdentifier}
                        {' · N° '}
                        {inv.documentNumber}
                      </span>
                    </div>
                    {inv.status === 'approved' && (
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
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(inv)}>
                            Marcar como pagada
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{inv.documentType}</Badge>
                    <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {'Emisión: '}
                      <strong>{formatDate(inv.issueDate)}</strong>
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        inv.status === 'paid'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      )}
                    >
                      {inv.status === 'paid' ? 'Pagada' : 'Aprobada'}
                    </Badge>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">
                  No hay facturas aprobadas ni pagadas
                </p>
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
