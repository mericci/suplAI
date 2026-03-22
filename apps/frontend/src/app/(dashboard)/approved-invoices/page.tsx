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
  MoreHorizontalIcon,
  XIcon,
  CheckCircle2Icon,
  XCircleIcon,
  DownloadIcon,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe, getUser } from '@/integrations/backend/users';
import type { User } from '@/integrations/backend/users';
import { getSupplier, listSuppliersByOrg, getSupplierPaymentInfo } from '@/integrations/backend/suppliers';
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

type SortDirection = 'desc' | 'asc' | null;
interface SortConfig { column: string | null; direction: SortDirection; }
const DEFAULT_SORT: SortConfig = { column: null, direction: null };

const COLUMN_TO_DB: Record<string, string> = {
  tipo: 'document_type',
  monto: 'gross_amount',
  emision: 'issue_date',
  aprobado_el: 'approved_at',
  plazo: 'executive_title_date',
};

let cachedOrgId: string | null = null;
const supplierNameCache = new Map<string, string>();
const userCache = new Map<string, User>();

interface EnrichedInvoice extends Invoice {
  supplierName: string;
  approver: User | null;
  aiValidated: boolean;
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

function getUserInitials(user: User): string {
  const first = user.first_name?.[0] ?? '';
  const last = user.last_name?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return user.email[0]?.toUpperCase() ?? '?';
}

function getUserDisplayName(user: User): string {
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return full || user.email;
}

/** Seeded deterministic pseudo-random — same logic as pending-invoices */
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

function computeAiValidated(invoiceId: string): boolean {
  const aiOptions = [
    'Validado',
    'Nuevo proveedor',
    'Monto erróneo',
    'Supera presupuesto',
    'Error de revisión',
  ] as const;
  return aiOptions[seededRandom(invoiceId) % aiOptions.length] === 'Validado';
}

function deadlineClass(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) return 'text-red-600 font-medium';
  if (daysLeft <= 3) return 'text-amber-600 font-medium';
  return 'text-foreground';
}

export default function ApprovedInvoicesPage(): React.JSX.Element {
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
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [downloadingNomina, setDownloadingNomina] = useState(false);
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
          status: 'approved',
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

        // Resolve supplier names
        const uniqueSupplierIds = [...new Set(items.map((inv) => inv.supplierId))];
        const uncachedSuppliers = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const supplierResults = await Promise.all(
          uncachedSuppliers.map((id) => getSupplier(id)),
        );
        supplierResults.forEach((r, i) => {
          if (r.success && r.data) supplierNameCache.set(uncachedSuppliers[i], r.data.legalName);
        });

        // Resolve approver user data
        const approverIds = [
          ...new Set(
            items
              .map((inv) => inv.approvedByUserId)
              .filter((id): id is string => id !== null),
          ),
        ];
        const uncachedApprovers = approverIds.filter((id) => !userCache.has(id));
        const userResults = await Promise.all(
          uncachedApprovers.map((id) => getUser(id)),
        );
        userResults.forEach((r, i) => {
          if (r.success && r.data) userCache.set(uncachedApprovers[i], r.data);
        });

        let enriched: EnrichedInvoice[] = items.map((inv) => ({
          ...inv,
          supplierName: supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
          approver: inv.approvedByUserId ? (userCache.get(inv.approvedByUserId) ?? null) : null,
          aiValidated: computeAiValidated(inv.id),
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

  const handleMarkAsPaid = async (inv: EnrichedInvoice): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setActionLoading(inv.id);
    try {
      await payInvoice(orgId, inv.id);
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
      setPagination((p) => {
        if (!p) return p;
        const newTotal = p.total - 1;
        return { ...p, total: newTotal, totalPages: Math.ceil(newTotal / PAGE_SIZE) };
      });
    } finally {
      setActionLoading(null);
    }
  };

  const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    cuenta_corriente: 'Cuenta Corriente',
    cuenta_vista: 'Cuenta Vista',
    cuenta_ahorro: 'Cuenta Ahorro',
    cuenta_rut: 'Cuenta RUT',
  };

  const handleDownloadNomina = async (): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setDownloadingNomina(true);
    try {
      const allInvoices: Invoice[] = [];
      let page = 1;
      const limit = 500;
      let totalPages = 1;
      do {
        // eslint-disable-next-line no-await-in-loop
        const res = await getOrgInvoices(orgId, { page, limit, status: 'approved' });
        if (!res.success || !res.data) return;
        allInvoices.push(...res.data.data);
        totalPages = res.data.pagination.totalPages;
        page += 1;
      } while (page <= totalPages);

      // Resolve supplier names for any not yet cached
      const uniqueSupplierIds = [...new Set(allInvoices.map((inv) => inv.supplierId))];
      const uncachedSuppliers = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
      const supplierResults = await Promise.all(uncachedSuppliers.map((id) => getSupplier(id)));
      supplierResults.forEach((r, i) => {
        if (r.success && r.data) supplierNameCache.set(uncachedSuppliers[i], r.data.legalName);
      });

      // Fetch payment info for all unique suppliers in parallel
      const paymentInfoMap = new Map<string, Awaited<ReturnType<typeof getSupplierPaymentInfo>>['data']>();
      await Promise.all(
        uniqueSupplierIds.map(async (id) => {
          const r = await getSupplierPaymentInfo(orgId, id);
          paymentInfoMap.set(id, r.success ? r.data : null);
        }),
      );

      const headers = [
        'Nombre proveedor', 'Rut', 'Monto', 'Banco',
        'Tipo de cuenta bancaria', 'Número cuenta bancaria', 'Correo proveedor',
      ];
      const rows = allInvoices.map((inv) => {
        const pi = paymentInfoMap.get(inv.supplierId);
        return [
          supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
          inv.issuerTaxIdentifier,
          inv.grossAmount?.toString() ?? '',
          pi?.bank ?? '',
          pi?.accountType ? (ACCOUNT_TYPE_LABELS[pi.accountType] ?? pi.accountType) : '',
          pi?.accountNumber ?? '',
          pi?.email ?? '',
        ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina-aprobadas-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingNomina(false);
    }
  };

  const filtered = invoices.filter(
    (inv) => !debouncedSearch
      || inv.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.documentNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.issuerTaxIdentifier.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const totalApproved = filtered.reduce((sum, inv) => sum + (inv.grossAmount ?? 0), 0);

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
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-lg font-semibold">Aprobadas</h1>
        </header>

        {/* Summary card */}
        <div className="flex gap-4 border-b px-4 py-3">
          <div className="rounded-lg border bg-emerald-50 px-4 py-2">
            <p className="text-xs text-emerald-700">Por pagar (aprobadas)</p>
            <p className="text-lg font-semibold text-emerald-800">{formatCLP(totalApproved)}</p>
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
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={handleDownloadNomina}
            disabled={downloadingNomina}
          >
            <DownloadIcon className="h-4 w-4" />
            {downloadingNomina ? 'Descargando...' : 'Descargar nomina'}
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
                        className="min-w-[180px] cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
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
                        aria-sort={getSortAriaValue('aprobado_el')}
                        className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => handleSort('aprobado_el')}
                      >
                        Aprobado el<SortIcon column="aprobado_el" />
                      </TableHead>
                      <TableHead className="text-center">Aprobado por</TableHead>
                      <TableHead className="text-center">IA</TableHead>
                      <TableHead
                        aria-sort={getSortAriaValue('plazo')}
                        className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => handleSort('plazo')}
                      >
                        Plazo<SortIcon column="plazo" />
                      </TableHead>
                      <TableHead className="w-[60px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[180px]">
                              {inv.supplierName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {inv.issuerTaxIdentifier}
                              {' · N° '}
                              {inv.documentNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {inv.documentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <span className="text-sm">{formatDate(inv.issueDate)}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <span className="text-sm">{formatDate(inv.approvedAt)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {inv.approver ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-7 w-7 cursor-default">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                      {getUserInitials(inv.approver)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent className="text-left">
                                  <p className="font-medium">{getUserDisplayName(inv.approver)}</p>
                                  <p className="text-muted-foreground">{inv.approver.email}</p>
                                  <p className="capitalize text-muted-foreground">
                                    {inv.approver.role}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {inv.aiValidated ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CheckCircle2Icon className="h-4 w-4 text-emerald-600 mx-auto" />
                              </TooltipTrigger>
                              <TooltipContent>Validado por IA</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <XCircleIcon className="h-4 w-4 text-red-500 mx-auto" />
                              </TooltipTrigger>
                              <TooltipContent>No validado por IA</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <span className={cn('text-sm', deadlineClass(inv.executiveTitleDate))}>
                            {formatDate(inv.executiveTitleDate)}
                          </span>
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
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(inv)}>
                                Marcar como pagada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                          No hay facturas aprobadas
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
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(inv)}>
                            Marcar como pagada
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{inv.documentType}</Badge>
                      <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          {'Emisión: '}
                          <strong>{formatDate(inv.issueDate)}</strong>
                        </span>
                        <span className={cn(deadlineClass(inv.executiveTitleDate))}>
                          {'Plazo: '}
                          <strong>{formatDate(inv.executiveTitleDate)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>
                          {'Aprobado: '}
                          <strong>{formatDate(inv.approvedAt)}</strong>
                        </span>
                        <div className="flex items-center gap-1">
                          {inv.approver && (
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {getUserInitials(inv.approver)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {inv.aiValidated
                            ? <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                            : <XCircleIcon className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">
                    No hay facturas aprobadas
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
    </TooltipProvider>
  );
}
