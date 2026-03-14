'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — reset to page 1 on new query
  const handleSearchChange = (value: string): void => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(value);
    }, 350);
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

        // Step 2 — supplier page (cache hit = skip API call entirely)
        const cacheKey = `${cachedOrgId}:${currentPage}:${debouncedSearch}`;
        if (supplierPageCache.has(cacheKey)) {
          const cached = supplierPageCache.get(cacheKey)!;
          setSuppliers(cached.suppliers);
          setPagination(cached.pagination);
          return;
        }

        // Step 3 — fetch from API (cache miss)
        const response = await listSuppliersByOrg(cachedOrgId, {
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });

        if (!response.success) {
          setError('Error al cargar proveedores');
          return;
        }

        const { data: items, pagination: pag } = response;
        supplierPageCache.set(cacheKey, { suppliers: items, pagination: pag });
        setSuppliers(items);
        setPagination(pag);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar proveedores',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [currentPage, debouncedSearch, refreshKey]);

  function handleSupplierCreated(): void {
    supplierPageCache.clear();
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setRefreshKey((k) => k + 1);
  }

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
                    <TableHead className="min-w-[200px]">Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1 cursor-default">
                            Monto Total
                            <InfoIcon className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-center">
                            Suma de facturas pendientes y aprobadas. Todo lo que se adeuda o ha sido pagado a este proveedor.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1 cursor-default">
                            Monto Aprobado
                            <InfoIcon className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-center">
                            Suma de facturas ya autorizadas para pago.
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
                        <span className="text-sm font-medium">
                          {formatCLP(supplier.totalInvoiceAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCLP(supplier.totalApprovedAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <RespaldoBadge type={supplier.respaldoType} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
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
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Monto Total</span>
                    <span>{formatCLP(supplier.totalInvoiceAmount)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Monto Aprobado</span>
                    <span>{formatCLP(supplier.totalApprovedAmount)}</span>
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

      {/* Pagination footer */}
      {pagination && pagination.totalPages > 1 && (
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
