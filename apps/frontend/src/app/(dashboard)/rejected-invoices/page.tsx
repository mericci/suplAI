'use client';

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
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

type SortDirection = 'desc' | 'asc' | null;
interface SortConfig { column: string | null; direction: SortDirection; }
const DEFAULT_SORT: SortConfig = { column: null, direction: null };

const COLUMN_TO_DB: Record<string, string> = {
  tipo: 'document_type',
  monto: 'gross_amount',
  emision: 'issue_date',
  vencimiento: 'due_date',
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

export default function RejectedInvoicesPage(): React.JSX.Element {
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
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSortChangeRef = useRef(false);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(value);
    }, 350);
  };

  const handleSort = (column: string): void => {
    isSortChangeRef.current = true;
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev.column !== column) return { column, direction: 'desc' };
      if (prev.direction === 'desc') return { column, direction: 'asc' };
      return DEFAULT_SORT;
    });
  };

  const getOrgId = useCallback(async (): Promise<string | null> => {
    if (cachedOrgId) return cachedOrgId;
    const meResponse = await getMe();
    if (!meResponse.success || !meResponse.data) return null;
    cachedOrgId = meResponse.data.organization_id;
    return cachedOrgId;
  }, []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId) return;
      const suppliersRes = await listSuppliersByOrg(orgId, { limit: 100 });
      if (suppliersRes.success) setSuppliers(suppliersRes.data);
    };
    init();
  }, [getOrgId]);

  useEffect(() => {
    const fetchInvoices = async (): Promise<void> => {
      try {
        const isSortChange = isSortChangeRef.current;
        isSortChangeRef.current = false;
        if (!isSortChange) setLoading(true);
        setError(null);

        const orgId = await getOrgId();
        if (!orgId) {
          setError('Error al obtener usuario');
          return;
        }

        const isProveedorSort = sortConfig.column === 'proveedor';
        const params: Parameters<typeof getOrgInvoices>[1] = {
          page: isProveedorSort ? 1 : currentPage,
          limit: isProveedorSort ? 500 : PAGE_SIZE,
          status: 'rejected',
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
        if (!isProveedorSort && sortConfig.column && sortConfig.direction) {
          params.sortBy = COLUMN_TO_DB[sortConfig.column];
          params.sortDir = sortConfig.direction;
        }

        const res = await getOrgInvoices(orgId, params);
        if (!res.success || !res.data) {
          setError('Error al cargar facturas');
          return;
        }

        const items = res.data.data;

        const uniqueSupplierIds = [...new Set(items.map((inv) => inv.supplierId))];
        const uncachedIds = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const results = await Promise.all(uncachedIds.map((id) => getSupplier(id)));
        results.forEach((r, i) => {
          if (r.success && r.data) supplierNameCache.set(uncachedIds[i], r.data.legalName);
        });

        let enriched: EnrichedInvoice[] = items.map((inv) => ({
          ...inv,
          supplierName: supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
        }));

        if (isProveedorSort && sortConfig.direction) {
          enriched = enriched.sort((a, b) => {
            const cmp = a.supplierName.localeCompare(b.supplierName, 'es');
            return sortConfig.direction === 'asc' ? cmp : -cmp;
          });
          const start = (currentPage - 1) * PAGE_SIZE;
          setInvoices(enriched.slice(start, start + PAGE_SIZE));
          setPagination({
            page: currentPage,
            limit: PAGE_SIZE,
            total: enriched.length,
            totalPages: Math.ceil(enriched.length / PAGE_SIZE),
          });
        } else {
          setInvoices(enriched);
          setPagination({
            page: currentPage,
            limit: PAGE_SIZE,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage, appliedFilters, debouncedSearch, getOrgId, sortConfig]);

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

  const filtered = invoices.filter(
    (inv) => !debouncedSearch
      || inv.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.documentNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.issuerTaxIdentifier.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  function SortIcon({ column }: { column: string }): React.JSX.Element {
    if (sortConfig.column !== column) {
      return <ChevronsUpDownIcon className="inline h-3.5 w-3.5 ml-1 text-muted-foreground/40" aria-hidden="true" />;
    }
    return sortConfig.direction === 'desc'
      ? <ChevronDownIcon className="inline h-4 w-4 ml-1 text-primary" aria-hidden="true" />
      : <ChevronUpIcon className="inline h-4 w-4 ml-1 text-primary" aria-hidden="true" />;
  }

  function getSortAriaValue(col: string): 'ascending' | 'descending' | 'none' {
    if (sortConfig.column !== col) return 'none';
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Rechazadas</h1>
      </header>

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
                    <TableHead
                      aria-sort={getSortAriaValue('proveedor')}
                      className="min-w-[200px] cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSort('proveedor')}
                    >
                      Proveedor
                      <SortIcon column="proveedor" />
                    </TableHead>
                    <TableHead
                      aria-sort={getSortAriaValue('tipo')}
                      className="cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSort('tipo')}
                    >
                      Tipo
                      <SortIcon column="tipo" />
                    </TableHead>
                    <TableHead
                      aria-sort={getSortAriaValue('monto')}
                      className="text-right cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSort('monto')}
                    >
                      Monto
                      <SortIcon column="monto" />
                    </TableHead>
                    <TableHead
                      aria-sort={getSortAriaValue('emision')}
                      className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSort('emision')}
                    >
                      Emisión
                      <SortIcon column="emision" />
                    </TableHead>
                    <TableHead
                      aria-sort={getSortAriaValue('vencimiento')}
                      className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSort('vencimiento')}
                    >
                      Vencimiento
                      <SortIcon column="vencimiento" />
                    </TableHead>
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
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">{formatDate(inv.issueDate)}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">{formatDate(inv.dueDate)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No hay facturas rechazadas
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
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{inv.supplierName}</span>
                    <span className="text-xs text-muted-foreground">
                      {inv.issuerTaxIdentifier}
                      {' · N° '}
                      {inv.documentNumber}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{inv.documentType}</Badge>
                    <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex flex-col gap-0.5">
                    <span>
                      {'Emisión: '}
                      <strong>{formatDate(inv.issueDate)}</strong>
                    </span>
                    <span>
                      {'Vencimiento: '}
                      <strong>{formatDate(inv.dueDate)}</strong>
                    </span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">
                  No hay facturas rechazadas
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
