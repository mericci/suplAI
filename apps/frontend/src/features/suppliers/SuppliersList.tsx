'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  InfoIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listSuppliersByOrg } from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import { formatRut } from '@/lib/rut';
import { getMe } from '@/integrations/backend/users';
import { CreateSupplierSheet } from './CreateSupplierSheet';

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

const RESPALDO_CONFIG = {
  none: { label: 'Sin respaldo', className: 'bg-gray-100 text-gray-600' },
  manual_insight: { label: 'Insight manual', className: 'bg-amber-100 text-amber-700' },
  validated_document: { label: 'Estructura validada', className: 'bg-green-100 text-green-700' },
} as const;

function RespaldoBadge({ type }: { type: 'none' | 'manual_insight' | 'validated_document' }): React.JSX.Element {
  const config = RESPALDO_CONFIG[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

type SortDirection = 'desc' | 'asc' | null;
interface SortConfig { column: string | null; direction: SortDirection; }
const DEFAULT_SORT: SortConfig = { column: null, direction: null };

// Columns that are sorted via DB ORDER BY (real columns)
const DB_SORT_COLUMNS: Record<string, string> = {
  nombre: 'legal_name',
  rut: 'tax_identifier',
};

// Columns sorted client-side (computed amounts)
const AMOUNT_SORT_COLUMNS = new Set(['pendiente', 'aprobado', 'pagado', 'total']);

const AMOUNT_SORT_KEY: Record<string, keyof Supplier> = {
  pendiente: 'pendingAmount',
  aprobado: 'approvedAmount',
  pagado: 'paidAmount',
  total: 'totalInvoiceAmount',
};

function SortIcon({ column, sortConfig }: { column: string; sortConfig: SortConfig }): React.JSX.Element {
  if (sortConfig.column !== column) return <ChevronsUpDownIcon className="h-3 w-3 text-muted-foreground" />;
  if (sortConfig.direction === 'desc') return <ChevronDownIcon className="h-3 w-3" />;
  return <ChevronUpIcon className="h-3 w-3" />;
}

const PAGE_SIZE = 10;

// Session-scoped cache — survives re-renders and pagination, resets on full reload
let cachedOrgId: string | null = null;
const supplierPageCache = new Map<string, { suppliers: Supplier[]; pagination: Pagination }>();

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function SuppliersList(): React.JSX.Element {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSortChangeRef = useRef(false);

  // Debounce search input — reset to page 1 on new query
  const handleSearchChange = (value: string): void => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
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

  useEffect(() => {
    const fetchSuppliers = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Step 1 — org ID (cached after first call)
        if (!cachedOrgId) {
          const meResponse = await getMe();
          if (!meResponse.success || !meResponse.data) {
            setError(meResponse.error ?? 'Error al obtener usuario');
            return;
          }
          cachedOrgId = meResponse.data.organization_id;
        }

        const isAmountSort = sortConfig.column !== null && AMOUNT_SORT_COLUMNS.has(sortConfig.column);
        const isDbSort = sortConfig.column !== null && !isAmountSort;

        const cacheKey = `${cachedOrgId}:${currentPage}:${debouncedSearch}:${sortConfig.column ?? ''}:${sortConfig.direction ?? ''}`;

        if (supplierPageCache.has(cacheKey)) {
          const cached = supplierPageCache.get(cacheKey)!;
          setSuppliers(cached.suppliers);
          setPagination(cached.pagination);
          return;
        }

        if (isAmountSort) {
          // Fetch all suppliers (up to 500) and sort client-side
          const response = await listSuppliersByOrg(cachedOrgId, {
            page: 1,
            limit: 500,
            search: debouncedSearch || undefined,
          });

          if (!response.success) {
            setError('Error al cargar proveedores');
            return;
          }

          const sortKey = AMOUNT_SORT_KEY[sortConfig.column!];
          const sorted = [...response.data].sort((a, b) => {
            const aVal = a[sortKey] as number;
            const bVal = b[sortKey] as number;
            return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
          });

          const fakePagination: Pagination = {
            page: 1,
            limit: sorted.length,
            total: sorted.length,
            totalPages: 1,
          };

          supplierPageCache.set(cacheKey, { suppliers: sorted, pagination: fakePagination });
          setSuppliers(sorted);
          setPagination(fakePagination);
        } else {
          // Normal paginated fetch — optionally with backend sort for DB columns
          const response = await listSuppliersByOrg(cachedOrgId, {
            page: currentPage,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
            ...(isDbSort ? {
              sortBy: DB_SORT_COLUMNS[sortConfig.column!],
              sortDir: sortConfig.direction!,
            } : {}),
          });

          if (!response.success) {
            setError('Error al cargar proveedores');
            return;
          }

          const { data: items, pagination: pag } = response;
          supplierPageCache.set(cacheKey, { suppliers: items, pagination: pag });
          setSuppliers(items);
          setPagination(pag);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar proveedores',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [currentPage, debouncedSearch, sortConfig, refreshKey]);

  function handleSupplierCreated(): void {
    supplierPageCache.clear();
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setSortConfig(DEFAULT_SORT);
    setRefreshKey((k) => k + 1);
  }

  const isAmountSort = sortConfig.column !== null && AMOUNT_SORT_COLUMNS.has(sortConfig.column);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Proveedores</h1>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RUT..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <CreateSupplierSheet onSuccess={handleSupplierCreated} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Cargando proveedores...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Desktop table (md+) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => handleSort('nombre')}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Nombre
                        <SortIcon column="nombre" sortConfig={sortConfig} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => handleSort('rut')}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        RUT
                        <SortIcon column="rut" sortConfig={sortConfig} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('pendiente')}
                        className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                      >
                        Pendiente
                        <SortIcon column="pendiente" sortConfig={sortConfig} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('aprobado')}
                        className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                      >
                        Aprobado
                        <SortIcon column="aprobado" sortConfig={sortConfig} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('pagado')}
                        className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                      >
                        Pagado
                        <SortIcon column="pagado" sortConfig={sortConfig} />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleSort('total')}
                              className="inline-flex items-center gap-1 hover:text-foreground ml-auto"
                            >
                              Total
                              <InfoIcon className="h-3 w-3 text-muted-foreground" />
                              <SortIcon column="total" sortConfig={sortConfig} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-center">
                            Suma de facturas pendientes, aprobadas y pagadas.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1 cursor-default">
                            Respaldo
                            <InfoIcon className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-center">
                            Indica si el proveedor tiene documentación de respaldo. &quot;Estructura validada&quot; requiere un contrato de costo.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/providers/${supplier.id}`)}
                    >
                      <TableCell>
                        <span className="font-medium truncate max-w-[280px] block">
                          {supplier.legalName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatRut(supplier.taxIdentifier)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {formatCLP(supplier.pendingAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {formatCLP(supplier.approvedAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {formatCLP(supplier.paidAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCLP(supplier.totalInvoiceAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <RespaldoBadge type={supplier.respaldoType} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No se encontraron proveedores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards (< md) */}
            <div className="flex flex-col gap-3 p-4 md:hidden">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="rounded-lg border bg-card p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/providers/${supplier.id}`)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{supplier.legalName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRut(supplier.taxIdentifier)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pendiente</span>
                      <span>{formatCLP(supplier.pendingAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Aprobado</span>
                      <span>{formatCLP(supplier.approvedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pagado</span>
                      <span>{formatCLP(supplier.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span>Total</span>
                      <span>{formatCLP(supplier.totalInvoiceAmount)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <RespaldoBadge type={supplier.respaldoType} />
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">
                  No se encontraron proveedores
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination footer — hidden when amount sort is active (all results shown) */}
      {pagination && pagination.totalPages > 1 && !isAmountSort && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {`Página ${pagination.page} de ${pagination.totalPages} — ${pagination.total} proveedores`}
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
