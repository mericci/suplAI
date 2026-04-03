'use client';

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  XIcon,
  ReceiptIcon,
  LoaderIcon,
} from 'lucide-react';
import type { NominaWithInvoiceIds } from '@supl/shared';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe } from '@/integrations/backend/users';
import { getSupplier, listSuppliersByOrg } from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import { listNominas } from '@/integrations/backend/nominas';
import { NominaProfileSheet } from '@/features/nominas/components/nomina-profile-sheet';
import { createClient } from '@/lib/supabase/client';
import { NOMINA_STATUS, NOMINA_STATUS_LABELS } from '@/features/nominas/constants';

const PAGE_SIZE = 10;

const PAID_TAB = {
  FACTURAS: 'facturas',
  NOMINAS: 'nominas',
} as const;

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
  aprobacion: 'approved_at',
  pago: 'paid_at',
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

interface InvoiceDialogState {
  open: boolean;
  nomina: NominaWithInvoiceIds | null;
  invoices: Invoice[];
  loading: boolean;
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

async function openVoucherUrl(bucket: string, path: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return;
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export default function PaidInvoicesPage(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(PAID_TAB.FACTURAS);
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
  const [nominas, setNominas] = useState<NominaWithInvoiceIds[]>([]);
  const [nominasLoading, setNominasLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState<string | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState<InvoiceDialogState>({
    open: false,
    nomina: null,
    invoices: [],
    loading: false,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState<NominaWithInvoiceIds | null>(null);
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

  // Load suppliers and paid nominas on mount
  useEffect(() => {
    const init = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId) return;

      const suppliersRes = await listSuppliersByOrg(orgId, { limit: 100 });
      if (suppliersRes.success) setSuppliers(suppliersRes.data);

      setNominasLoading(true);
      try {
        const res = await listNominas(orgId);
        if (res.success && res.data) {
          setNominas(res.data.filter((n) => n.status === NOMINA_STATUS.PAID));
        }
      } finally {
        setNominasLoading(false);
      }
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
          status: 'paid',
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

  const handleViewVoucher = async (nomina: NominaWithInvoiceIds): Promise<void> => {
    if (!nomina.voucherStorageBucket || !nomina.voucherStoragePath) return;
    setVoucherLoading(nomina.id);
    try {
      await openVoucherUrl(nomina.voucherStorageBucket, nomina.voucherStoragePath);
    } finally {
      setVoucherLoading(null);
    }
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
        <h1 className="text-lg font-semibold">Ya pagado</h1>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="border-b px-4 pt-2">
          <TabsList variant="line">
            <TabsTrigger value={PAID_TAB.FACTURAS}>Facturas Pagadas</TabsTrigger>
            <TabsTrigger value={PAID_TAB.NOMINAS}>Nóminas</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Facturas Pagadas tab ── */}
        <TabsContent value={PAID_TAB.FACTURAS} className="flex flex-col flex-1 min-h-0">
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
                          Proveedor<SortIcon column="proveedor" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('tipo')}
                          className="cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('tipo')}
                        >
                          Tipo<SortIcon column="tipo" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('monto')}
                          className="text-right cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('monto')}
                        >
                          Monto<SortIcon column="monto" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('emision')}
                          className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('emision')}
                        >
                          Emisión<SortIcon column="emision" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('vencimiento')}
                          className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('vencimiento')}
                        >
                          Vencimiento<SortIcon column="vencimiento" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('aprobacion')}
                          className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('aprobacion')}
                        >
                          F. Aprobación<SortIcon column="aprobacion" />
                        </TableHead>
                        <TableHead
                          aria-sort={getSortAriaValue('pago')}
                          className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handleSort('pago')}
                        >
                          F. Pago<SortIcon column="pago" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((inv) => (
                        <TableRow key={inv.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
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
                          <TableCell className="hidden lg:table-cell text-center">
                            <span className="text-sm">{formatDate(inv.approvedAt)}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            <span className="text-sm">{formatDate(inv.paidAt)}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                            No hay facturas pagadas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="flex flex-col gap-3 p-4 md:hidden">
                  {filtered.map((inv) => (
                    <div key={inv.id} className="rounded-lg border bg-card p-4 shadow-sm cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
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
                          {'F. Aprobación: '}
                          <strong>{formatDate(inv.approvedAt)}</strong>
                        </span>
                        <span>
                          {'F. Pago: '}
                          <strong>{formatDate(inv.paidAt)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="py-10 text-center text-muted-foreground">
                      No hay facturas pagadas
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
        </TabsContent>

        {/* ── Nóminas tab ── */}
        <TabsContent value={PAID_TAB.NOMINAS} className="flex flex-col flex-1 min-h-0 overflow-auto">
          <div className="p-4">
            {nominasLoading && (
              <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando nóminas...</p>
              </div>
            )}
            {!nominasLoading && (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha de pago</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">N° Facturas</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nominas.map((nom) => (
                        <TableRow
                          key={nom.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => { setSelectedNomina(nom); setSheetOpen(true); }}
                        >
                          <TableCell className="text-sm">{formatDate(nom.paidAt)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCLP(nom.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center text-sm">{nom.invoiceCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default">
                              {NOMINA_STATUS_LABELS[nom.status] ?? nom.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                              role="presentation"
                            >
                              {nom.voucherStoragePath && nom.voucherStorageBucket && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                  disabled={voucherLoading === nom.id}
                                  onClick={() => handleViewVoucher(nom)}
                                >
                                  {voucherLoading === nom.id
                                    ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                                    : <ReceiptIcon className="h-3.5 w-3.5" />}
                                  Comprobante
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {nominas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No hay nóminas pagadas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {nominas.map((nom) => (
                    <button
                      key={nom.id}
                      type="button"
                      className="rounded-lg border bg-card p-4 shadow-sm text-left w-full hover:bg-accent/30 transition-colors"
                      onClick={() => { setSelectedNomina(nom); setSheetOpen(true); }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{formatCLP(nom.totalAmount)}</span>
                          <span className="text-xs text-muted-foreground">
                            {`${nom.invoiceCount} facturas · Pagado el ${formatDate(nom.paidAt)}`}
                          </span>
                        </div>
                        <Badge variant="default" className="shrink-0 text-xs">
                          {NOMINA_STATUS_LABELS[nom.status] ?? nom.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {nominas.length === 0 && (
                    <p className="py-10 text-center text-muted-foreground">
                      No hay nóminas pagadas
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice details dialog */}
      <Dialog
        open={invoiceDialog.open}
        onOpenChange={(open) => setInvoiceDialog((s) => ({ ...s, open }))}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {invoiceDialog.nomina
                ? `Nómina del ${formatDate(invoiceDialog.nomina.createdAt)} — ${formatCLP(invoiceDialog.nomina.totalAmount)}`
                : 'Facturas de la nómina'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {invoiceDialog.loading && (
              <div className="flex items-center justify-center py-10">
                <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!invoiceDialog.loading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">F. Emisión</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">F. Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceDialog.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {`${inv.issuerTaxIdentifier} · N° ${inv.documentNumber}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCLP(inv.grossAmount)}
                      </TableCell>
                      <TableCell className="text-center text-sm hidden sm:table-cell">
                        {formatDate(inv.issueDate)}
                      </TableCell>
                      <TableCell className="text-center text-sm hidden sm:table-cell">
                        {formatDate(inv.paidAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoiceDialog.invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No se encontraron facturas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nomina profile sheet (read-only for paid nominas) */}
      <NominaProfileSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        nomina={selectedNomina}
        orgId={cachedOrgId ?? ''}
        isAdmin={false}
        lockedInvoiceIds={new Set()}
        onNominaUpdated={() => {}}
        onNominaPaid={() => {}}
        onNominaDeleted={() => {}}
        onViewVoucher={handleViewVoucher}
      />
    </div>
  );
}
