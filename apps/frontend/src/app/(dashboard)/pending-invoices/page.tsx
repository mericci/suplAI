'use client';

import { useEffect, useState } from 'react';
import { SearchIcon, FilterIcon, MoreHorizontalIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe } from '@/integrations/backend/users';
import { getSupplier } from '@/integrations/backend/suppliers';
import { syncInvoices } from '@/services/invoice-service';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

// Session-scoped cache — survives re-renders and pagination, resets on full reload
let hasSynced = false;
let cachedOrgId: string | null = null;
const invoicePageCache = new Map<string, { invoices: EnrichedInvoice[]; pagination: Pagination }>();
const supplierNameCache = new Map<string, string>();

/* ------------------------------------------------------------------ */
/*  Mock helpers — fields not yet returned by the backend              */
/* ------------------------------------------------------------------ */

type AiReview =
  | 'Validado'
  | 'Nuevo proveedor'
  | 'Monto erróneo'
  | 'Supera presupuesto'
  | 'Error de revisión';

interface EnrichedInvoice extends Invoice {
  supplierName: string;
  meritDays: number;
  aiReview: AiReview;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0;
  }
  return Math.abs(hash);
}

function enrichInvoice(inv: Invoice, supplierName: string): EnrichedInvoice {
  const seed = seededRandom(inv.id);
  const aiOptions: AiReview[] = [
    'Validado',
    'Nuevo proveedor',
    'Monto erróneo',
    'Supera presupuesto',
    'Error de revisión',
  ];

  return {
    ...inv,
    supplierName,
    meritDays: (seed % 10) + 1,
    aiReview: aiOptions[seed % aiOptions.length],
  };
}

/* ------------------------------------------------------------------ */
/*  Badge variant helpers                                              */
/* ------------------------------------------------------------------ */

function aiReviewClasses(review: AiReview): string {
  switch (review) {
    case 'Validado':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Nuevo proveedor':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Monto erróneo':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Supera presupuesto':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Error de revisión':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return '';
  }
}

function stateClasses(status: Invoice['status']): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-orange-100 text-orange-800 border-orange-200';
  }
}

function statusLabel(status: Invoice['status']): string {
  switch (status) {
    case 'approved': return 'Aprobada';
    case 'rejected': return 'Rechazada';
    case 'pending':
    default: return 'Pendiente';
  }
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PendingInvoicesPage(): React.JSX.Element {
  const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const fetchInvoices = async (): Promise<void> => {
      try {
        setLoading(true);

        // Step 1 — org ID (cached after first call)
        if (!cachedOrgId) {
          const meResponse = await getMe();
          if (!meResponse.success || !meResponse.data) {
            setError(meResponse.error ?? 'Error al obtener usuario');
            return;
          }
          cachedOrgId = meResponse.data.organization_id;
        }

        // Step 2 — SII sync (once per session; non-blocking on failure)
        if (!hasSynced) {
          setSyncing(true);
          try {
            const syncResult = await syncInvoices(cachedOrgId);
            if (!syncResult.success) {
              setSyncFailed(true);
            }
          } catch (syncErr) {
            // eslint-disable-next-line no-console
            console.error('SII sync failed, proceeding with cached DB data:', syncErr);
            setSyncFailed(true);
          } finally {
            hasSynced = true;
            setSyncing(false);
          }
        }

        // Step 3 — invoice page (cache hit = skip API call entirely)
        const cacheKey = `${cachedOrgId}:${currentPage}`;
        if (invoicePageCache.has(cacheKey)) {
          const cached = invoicePageCache.get(cacheKey)!;
          setInvoices(cached.invoices);
          setPagination(cached.pagination);
          return;
        }

        // Step 4 — fetch from API (cache miss)
        const response = await getOrgInvoices(cachedOrgId, {
          status: 'pending',
          page: currentPage,
          limit: PAGE_SIZE,
        });

        if (!response.success || !response.data) {
          setError('Error al cargar facturas');
          return;
        }

        const { data: items, pagination: pag } = response.data;

        // Step 5 — suppliers (only fetch ones not already in supplierNameCache)
        const uniqueSupplierIds = [...new Set(items.map((inv) => inv.supplierId))];
        const uncachedIds = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const results = await Promise.all(uncachedIds.map((id) => getSupplier(id)));
        results.forEach((res, i) => {
          if (res.success && res.data) supplierNameCache.set(uncachedIds[i], res.data.legalName);
        });

        // Step 6 — enrich and store in invoicePageCache
        const enriched = items.map((inv) => enrichInvoice(inv, supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier));
        invoicePageCache.set(cacheKey, { invoices: enriched, pagination: pag });
        setInvoices(enriched);
        setPagination(pag);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar facturas',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage]);

  const filtered = invoices.filter(
    (inv) => inv.supplierName.toLowerCase().includes(search.toLowerCase())
      || inv.documentNumber.toLowerCase().includes(search.toLowerCase())
      || inv.issuerTaxIdentifier.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Pendientes</h1>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor o folio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <FilterIcon className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

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
                <span>
                  No se pudo sincronizar con el SII. Se muestran los datos guardados en la base de datos.
                </span>
              </div>
            )}
            {/* Desktop table (md+) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      Proveedor
                    </TableHead>
                    <TableHead>Tipo Documento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      Mérito
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      Emisión
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Revisión IA
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[60px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[220px]">
                            {inv.supplierName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {inv.issuerTaxIdentifier}
                            {' · '}
                            {`N° ${inv.documentNumber}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {inv.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCLP(inv.grossAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span
                          className={cn(
                            'text-sm',
                            inv.meritDays <= 3
                              && 'font-semibold text-red-600',
                          )}
                        >
                          {inv.meritDays}
                          {' '}
                          días
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <span className="text-sm">
                          {formatDate(inv.issueDate)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge
                          variant="outline"
                          className={cn(
                            'whitespace-nowrap',
                            aiReviewClasses(inv.aiReview),
                          )}
                        >
                          {inv.aiReview}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'whitespace-nowrap',
                            stateClasses(inv.status),
                          )}
                        >
                          {statusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                            <DropdownMenuItem>Aprobar</DropdownMenuItem>
                            <DropdownMenuItem>Rechazar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No se encontraron facturas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards (< md) */}
            <div className="flex flex-col gap-3 p-4 md:hidden">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{inv.supplierName}</span>
                      <span className="text-xs text-muted-foreground">
                        {inv.issuerTaxIdentifier}
                        {' · '}
                        {`N° ${inv.documentNumber}`}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                        <DropdownMenuItem>Aprobar</DropdownMenuItem>
                        <DropdownMenuItem>Rechazar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {inv.documentType}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCLP(inv.grossAmount)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        aiReviewClasses(inv.aiReview),
                      )}
                    >
                      {inv.aiReview}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        stateClasses(inv.status),
                      )}
                    >
                      {statusLabel(inv.status)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {'Mérito: '}
                      <strong
                        className={cn(
                          inv.meritDays <= 3 && 'text-red-600',
                        )}
                      >
                        {inv.meritDays}
                        {' '}
                        días
                      </strong>
                    </span>
                    <span>
                      {'Emision: '}
                      <strong>
                        {formatDate(inv.issueDate)}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-10 text-center text-muted-foreground">
                  No se encontraron facturas
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
